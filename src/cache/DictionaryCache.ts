import {FrameGuiElement, LuaGuiElement, PlayerIndex, ProgressBarGuiElement} from "factorio:runtime";
import {registerCache, CacheFactory, GlobalCache, getGlobalCache} from "Cache";
import GeneralizedSuffixTree from "search/suffixtree/GeneralizedSuffixTree";
import ISearchable from "search/Searchable";
import MigratablePrototype from "PrototypeHelper";
import {DictionaryTask} from "Task";
import PlayerData from "PlayerData";

/** @noResolution */
import * as FLIB_dictionary_lite from "__flib__.dictionary";
/** @noResolution */
import * as FLIB_on_tick_n from "__flib__.on-tick-n"
/** @noResolution */
import * as FLIB_gui from "__flib__.gui";
/** @noResolution */
import * as mod_gui from "__core__.lualib.mod-gui";

export type DictionaryEntry = {
    type: string,
    id: string,
    name: string,

    order: string,
    hidden: boolean
}

declare const storage: {
    playerData: typeof PlayerData
}


const cache_id = "dicts_cache"

let DictionaryCacheFactory: CacheFactory = {
    cache_id: cache_id,
    cache_name: "Dictionary Cache",
    global_cache: true,

    Create(): GlobalCache {
        return new DictionaryCache();
    },

    Load(cache: GlobalCache): void {
        DictionaryCache.Load((<DictionaryCache>cache))
    }
}

registerCache(DictionaryCacheFactory)

// TODO move to global cache and have a GST only once per language
function getDictionaryCache(): undefined | DictionaryCache {
    return getGlobalCache(DictionaryCacheFactory.cache_id) as DictionaryCache
}


const NUM_SUFFIXTREE_INSERTIONS = 10

type TranslationData = {
    dictionary_suffix_tree: LuaTable<string, GeneralizedSuffixTree<DictionaryEntry>>;
    searchables: LuaMap<string, ISearchable<DictionaryEntry>>
};

class DictionaryCache implements GlobalCache {
    readonly id: string = DictionaryCacheFactory.cache_id;
    readonly name: string = DictionaryCacheFactory.cache_name;
    readonly is_global: true = true;

    indexing_ongoing: LuaTable<string, FLIBTaskIdent>;
    translated_languages: LuaSet<string>;

    translation_data: LuaTable<string, TranslationData>

    constructor() {
        this.indexing_ongoing = new LuaTable()
        this.translated_languages = new LuaSet()
        this.translation_data = new LuaTable()
    }

    static Load(this: void, cache?: DictionaryCache) {
        if (cache == undefined) return

        // @ts-ignore
        setmetatable(cache, DictionaryCache.prototype)

        if (cache.translation_data != undefined) {
            for (let [, tl_data] of cache.translation_data) {
                for (let [ , stree] of tl_data.dictionary_suffix_tree) {
                    GeneralizedSuffixTree.Load(stree)
                }
            }
        }
    }

    execute_task(dictTask: DictionaryTask) {
        if (dictTask.type != "dictionary") return

        const curDict = dictTask.dictionaries[0]
        let end_index: number | undefined = 0

        if (curDict != undefined) {
            end_index = this.buildPartialSuffixtree(
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

        this.updateProgressUI(dictTask)

        if (dictTask.dictionaries.length > 0) {
            dictTask.start_index = end_index

            this.indexing_ongoing.set(
                dictTask.language,
                FLIB_on_tick_n.add(game.tick + 1, dictTask)
            )
        } else {
            this.indexing_ongoing.delete(dictTask.language)
            this.translated_languages.add(dictTask.language)

            for (let [player_index, player] of game.players) {
                // @ts-ignore
                if (player.locale == dictTask.language) {
                    game.get_player(player_index)?.print("Factorio Codex: Quick search is now ready to be used!")
                    storage.playerData?.getQuickSearch(player_index)?.update_input()
                }
            }
        }
    }

    indexDictionaries(player_index: PlayerIndex) {
        // @ts-ignore
        const language_id = game.get_player(player_index)?.locale
        if (this.indexing_ongoing.has(language_id) || this.translated_languages.has(language_id)) return

        const all_dicts = FLIB_dictionary_lite.get_all(player_index)

        if (all_dicts == undefined) {
            $log_crit(`Translation failed: no localised names for player ${$get_player_string!(player_index)}`,
                "all_dicts is undefined => translation didnt finish; was this function called outside of \"on_player_dictionaries_ready\"?")
            return;
        } else {
            const players_for_lang: string[] = []

            /*for (let [player_index, _] of this.player_languages) {
                players_for_lang.push($get_player_string!(player_index))
            }*/

            $log_info!(`Completed translation for ${$get_player_string!(player_index)} (${language_id})`)
        }

        const dictTask: DictionaryTask = {
            type: "dictionary",
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

        this.indexing_ongoing.set(
            language_id,
            FLIB_on_tick_n.add(game.tick + 1, dictTask)
        )
    }

    // @annotationDeprecated
    getNamesTranslation(type: string): undefined | LuaTable<string,string> {
        return undefined
    }

    isTranslated(arg: PlayerIndex | string): boolean {
        let language_id: string

        if (typeof arg != "string") {
            // @ts-ignore
            language_id = game.get_player(arg)?.locale
        } else {
            language_id = arg
        }
        return this.translated_languages.has(language_id)
    }

    buildPartialSuffixtree(language_id: string, name: string, data: LuaTable<string, string>, start_index: number): number | undefined {
        let tl_data = this.translation_data.get(language_id)

        if (tl_data == undefined) {
            tl_data = {
                dictionary_suffix_tree: new LuaTable<string, GeneralizedSuffixTree<DictionaryEntry>>(),
                searchables: new LuaMap()
            }
            this.translation_data.set(language_id, tl_data)
        }

        let stree: GeneralizedSuffixTree<DictionaryEntry> = tl_data.dictionary_suffix_tree.get(name)

        if (stree == undefined || start_index == 0) {
            $log_debug!(`Created suffix tree for "${name}"`)
            stree = new GeneralizedSuffixTree<DictionaryEntry>()
            tl_data.dictionary_suffix_tree.set(name, stree)
        }

        let cur_suffixtree_insetions = settings.global["fcodex_indexing_speed"].value
        if (typeof cur_suffixtree_insetions !== "number" || isNaN(cur_suffixtree_insetions) || cur_suffixtree_insetions <= 0) {
            cur_suffixtree_insetions = NUM_SUFFIXTREE_INSERTIONS
        }

        // @ts-ignore
        let relevantProtos: LuaTable<string, MigratablePrototype<LuaItemPrototype>> = prototypes[name]

        $log_debug!(`Building suffix tree for "${name}" ${start_index}/${table_size(data)}; + ${cur_suffixtree_insetions} entries`)

        let i = 0
        for (let [id, translated] of data) {
            i++
            if (i < start_index) {
                continue;
            }

            if (i > start_index + cur_suffixtree_insetions) break;

            let proto = relevantProtos.get(id)
            if (proto == undefined || !proto.valid) continue // skip invalid prototypes

            let dictEntry: DictionaryEntry = {
                type: name,
                id: id,
                name: translated,
                order: proto?.order,
                hidden: proto.hidden_in_factoriopedia
            }

            stree.add(translated.toLowerCase(), dictEntry)
        }

        if (i < table_size(data)) {
            return i;
        }
        $log_debug!(`Completed build of suffix tree for "${name}"`)
        tl_data.searchables.set(name, stree)
        return undefined;
    }

    getSearchables(player_index: PlayerIndex, toSearch?: LuaSet<string>): ISearchable<DictionaryEntry>[] {
        // @ts-ignore
        const language_id = game.get_player(player_index)?.locale

        let searchables: ISearchable<DictionaryEntry>[] = []
        for(const [name, s] of this.translation_data.get(language_id).searchables) {
            if (toSearch == undefined || toSearch.has(name)) searchables.push(s)
        }

        return searchables
    }

    // inspired by flib's dictionary-lite::update_gui
    private updateProgressUI(dictTask: DictionaryTask) {
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

    Rebuild() {
        this.translated_languages = new LuaSet()
        this.translation_data = new LuaTable()
    }

    validate(): void {

    }
}

export default DictionaryCache
export {getDictionaryCache, cache_id}