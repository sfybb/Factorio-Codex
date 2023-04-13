/** @noResolution */
import * as FLIB_dictionary from "__flib__.dictionary"
FLIB_dictionary.set_use_local_storage(true)

import {getDictionaryCache} from "cache/DictionaryCache";
import {getPrototypeCache} from "cache/PrototypeCache"
import PlayerData from "PlayerData";

declare const global: {
    playerData: typeof PlayerData
}

let empty_prototypes = true

namespace Dictionary {
    let tmp = 0

    let build_done: boolean = false;
    let dict_list: {
        names: LuaTable<string, FLIBRawDictionary>,
        descs: LuaTable<string, FLIBRawDictionary>,
    } = {
        names: new LuaTable(),
        descs: new LuaTable()
    }
    export function Init(): void {
        FLIB_dictionary.init()

        Dictionary.Build()
    }

    export function Load(): void {
        FLIB_dictionary.load()
    }

    export function translate(player_index: PlayerIndex): void {
        let player = game.get_player(player_index)

        // Only translate if they're connected - if they're not, then it will not work!
        if (player?.connected == true) {
            FLIB_dictionary.translate(player)
        }
    }

    export function cancel_translate(player_index: PlayerIndex): void {
        FLIB_dictionary.cancel_translation(player_index)
    }

    export function check_skipped(): void {
        FLIB_dictionary.check_skipped()
    }

    export function Build(): void {
        if (build_done ) {
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

        let protoTable = new LuaTable<string, LuaTable<string, LuaFluidPrototype | LuaItemPrototype |
                                              LuaTechnologyPrototype | LuaTilePrototype>>()
        // @ts-ignore
        protoTable.set("fluid", prototypes.fluid)
        // @ts-ignore
        protoTable.set("item", prototypes.item)
        // @ts-ignore
        protoTable.set("technology", prototypes.technology)
        // @ts-ignore
        //protoTable.set("tile", prototypes.tile)

        for (let [type, list] of protoTable) {
            let names = FLIB_dictionary.new(type + "_names")
            //let desc  = FLIB_dictionary.new(type + "_descriptions")

            // @ts-ignore
            for (let [name, proto] of list) {
                names.add(name, proto.localised_name)
                //desc.add( name, proto.localised_description)
            }
            dict_list.names.set(type, names)
            //dict_list.descs.set(type, desc)
        }
        build_done = true
    }

    export function Rebuild(): void {
        $log_info!("Rebuilding dictionaries...")
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

        $log_info!(`Kicking off translation for ${players_to_translate.join(", ")}...`)
    }

    export function string_translated(this: void, e: OnStringTranslatedEvent): void {
        if (empty_prototypes) return

        let lang_data = FLIB_dictionary.process_translation(e)

        // @ts-ignore
        /*if (tmp < 5 && e.translated && e.localised_string[2].indexOf("factorio-codex") != 0) {
            tmp++

            $log_info!(`=============== [${tmp}] ===============`)
            $log_info!(`${serpent.line(e.localised_string, {comment: false})}`)
            for (let [n, dict] of dict_list.names) {
                $log_info!(`${n}:    I ${dict.dict_i} / Total ${dict.total}  Batch ${dict.batch_i}`)
            }
        }*/

        if ( lang_data != undefined ) {
            for (let player_index of lang_data.players) {
                let dict_cache = getDictionaryCache(player_index)
                if (dict_cache == undefined) {
                    $log_crit!(`Cannot query cache \"dicts_cache\" for player with index ${player_index}!` +
                        " (This means creating the cache must have failed too)")
                    continue
                }

                let was_translated = dict_cache.isTranslated()
                dict_cache.loadLanguageData(lang_data)

                if (!was_translated) {
                    game.get_player(player_index)?.print("Factorio Codex: Quick search is now ready to be used!")
                }

                global.playerData?.getQuickSearch(player_index)?.update_input()
            }
        }
    }
}

export default Dictionary;