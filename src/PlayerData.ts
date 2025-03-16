import {PlayerIndex} from "factorio:runtime";
import {default as Util, validate_status, validate_print_info} from "Util";
import QuickSearch from "QuickSearch";

import Dictionary from "Dictionary";
import Cache from "Cache";
import verify /*, {$verifyObject}*/ from "Validate";
import {GuiAction} from "./IGuiRoot";


export interface player_data {
    quick_search: QuickSearch
}

export type player_table = LuaMap<PlayerIndex, player_data>

declare let storage: {
    playerData: typeof PlayerData
    cache: Cache
    players?: player_table
}

type indirect_player_index = PlayerIndex | { player_index: PlayerIndex }

namespace PlayerData {
    export function Init(this: any) {
        $log_debug!("Running initialization")
        storage = storage ?? {}
        storage.players = new LuaTable()
        storage.cache = new Cache()

        // @ts-ignore
        storage.playerData = {}
        // @ts-ignore
        setmetatable(storage.playerData, {__index: PlayerData })

        Dictionary.Init()
    }

    export function Load(this: any) {
        PlayerData.LoadMetatables()

        if (storage?.cache != undefined) {
            Cache.load(storage.cache)
        } else {
            $log_warn!("Unable to load Cache! Cache has not been created yet!")
        }
    }

    export function Rebuild() {
        // Destroy all guis before deleting the references to them
        if (storage?.players != null) {
            for (let [i, player_data] of storage.players) {
                player_data?.quick_search?.destroy()
            }
        }

        Init();
    }

    export function LoadMetatables() {
        if (storage?.playerData != undefined) {
            // @ts-ignore
            setmetatable(storage.playerData, {__index: PlayerData })
        }

        if (storage?.players != null) {
            for (let [i, player_data] of storage.players) {
                if (player_data == null) {
                    $log_warn!(`Player with index ${i} has no data that could be loaded!`)
                    continue
                }

                $log_info!(`Loading data for player with index ${i}...`)

                if (player_data.quick_search != null) {
                    QuickSearch.load(player_data.quick_search)
                } else {
                    $log_warn!(`QuickSearch is undefined for player with index ${i}!`)
                }
            }
        }
    }

    export function InitPlayer(this: void, index: PlayerIndex): undefined | player_data {
        const player = game.get_player(index)
        if (player == null) {
            $log_warn!(`Invalid request of player data initialization! Player with index ${index} does not exist!`)
            return undefined
        }
        if (storage?.players == undefined) {
            storage.players = new LuaTable();
        }

        $log_info!(`Initializing data for player \"${player.name}\" (index: ${index})...`)

        const data: player_data = {
            quick_search: new QuickSearch(index),
        }
        storage.players.set(index, data)

        return data;
    }

    export function get(this: void, ind_pi: indirect_player_index): undefined | player_data {
        const index = get_player_index(ind_pi)
        if (index == 0) {
            $log_crit!("Unable to find player data", `Invalid player index ${serpent.line(ind_pi, {comment: false, nocode: true})}!`)
            return undefined
        }

        if (storage == undefined || storage.players == null) {
            $log_info!("Empty storage table, did someone delete our data?")
        }

        $log_trace!(`Retrieving data for player with index ${index}`)
        const data = storage.players?.get(index)

        return data ?? PlayerData.InitPlayer(index)
    }

    export function getQuickSearch(this: void, ind_pi: indirect_player_index): undefined | QuickSearch {
        const data = PlayerData.get(ind_pi)
        return data?.quick_search
    }

    export function handleUIEvents(this: any, e: GuiEventData) {
        let gui = e.element?.tags["gui"] ?? null

        if (typeof gui == "string") {
            switch (gui) {
                case "quick_search":
                    PlayerData.getQuickSearch(e)?.gui_action(e)
                    break
                case "common":
                    let parent_ele = e.element?.parent?.parent
                    if (parent_ele != undefined && parent_ele["list_container"] != undefined) {
                        parent_ele["list_container"].visible = !parent_ele["list_container"].visible
                    }
                    break
                default:
                    break
            }
        }
    }

    export function validate() {
        $log_info!("Validating storage table...")

        if (storage.playerData == undefined) {
            $log_info!("Adding storage access to playerdata")
            // @ts-ignore
            storage.playerData = {}
        }
        // @ts-ignore
        setmetatable(storage.playerData, {__index: PlayerData })

        const print_info: validate_print_info = {
            width: 40,
            indent_step: "    ", // 4 spaces
            current_indent: "", // start - no ident
        }

        let status = storage.cache == undefined ? validate_status.ERROR : validate_status.OK
        $log_info!(Util.format_validate_msg(print_info, "cache", status))


        status = storage.players == undefined ? validate_status.FIXED : validate_status.OK
        $log_info!(Util.format_validate_msg(print_info, "players", status))
        if (status == validate_status.FIXED) {
            storage.players = new LuaTable()
        } else {
            let array_pi = print_info
            let player_data_pi = print_info
            let player_obj_pi = print_info

            array_pi.current_indent       = print_info.current_indent     + array_pi.indent_step
            player_data_pi.current_indent = array_pi.current_indent       + player_data_pi.indent_step
            player_obj_pi.current_indent  = player_data_pi.current_indent + player_obj_pi.indent_step

            // @ts-ignore
            let tbl: player_table = storage.players
            for (let [i, player_data] of tbl) {
                if (i == null) {
                    continue
                }

                status = player_data == undefined ? validate_status.FIXABLE : validate_status.OK
                $log_info!(Util.format_validate_msg(array_pi, `[${i}]`, status))
                if (status == validate_status.FIXABLE) {
                    // @ts-ignore
                    storage.players.delete(i)
                    continue
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