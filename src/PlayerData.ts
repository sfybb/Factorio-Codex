import { default as Util, validate_status, validate_print_info } from "Util";
import QuickSearch from "QuickSearch";
import Codex from "Codex";

import Dictionary from "Dictionary";
import Cache from "Cache";
import verify from "Validate";


export interface player_data {
    codex: Codex,
    quick_search: QuickSearch
}

export type player_table = LuaMap<PlayerIndex, player_data>

declare const global: {
    playerData: typeof PlayerData
    cache: Cache
    players?: player_table
}

type indirect_player_index = PlayerIndex | { player_index: PlayerIndex }

namespace PlayerData {
    export function Init() {
        global.players = new LuaTable()
        global.cache = new Cache()

        Dictionary.Init()
        Codex.Init()
    }

    export function  Load() {
        PlayerData.LoadMetatables()

        if (global.cache != undefined) {
            Cache.load(global.cache)
        } else {
            $log_warn("Unable to load Cache! Cache has not been created yet!")
        }

        Dictionary.Load()
        Dictionary.Build()
    }

    export function  LoadMetatables() {
        if (global?.players != null) {
            for (let [i, player_data] of global.players) {
                if (player_data == null) {
                    $log_warn!(`Player with index ${i} has no data that could be loaded!`)
                    continue
                }

                $log_info!(`Loading data for player with index ${i}...`)

                if (player_data.codex != null) {
                    Codex.load(player_data.codex)
                } else {
                    $log_warn!(`Codex is undefined for player with index ${i}!`)
                }

                if (player_data.quick_search != null) {
                    QuickSearch.load(player_data.quick_search)
                } else {
                    $log_warn!(`QuickSearch is undefined for player with index ${i}!`)
                }
            }
        }
    }

    export function  InitPlayer(this: void, index: PlayerIndex): undefined | player_data {
        const player = game.get_player(index)
        if (player == null) {
            $log_warn!(`Invalid request of player data initialization! Player with index ${index} does not exist!`)
            return undefined
        }
        if (global?.players == undefined) {
            global.players = new LuaTable();
        }

        $log_info!(`Initializing data for player \"${player.name}\" (index: ${index})...`)

        const data: player_data = {
            codex: new Codex(index),
            quick_search: new QuickSearch(index),
        }
        global.players.set(index, data)

        return data;
    }

    export function  get(this: void, ind_pi: indirect_player_index): undefined | player_data {
        const index = get_player_index(ind_pi)
        if (index == 0) {
            $log_crit!(`Invalid player index ${serpent.line(ind_pi, {comment: false, nocode: true})}!`)
            return undefined
        }

        $log_trace!(`Retrieving data for player with index ${index}`)
        const data = global.players?.get(index)

        return data != undefined ? data : PlayerData.InitPlayer(index)
    }

    export function  getCodex(this: void, ind_pi: indirect_player_index): undefined | Codex {
        const data = PlayerData.get(ind_pi)
        return data?.codex
    }

    export function  getQuickSearch(this: void, ind_pi: indirect_player_index): undefined | QuickSearch {
        const data = PlayerData.get(ind_pi)
        return data?.quick_search
    }

    export function  create_player(this: void, e: OnPlayerCreatedEvent) {
        Dictionary.translate(e.player_index)
        PlayerData.get(e)
    }

    export function  player_update(this: void, e: OnPlayerJoinedGameEvent) {
        Dictionary.translate(e.player_index)
    }

    export function  cancel_player_update(this: void, e: OnPlayerLeftGameEvent) {
        Dictionary.cancel_translate(e.player_index)
    }

    export function  string_translated(this: void, e: OnStringTranslatedEvent) {
        Dictionary.string_translated(e)
    }

    export function  check_skipped(this: void) {
        Dictionary.check_skipped()
    }

    export function  validate() {
        $log_info!("Validating global table...")

        global.playerData = PlayerData

        const print_info: validate_print_info = {
            width: 40,
            indent_step: "    ", // 4 spaces
            current_indent: "", // start - no ident
        }

        let status = global.cache == undefined ? validate_status.ERROR : validate_status.OK
        $log_info!(Util.format_validate_msg(print_info, "cache", status))


        status = global.players == undefined ? validate_status.FIXED : validate_status.OK
        $log_info!(Util.format_validate_msg(print_info, "players", status))
        if (status == validate_status.FIXED) {
            global.players = new LuaTable()
        } else {
            let array_pi = print_info
            let player_data_pi = print_info
            let player_obj_pi = print_info

            array_pi.current_indent       = print_info.current_indent     + array_pi.indent_step
            player_data_pi.current_indent = array_pi.current_indent       + player_data_pi.indent_step
            player_obj_pi.current_indent  = player_data_pi.current_indent + player_obj_pi.indent_step

            // @ts-ignore
            let tbl: player_table = global.players
            for (let [i, player_data] of tbl) {
                if (i == null) {
                    continue
                }

                status = player_data == undefined ? validate_status.FIXABLE : validate_status.OK
                $log_info!(Util.format_validate_msg(array_pi, `[${i}]`, status))
                if (status == validate_status.FIXABLE) {
                    // @ts-ignore
                    global.players.delete(i)
                    continue
                }

                status = player_data.codex == undefined ? validate_status.FIXABLE : validate_status.OK
                $log_info!(Util.format_validate_msg(array_pi, "codex", status))
                if (status == validate_status.OK) {
                    status = verify(player_data.codex, player_obj_pi, i)
                }
                if (status == validate_status.ERROR || status == validate_status.FIXABLE) {
                    if (player_data.codex != undefined) player_data.codex.destroy()
                    player_data.codex = new Codex(i)
                    $log_info!("Rebuilt Codex")
                }

                status = player_data.quick_search == undefined ? validate_status.FIXABLE : validate_status.OK
                $log_info!(Util.format_validate_msg(array_pi, "quick_search", status))
                if (status == validate_status.OK) {
                    status = player_data.quick_search.validate(player_obj_pi, i)
                }
                if (status == validate_status.ERROR || status == validate_status.FIXABLE) {
                    if (player_data.quick_search != undefined) player_data.quick_search.destroy()
                    player_data.quick_search = new QuickSearch(i)
                    $log_info!("Rebuilt Quick Search")
                }
            }
        }
    }
}

global.playerData = PlayerData

function get_player_index(ind_pi: indirect_player_index): PlayerIndex {
    if ( typeof (ind_pi) == "number" ) {
        return ind_pi as PlayerIndex
    } else if ( "player_index" in ind_pi && ind_pi.player_index != undefined ) {
        return ind_pi.player_index
    } else {
        return 0 as PlayerIndex
    }
}

export default PlayerData