import {PlayerIndex} from "factorio:runtime";
/** @noResolution */
import * as FLIB_dictionary_lite from "__flib__.dictionary-lite";
import {cache_id as dict_cache_id} from "../cache/DictionaryCache";
import {PlayerCache} from "../Cache";

declare const global: {
    cache?: {
        playerCaches?: LuaTable<PlayerIndex, LuaTable<string, PlayerCache>>;
    }
}

function migration() {
    $log_info!("Applying migrations for 0.0.20")

    FLIB_dictionary_lite.on_init()

    // delete the DictionaryCache from player caches
    const pCaches = global?.cache?.playerCaches
    if (pCaches != undefined)  {
        const affectedPlayers: string[] = []
        for (let [pId, pCacheList] of pCaches) {
            if (pCacheList == undefined) continue
            for (let [id, pCache] of pCacheList) {
                if (id == dict_cache_id) {
                    pCacheList.delete(id)
                    affectedPlayers.push($get_player_string!(pId))
                    break
                }
            }
        }
        $log_debug!(`Removed old dictionary cache for players ${affectedPlayers.join(", ")}`)
    }
}

export = migration