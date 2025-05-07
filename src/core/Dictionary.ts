import {
    FrameGuiElement,
    LuaFluidPrototype, LuaGuiElement,
    LuaItemPrototype,
    LuaTechnologyPrototype,
    LuaTilePrototype,
    PlayerIndex, ProgressBarGuiElement
} from "factorio:runtime";
import MigratablePrototype from "../PrototypeHelper";
import {getGlobalData, registerDataInitializer} from "./dataHandler";
import GeneralizedSuffixTree from "./GeneralizedSuffixTree";
import {TaskBaseData, TaskID, TaskScheduler} from "../events/taskScheduler";
import {GameEventRegistry} from "../events/eventRegistry";
/** @noResolution */
import * as FLIB_gui from "__flib__.gui";
/** @noResolution */
import * as FLIB_dictionary_lite from "__flib__.dictionary";
/** @noResolution */
import * as mod_gui from "__core__.lualib.mod-gui";
/** @noResolution */
import * as EventHandler from "__core__.lualib.event_handler";

export type DictionaryEntry = {
    type: string,
    id: string,
    name: string,

    order: string,
    hidden: boolean
}
declare const prototypes: {
    fluid: LuaMap<string, MigratablePrototype<LuaFluidPrototype>>,
    item: LuaMap<string, MigratablePrototype<LuaItemPrototype>>,
    technology: LuaMap<string, MigratablePrototype<LuaTechnologyPrototype>>,
    tile: LuaMap<string, MigratablePrototype<LuaTilePrototype>>
}

declare const storage: {
    __flib: any
}

interface TranslationData {
    // Contains a suffix tree for each prototype type (e.g. fluid, item, etc.)
    suffix_trees: LuaMap<string, GeneralizedSuffixTree<DictionaryEntry>>;
    finished: boolean;
}

export interface DictionaryData {
    // Contains TranslationData for each language id
    translations: LuaMap<string, TranslationData>;
    indexing_ongoing: LuaMap<string, TaskID>;

    init_ran: boolean;
}

interface DictionaryTask extends TaskBaseData {
    language: string,
    dictionaries: {
        name: string,
        num_entries: number,
        data: LuaTable<string, string>
    }[],
    start_index: number,
    num_indexed_entries: number,
    num_all_entries: number
}

export interface ISearchable<T extends AnyNotNil> {
    getResults(search: string, set: LuaSet<T>): void
}

namespace Dictionary {
    export const id = "dictionary";

    let build_done: boolean = false;
    export function Init(this: any): DictionaryData {
        FLIB_dictionary_lite.on_init()
        Dictionary.Build()

        FLIB_dictionary_lite.on_tick()

        return {
            translations: new LuaMap(),
            indexing_ongoing: new LuaMap(),

            init_ran: true,
        }
    }

    export function Load(this: any, dictData: DictionaryData): void {
        if (dictData === undefined || dictData.translations == undefined) return

        for (const [_, tData] of dictData.translations) {
            if (tData != undefined && tData.suffix_trees != undefined) {
                for (const [_, tree] of tData.suffix_trees) {
                    GeneralizedSuffixTree.Load(tree)
                }
            }
        }
    }

    export function Build(): void {
        if (build_done) {
            return
        }

        $log_info!("Building raw dictionaries...")

        let luaPrototypes = {
            fluid: prototypes.fluid,
            item: prototypes.item,
            technology: prototypes.technology
        }

        let ignoreList: { [key: string]: { [key: string]: boolean } | undefined } = {
            fluid: {"parameter-0": true, "parameter-1": true, "parameter-2": true, "parameter-3": true,
                "parameter-4": true, "parameter-5": true, "parameter-6": true, "parameter-7": true, "parameter-8": true,
                "parameter-9": true},
            item: {},
            technology: {}
        }

        if (luaPrototypes == undefined) {
            $log_warn!("No prototype definitions in cache! Cannot start translation!")
            return;
        }

        let protoTable = new LuaTable<string, LuaTable<string, MigratablePrototype<LuaFluidPrototype | LuaItemPrototype |
            LuaTechnologyPrototype | LuaTilePrototype>>>()

        if (luaPrototypes.fluid != undefined) {
            // @ts-ignore
            protoTable.set("fluid", luaPrototypes.fluid)
        }
        if (luaPrototypes.item != undefined) {
            // @ts-ignore
            protoTable.set("item", luaPrototypes.item)
        }
        if (luaPrototypes.technology != undefined) {
            // @ts-ignore
            protoTable.set("technology", luaPrototypes.technology)
        }
        // @ts-ignore
        //protoTable.set("tile", prototypes.tile)
        for (let [type, list] of protoTable) {
            const dict_name = type + "_names"
            FLIB_dictionary_lite.new(dict_name) // TODO Crash here

            $log_info!(`Creating dictionary ${dict_name}`)
            let invalidProtos = []

            // @ts-ignore
            for (let [name, proto] of list) {
                if (!proto.valid){
                    invalidProtos.push(name)
                    continue
                }

                // @ts-ignore
                if (proto.hidden_in_factoriopedia == true) continue;
                // @ts-ignore
                if (ignoreList[type] != undefined && ignoreList[type][name]) continue;

                FLIB_dictionary_lite.add(dict_name, name, proto.localised_name)
                //desc.add( name, proto.localised_description)
            }
            if (invalidProtos.length > 0) {
                $log_warn!(`Skipped ${invalidProtos.length} invalid ${type} prototypes!${
                    serpent.line(invalidProtos, {comment: false, maxnum: 10})}`)
            }
        }
        build_done = true

        // Request translation for all connected players
        let printed = false;
        for (let [player_index, player] of game.players) {
            if (!printed) {
                printed = true;
                $log_info!("Kicking off translation...")
            }
            if (player.connected){
                FLIB_dictionary_lite.on_player_joined_game({
                    name: defines.events.on_player_joined_game,
                    tick: 0,
                    player_index: player_index
                })
            }
        }
    }

    export function Rebuild(): void {
        $log_info!("Rebuilding dictionaries...")
        build_done = false

        // Nuke flib data
        if (storage.__flib != undefined) {
            storage.__flib.dictionary = null
        }
        $log_info!(`${serpent.line(storage.__flib)}`)

        // Will initialize the data again, since dictionary is part of the global data
        getGlobalData()
    }

    export function on_player_dictionaries_ready(this: any, e: FLIB_dictionary_lite.OnDictionaryReadyEvent, lang_data?: FLIBTranslationFinishedOutput) {
        const player_index = e.player_index
        // @ts-ignore
        const language_id = game.get_player(player_index)?.locale
        const dictData = getGlobalData().dictionary
        if (dictData.indexing_ongoing.has(language_id) || dictData.translations.get(language_id)?.finished) return

        const all_dicts = FLIB_dictionary_lite.get_all(player_index)

        if (all_dicts == undefined) {
            $log_crit(`Translation failed: no localised names for player ${$get_player_string!(player_index)}`,
                "all_dicts is undefined => translation didnt finish; was this function called outside of \"on_player_dictionaries_ready\"?")
            return;
        } else {
            $log_info!(`Completed translation for ${$get_player_string!(player_index)} (${language_id})`)
        }

        const dictTask: DictionaryTask = {
            handler_id: Dictionary.id,
            player_index: player_index,

            language: language_id,
            start_index: 0,
            dictionaries: [],

            num_indexed_entries: 0,
            num_all_entries: 0
        }

        for (let [dict_name, dict_data] of all_dicts) {
            const num_entries = table_size(dict_data)
            const name = dict_name.substring(0, dict_name.indexOf("_names"))

            dictTask.dictionaries.push({
                name: name,
                num_entries: num_entries,
                data: dict_data,
            })
            dictTask.num_all_entries += num_entries
        }

        dictData.indexing_ongoing.set(
            language_id,
            TaskScheduler.scheduleTask(dictTask)
        )
    }

    export function handleTask(this: any, task: TaskBaseData) {
        if (task.handler_id != Dictionary.id || task.player_index == undefined) return
        const dictTask = task as DictionaryTask

        const dictData = getGlobalData().dictionary
        const curDict = dictTask.dictionaries[0]

        let end_index: number | undefined = 0

        if (curDict != undefined) {
            end_index = buildPartialSuffixtree(
                dictData,
                dictTask.language,
                curDict.name,
                curDict.data,
                dictTask.start_index)

            if (end_index == undefined) {
                dictTask.num_indexed_entries += (curDict.num_entries - dictTask.start_index)
                dictTask.dictionaries.shift()
                end_index = 0
            } else {
                dictTask.num_indexed_entries += (end_index - dictTask.start_index)
            }
        }

        updateProgressUI(dictTask)

        if (dictTask.dictionaries.length > 0) {
            dictTask.start_index = end_index

            dictData.indexing_ongoing.set(
                dictTask.language,
                TaskScheduler.scheduleTask(dictTask)
            )
        } else {
            dictData.indexing_ongoing.delete(dictTask.language)
            dictData.translations.get(dictTask.language)!.finished = true

            for (let [player_index, player] of game.players) {
                // @ts-ignore
                if (player.locale == dictTask.language) {
                    GameEventRegistry.registry.dispatch(on_translations_indexed, { player_index: player_index })
                }
            }
        }
    }

    function buildPartialSuffixtree(dictData: DictionaryData, language_id: string, name: string, data: LuaTable<string, string>, start_index: number): number | undefined {
        let tl_data = dictData.translations.get(language_id)

        if (tl_data == undefined) {
            tl_data = {
                suffix_trees: new LuaTable<string, GeneralizedSuffixTree<DictionaryEntry>>(),
                finished: false
            }
            dictData.translations.set(language_id, tl_data)
        }

        let stree: GeneralizedSuffixTree<DictionaryEntry> | undefined = tl_data.suffix_trees.get(name)

        if (stree == undefined || start_index == 0) {
            $log_debug!(`Created suffix tree for "${name}"`)
            stree = new GeneralizedSuffixTree<DictionaryEntry>()
            tl_data.suffix_trees.set(name, stree)
        }

        let cur_suffixtree_insetions = getGlobalData().settings.get("indexing_speed")
        if (typeof cur_suffixtree_insetions !== "number" || isNaN(cur_suffixtree_insetions) || cur_suffixtree_insetions <= 0) {
            cur_suffixtree_insetions = 10
        }

        // @ts-ignore
        let relevantProtos: LuaTable<string, MigratablePrototype<LuaItemPrototype>> = prototypes[name];

        $log_debug!(`Building suffix tree for "${name}" ${start_index}/${table_size(data)}; + ${cur_suffixtree_insetions} entries`)

        let i = 0;
        for (let [id, translated] of data) {
            i++
            if (i < start_index) {
                continue;
            }

            if (i > start_index + cur_suffixtree_insetions) break;

            let proto = relevantProtos.get(id);
            if (proto == undefined || !proto.valid) continue; // skip invalid prototypes

            let dictEntry: DictionaryEntry = {
                type: name,
                id: id,
                name: translated,
                order: proto?.order,
                // @ts-ignore
                hidden: proto.hidden_in_factoriopedia
            };

            stree.add(translated.toLowerCase(), dictEntry);
        }

        if (i < table_size(data)) {
            return i;
        }
        $log_debug!(`Completed build of suffix tree for "${name}"`);
        return undefined;
    }

    // inspired by flib's dictionary-lite::update_gui
    function updateProgressUI(dictTask: DictionaryTask) {
        const in_progress = dictTask.dictionaries.length > 0
        //$log_debug!(`Indexing progress for language '${dictTask.language}': ${dictTask.num_indexed_entries}/${dictTask.num_all_entries}`)
        const progress = dictTask.num_indexed_entries / dictTask.num_all_entries

        for (let [, player] of game.players) {
            let frame_flow = mod_gui.get_frame_flow(player)
            let index_mod_frame = frame_flow.fcodex_indexing_progress as FrameGuiElement

            if (in_progress) {
                if (index_mod_frame == undefined) {
                    let refs = FLIB_gui.add(frame_flow, {
                        type: "frame",
                        name: "fcodex_indexing_progress",
                        style: mod_gui.frame_style,
                        direction: "vertical",
                        1: {
                            type: "label",
                            style: "frame_title",
                            caption: [ "gui.fcodex-indexing" ],
                            tooltip: [ "gui.fcodex-indexing-description" ]
                        },
                        2: {
                            type: "frame",
                            name: "pane",
                            style: "inside_shallow_frame_with_padding",
                            direction: "vertical"
                        }
                    }) as LuaMultiReturn<[LuaTable<string, FactorioRuntime.LuaGuiElement>, FrameGuiElement]>
                    index_mod_frame = refs[0].get("fcodex_indexing_progress") as FrameGuiElement
                    $log_info!(`Creating frame ${serpent.line(refs)}`)
                }
                let pane = index_mod_frame.pane as LuaGuiElement
                let lang_flow = pane?.[dictTask.language]

                if (lang_flow == undefined) {
                    let refs = FLIB_gui.add(pane, {
                        type: "flow",
                        name: dictTask.language,
                        style_mods: { vertical_align: "center", top_margin: 4 },
                        1: {
                            type: "label",
                            name: "language",
                            style: "bold_label",
                            caption: dictTask.language,
                            ignored_by_interaction: true
                        },
                        2: {
                            type: "progressbar",
                            name: "bar",
                            ignored_by_interaction: true
                        },
                        3: {
                            type: "label",
                            name: "percentage",
                            style: "bold_label",
                            ignored_by_interaction: true
                        }
                    }) as LuaMultiReturn<[LuaTable<string, FactorioRuntime.LuaGuiElement>, FrameGuiElement]>
                    lang_flow = refs[0].get(dictTask.language)
                }

                if (lang_flow.bar != undefined) (lang_flow.bar as ProgressBarGuiElement).value = progress
                if (lang_flow.percentage != undefined) lang_flow.percentage.caption = `${Math.min(Math.round(progress * 100), 99)}%`
            } else if (index_mod_frame != undefined) {
                let lang_flow = index_mod_frame.pane?.[dictTask.language]

                if (lang_flow != undefined) lang_flow.destroy()
                if (index_mod_frame.pane?.children?.length == 0) index_mod_frame.destroy()
            }
        }
    }

    export function hasTranslations(this: any, player_index: PlayerIndex): boolean {
        // @ts-ignore
        const language_id = game.get_player(player_index)?.locale

        const dictData: DictionaryData = getGlobalData().dictionary
        return dictData && dictData.translations && dictData.translations.has(language_id) &&
            dictData.translations.get(language_id)!.finished
    }

    export function getSearchables(this: any, player_index: PlayerIndex, filter?: LuaSet<string>): ISearchable<DictionaryEntry>[] {
        if (!hasTranslations(player_index)) {
            return [];
        }

        const dictData: DictionaryData = getGlobalData().dictionary
        // @ts-ignore
        const language_id = game.get_player(player_index)?.locale
        const trees = dictData.translations.get(language_id)!.suffix_trees

        let res: ISearchable<DictionaryEntry>[] = []
        for (let [name, t] of trees) {
            if (!filter || filter.has(name)) res.push(t)
        }

        return res
    }
}

export const on_translations_indexed = script.generate_event_name();

registerDataInitializer(Dictionary.id, Dictionary.Init, Dictionary.Load);

TaskScheduler.register(Dictionary.id, Dictionary.handleTask)
GameEventRegistry.register(FLIB_dictionary_lite.on_player_dictionaries_ready, Dictionary.on_player_dictionaries_ready)

EventHandler.add_lib({events: FLIB_dictionary_lite.events})
TaskScheduler.register("flib-dictionary", () => FLIB_dictionary_lite.on_tick());
TaskScheduler.scheduleAlways({
    handler_id: "flib-dictionary",
    player_index: 0 as PlayerIndex
})

export default Dictionary;