/** @noResolution */
import * as FLIB_dictionary_lite from "__flib__.dictionary-lite";

import {getDictionaryCache} from "cache/DictionaryCache";
import {getPrototypeCache} from "cache/PrototypeCache"
import PlayerData from "PlayerData";
import MigratablePrototype from "./PrototypeHelper";
import {Task} from "./Task";

/** @noResolution */
import * as FLIB_on_tick_n from "__flib__.on-tick-n"


declare const global: {
    playerData: typeof PlayerData
}

let empty_prototypes = true

namespace Dictionary {
    let tmp = 0

    let build_done: boolean = false;
    export function Init(): void {
        FLIB_dictionary_lite.on_init()
        Dictionary.Build()
    }

    export function Build(): void {
        if (build_done) {
            return
        }

        $log_info!("Building raw dictionaries...")

        let prototypes = undefined

        let protoCache = getPrototypeCache()
        if (protoCache != undefined && protoCache?.getAll != undefined) {
            prototypes = protoCache.getAll()
        }

        if (prototypes == undefined) {
            $log_warn!("No prototype definitions in cache! Cannot start translation!")
            empty_prototypes = true
            return;
        }
        empty_prototypes = false

        let protoTable = new LuaTable<string, LuaTable<string, MigratablePrototype<LuaFluidPrototype | LuaItemPrototype |
            LuaTechnologyPrototype | LuaTilePrototype>>>()

        if (prototypes.fluid != undefined) {
            // @ts-ignore
            protoTable.set("fluid", prototypes.fluid)
        }
        if (prototypes.item != undefined) {
            // @ts-ignore
            protoTable.set("item", prototypes.item)
        }
        if (prototypes.technology != undefined) {
            // @ts-ignore
            protoTable.set("technology", prototypes.technology)
        }
        // @ts-ignore
        //protoTable.set("tile", prototypes.tile)

        for (let [type, list] of protoTable) {
            const dict_name = type + "_names"
            FLIB_dictionary_lite.new(dict_name)

            let invalidProtos = []

            // @ts-ignore
            for (let [name, proto] of list) {
                if (!proto.valid){
                    invalidProtos.push(name)
                    continue
                }

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
        for (let [player_index, player] of game.players) {
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
        /*$log_info!("Rebuilding dictionaries...")
        build_done = false
        Dictionary.Init()

        let players_to_translate: string[] = []
        for (let [_, player] of game.players) {
            if ( player.connected ) {
                Dictionary.translate(player.index)
                player.print(["", "Kicking off translation for you (lang: ", ["locale-identifier"], ")" ])

                players_to_translate.push(player.name)
            }
        }

        $log_info!(`Kicking off translation for ${players_to_translate.join(", ")}...`)*/
    }

    export function execute_task(dictTask: Task) {
        let dict_cache = getDictionaryCache(dictTask.player_index)

        if (dict_cache == undefined) {
            $log_crit!(`Cannot save translation for ${$get_player_string!(dictTask.player_index)}. Is mod data corrupted?`, `Cache: 'dicts_cache' is undefined. Creation must have failed`)
            return
        }


        if (dictTask.type == "dictionary") {
            //dict_cache.addTranslations()
            const end_index = dict_cache.buildPartialSuffixtree(
                dictTask.dictionary_name,
                dictTask.dictionary_data,
                dictTask.start_index,
                dictTask.notify_on_complete)
            if (end_index != undefined) {
                dictTask.start_index = end_index
                FLIB_on_tick_n.add(game.tick + 1, dictTask)
            } else if (dictTask.notify_on_complete) {
                game.get_player(dictTask.player_index)?.print("Factorio Codex: Quick search is now ready to be used!")
                global.playerData?.getQuickSearch(dictTask.player_index)?.update_input()
            }
        }
    }

    export function on_player_dictionaries_ready(e: FLIB_dictionary_lite.OnDictionaryReadyEvent, lang_data?: FLIBTranslationFinishedOutput) {
        const dictionaries = lang_data?.dictionaries ?? FLIB_dictionary_lite.get_all(e.player_index)
        const player_index = e.player_index

        if (dictionaries == undefined) {
            $log_crit!(`Translation failed`, `No dictionaries were found for player ${$get_player_string!(player_index)}`)
            return
        } else {
            $log_info!(`Completed translation for ${$get_player_string!(player_index)}`)
        }

        const tasks: Task[] = []

        let dictMaxLen = 0, dictIndx = 0, i = 0

        for (let [dictName, dictData] of dictionaries) {
            if (dictName.endsWith("_names")) {
                const name = dictName.substring(0, dictName.indexOf("_names"))

                $log_debug!(`Starting build for suffix tree "${name}"`)
                tasks.push({
                    type: "dictionary",
                    player_index: player_index,

                    dictionary_name: name,
                    dictionary_data: dictData,
                    start_index: 0,
                    notify_on_complete: false
                })

                if (dictMaxLen < table_size(dictData)) {
                    dictMaxLen = table_size(dictData)
                    dictIndx = i
                }

                i++;
            }
        }

        let t = tasks[dictIndx]
        if (t.type == "dictionary") t.notify_on_complete = true

        for (let dictTask of tasks) {
            FLIB_on_tick_n.add(game.tick + 1, dictTask)
        }
    }
}

export default Dictionary;