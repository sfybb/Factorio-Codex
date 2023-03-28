import CacheManager from "Cache";
import {player_table} from "PlayerData";
import Codex from "Codex";
import Dictionary from "Dictionary";

/** @noResolution */
import * as FLIB_on_tick_n from "__flib__.on-tick-n"

declare const global: {
    cache: CacheManager,
    players?: player_table
}

function migrateCodex(c: any, pId: PlayerIndex): Codex {
    if (c == undefined) return new Codex(pId)

    if (c.refs == undefined) c.refs = {}
    if (c.categories == undefined) c.categories = {}
    if (c.categories.refs == undefined) c.categories.refs = {}

    // @ts-ignore
    return {
        player_index: pId,
        visible: c.visible != undefined ? c.visible : false,
        keep_open: false,
        rebuild_gui: c.rebuild_gui != undefined ? c.rebuild_gui : true,
        entity_view: c.entity_view == undefined ? undefined : {
            type: c.entity_view.type,
            id: c.entity_view.id
        },
        refs: {
            window: c.refs.window,
            titlebar_flow: c.refs.titlebar_flow,
            codex_categories: c.refs.codex_categories,
            search_field: c.refs.search_field,

            entity_viewer: c.refs.entity_viewer,
            entity_sprite: c.refs.entity_sprite,
            entity_desc_frame: c.refs.entity_desc_frame,
            entity_desc: c.refs.entity_desc,
            entity_color: c.refs.entity_color,
            entity_usage: c.refs.entity_usage,

            hist_bak: c.refs.hist_bak,
            hist_fwd: c.refs.hist_fwd
        },

        // @ts-ignore
        categories: {
            selected_index: c.categories.selected_index != undefined ? c.categories.selected_index - 1 : -1,
            selected_cat:  c.categories.selected_cat?.name != undefined ? c.categories.selected_cat : undefined,
            rebuild_gui: c.categories.rebuild_gui != undefined ? c.categories.rebuild_gui : true,

            refs: {
                cat_gui: c.categories.refs.cat_gui,
                category_picker: c.categories.refs.category_picker,
                available_entities: {
                    item: c.categories.refs.available_entities?.item != undefined ? c.categories.refs.available_entities.item : undefined,
                    fluid: c.categories.refs.available_entities?.fluid != undefined ? c.categories.refs.available_entities.fluid : undefined,
                    tile: c.categories.refs.available_entities?.tile != undefined ? c.categories.refs.available_entities.tile : undefined,
                    technology: c.categories.refs.available_entities?.technology != undefined ? c.categories.refs.available_entities.technology : undefined,
                }
            },
            entity_lists: {
                item: c.categories.entity_lists?.item != undefined ? c.categories.entity_lists.item : undefined,
                fluid: c.categories.entity_lists?.fluid != undefined ? c.categories.entity_lists.fluid : undefined,
                tile: c.categories.entity_lists?.tile != undefined ? c.categories.entity_lists.tile : undefined,
                technology: c.categories.entity_lists?.technology != undefined ? c.categories.entity_lists.technology : undefined,
            }
        },

        // New Fields
        historyPosition: -1,
        historyList: []
    }
}


function migration_0_0_17(): void {
    FLIB_on_tick_n.init()

    global.cache = new CacheManager()
    Dictionary.Init()
    Codex.Init()

    if (global.players == undefined) {
        global.players = new LuaTable()
    }

    for (let [pId, data] of global.players) {
        if (data == undefined) continue
        $log_info!(`Converting Codex for player ${pId}`)

        if (data.codex != undefined) {
            data.codex = migrateCodex(data.codex, pId)
        }

        /*if(data.quick_search != undefined) {
            migrateQS(data.quick_search)
        }*/
    }
}

export = migration_0_0_17