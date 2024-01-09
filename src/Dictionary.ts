/** @noResolution */
import * as FLIB_dictionary_lite from "__flib__.dictionary-lite";

import {getDictionaryCache} from "cache/DictionaryCache";
import {getPrototypeCache} from "cache/PrototypeCache"
import MigratablePrototype from "./PrototypeHelper";

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
        $log_info!("Rebuilding dictionaries...")
        build_done = false
        Dictionary.Init()
        $log_info!("Kicking off translation...")
    }

    export function on_player_language_changed(language_change: FLIB_dictionary_lite.OnPlayerLanguageChangedEvent) {
        let dict_cache = getDictionaryCache()
        if (dict_cache != undefined) {
            dict_cache.setPlayerLanguage(language_change)
        }
    }

    export function on_player_dictionaries_ready(e: FLIB_dictionary_lite.OnDictionaryReadyEvent, lang_data?: FLIBTranslationFinishedOutput) {
        let dict_cache = getDictionaryCache()
        if (dict_cache != undefined) {
            dict_cache.indexDictionaries(e.player_index)
        }
    }
}

export default Dictionary;