import TechnologyInfo from "codex/TechnologyInfo";
import {Verifiable, Verifyinfo} from "Validate";
import RecipeInfo from "codex/RecipeInfo";
import Categories from "codex/Categories"
import {Task, TaskExecutor} from "Task";
import IGuiRoot, {GuiAction} from "IGuiRoot";
import MigratablePrototype from "PrototypeHelper";

/** @noResolution */
import * as FLIB_gui from "__flib__.gui";

type ViewablePrototype = LuaItemPrototype | LuaTechnologyPrototype | LuaFluidPrototype

type HistoryItem = {
    type: string,
    id: string,
    proto: MigratablePrototype<ViewablePrototype>
}

const gui_name = "codex"

class Codex implements TaskExecutor, Verifiable, IGuiRoot {
    player_index: PlayerIndex;

    categories: Categories;

    visible: boolean;
    keep_open: boolean;
    refs: {
        window?: FrameGuiElement,
        titlebar_flow?: FlowGuiElement,
        codex_categories?: FlowGuiElement,
        search_field?: TextFieldGuiElement,

        entity_viewer?: FlowGuiElement,
        entity_sprite?: SpriteGuiElement,
        entity_desc_frame?: FlowGuiElement,
        entity_desc?: LabelGuiElement,
        entity_color?: ProgressBarGuiElement,
        entity_usage?: ScrollPaneGuiElement,

        hist_bak?: SpriteButtonGuiElement,
        hist_fwd?: SpriteButtonGuiElement,
    };
    rebuild_gui: boolean;

    entity_view?: {
        type: string,
        id: string
    };

    historyList: HistoryItem[];
    historyPosition: number

    constructor(player_index: PlayerIndex) {
        this.player_index = player_index
        this.categories = new Categories()

        this.visible = false
        this.keep_open = false
        this.refs = {}
        this.rebuild_gui = false

        this.entity_view = undefined

        this.historyList = []
        this.historyPosition = -1
    }

    static load(this: void, c: Codex) {
        // @ts-ignore
        setmetatable(c, Codex.prototype)

        if (c?.categories != undefined) Categories.load(c.categories)
    }

    destroy() {
        this.refs?.window?.destroy()
        this.categories?.destroy()

        this.refs = {}

        // remove invalid prototypes in history
        let removed_any = false
        let newHistPosition = this.historyPosition
        for (const i of $range( this.historyList.length - 1,0, -1)) {
            if (this.historyList[i]?.proto.valid != true) {
                table.remove(this.historyList, i+1)
                removed_any = true

                if (i <= this.historyPosition) {
                    newHistPosition--
                }
            }
        }

        this.historyPosition = newHistPosition
        if (removed_any) {
            $log_info!(`Removed invalid history entries and moved history position (new: ${newHistPosition}) for player ${this.player_index}`)
        }
    }

    build_gui() {
        if(this.rebuild_gui) {
            this.destroy()
        }

        let player = game.get_player(this.player_index)
        if (player == null) {
            $log_err!(`Error player_index is invalid! No player with index ${this.player_index} exists!`)
            return
        }

        if ( this.refs?.window?.valid != true ) {
            this.rebuild_gui = false

            this.refs = FLIB_gui.build(player.gui.screen, [{
                type: "frame",
                direction: "vertical",
                style: "fcodex_codex_main",
                ref: ["window"],
                actions: {
                    on_closed: { gui: gui_name, action: "auto_close" }
                },
                1: {
                    type: "flow", ref: ["titlebar_flow"],
                    1: {type: "label", style: "frame_title", caption: "Codex", ignored_by_interaction: true},
                    2: {type: "empty-widget", style: "flib_titlebar_drag_handle", ignored_by_interaction: true},
                    3: {
                        type: "sprite-button",
                        style: "frame_action_button",
                        ref: ["hist_bak"],
                        sprite: "fcodex_history_back",
                        hovered_sprite: "fcodex_history_back_dark",
                        clicked_sprite: "fcodex_history_back",
                        mouse_button_filter: ["left"],
                        actions: {
                            on_click: { gui: gui_name, action: "hist_back" }
                        }
                    },
                    4: {
                        type: "sprite-button",
                        style: "frame_action_button",
                        ref: ["hist_fwd"],
                        sprite: "utility/expand",
                        hovered_sprite: "utility/expand_dark",
                        clicked_sprite: "utility/expand",
                        mouse_button_filter: ["left"],
                        actions: {
                            on_click: { gui: gui_name, action: "hist_fwd" }
                        }
                    },
                    5: {
                        type: "sprite-button",
                        style: "frame_action_button",
                        sprite: "utility/close_white",
                        hovered_sprite: "utility/close_black",
                        clicked_sprite: "utility/close_black",
                        mouse_button_filter: ["left"],
                        actions: {
                            on_click: { gui: gui_name, action: "close" }
                        }
                }},
                2: {
                    type: "frame", direction: "horizontal", style: "fcodex_codex_frame_no_border",
                    1: {
                        type: "flow",
                        direction: "vertical",
                        style: "fcodex_codex_vflow_no_border",
                        ref: ["codex_categories"],
                        1: {
                            type: "textfield",
                            enabled: false,
                            text: "Work In Progress",
                            ref: ["search_field"],
                            actions: {
                                on_text_changed: { gui: gui_name, action: "update_search" }
                            }
                        },
                    },
                    2: {
                        type: "flow",
                        direction: "vertical",
                        ref: ["entity_viewer"],
                        style: "fcodex_codex_info_flow",
                        1: {
                            type: "flow", direction: "horizontal",
                            1: {type: "sprite", style: "fcodex_desc_image", ref: ["entity_sprite"]}, sprite: "fluid/unknown",
                            2: {
                                type: "flow", direction: "vertical", caption: "Entity", ref: ["entity_desc_frame"],
                                1: {type: "label", ref: ["entity_desc"], style: "fcodex_codex_desc"},
                                2: {
                                    type: "progressbar",
                                    ref: ["entity_color"],
                                    style: "fcodex_codex_color_indicator",
                                    value: 1
                                }
                            }
                        },
                        2: {type: "scroll-pane", direction: "vertical", ref: ["entity_usage"]}
                    }
            }}])
        }

        if (this.refs.codex_categories != undefined)
            this.categories.build_gui(this.refs.codex_categories)

        if (this.refs.titlebar_flow != undefined)
            this.refs.titlebar_flow.drag_target = this.refs.window

        this.refs.window?.force_auto_center()
    }

    open() {
        let player = game.get_player(this.player_index)
        if (this.visible || player == null) {
            return
        }

        this.visible = true

        this.build_gui()

        if (this.refs.window != undefined) {
            this.refs.window.visible = true
            player.opened = this.refs.window

            this.refs.window.bring_to_front()
        }
    }

    close() {
        if (!this.visible) {
            return
        }

        this.visible = false

        if ( this.refs.window != undefined ) {
            this.refs.window.visible = false
        }

        let player = game.get_player(this.player_index)
        if (player?.opened == this.refs.window && player?.opened != undefined) {
            player.opened = undefined
        }
    }

    toggle() {
        this.visible ? this.close() : this.open();
    }

    toggle_keep_open() {
        this.keep_open = !this.keep_open
    }

    is_open() {
        return this.visible
    }

    set_rebuild_gui() {
        this.rebuild_gui = true
        this.categories?.set_rebuild_gui()
    }

    updateHistoryButtons() {
        let backTooltip: (string | number | boolean | LuaObject | nil | [string, ...LocalisedString[]]) = [""]
        let fwdTooltip: (string | number | boolean | LuaObject | nil | [string, ...LocalisedString[]]) = [""]

        let curHistPos = this.historyPosition == -1 ? this.historyList.length-1 : this.historyPosition
        for (const i of $range(curHistPos - 1,0, -1)) {
            let item = this.historyList[i]
            if (!item.proto.valid) continue // unreachable because list gets cleaned at the start of this function

            backTooltip.push(
                `\n[${item.type}=${item.id}] `,
                item.proto.localised_name,
            )
        }

        for (const i of $range(curHistPos+1, this.historyList.length-1)) {
            let item = this.historyList[i]
            if (!item.proto.valid) continue // unreachable because list gets cleaned at the start of this function

            fwdTooltip.push(
                `\n[${item.type}=${item.id}] `,
                item.proto.localised_name,
            )
        }

        if (this.refs.hist_bak != undefined) {
            if (backTooltip.length > 1) backTooltip = ["", ["factorio-codex.history-back"], backTooltip]
            this.refs.hist_bak.tooltip = backTooltip
            this.refs.hist_bak.enabled = backTooltip.length > 1
        }
        if (this.refs.hist_fwd != undefined) {
            if (fwdTooltip.length > 1) fwdTooltip = ["", ["factorio-codex.history-forward"], fwdTooltip]
            this.refs.hist_fwd.tooltip = fwdTooltip
            this.refs.hist_fwd.enabled = fwdTooltip.length > 1
        }
    }

    addToHistory(entityPrototype: ViewablePrototype) {
        if (this.entity_view == undefined) return;

        let nextItem = this.historyPosition != -1 ? this.historyList[this.historyPosition+1] : undefined
        if (nextItem != undefined) {
            if (nextItem.id == this.entity_view.id && nextItem.type == this.entity_view.type) {
                // Same item as in history - move forward in list
                this.historyPosition = this.historyPosition + 1 < this.historyList.length-1 ? this.historyPosition+1 : -1

            } else {
                // Different item than the next in the history list - delete others that would come next this is the newest entry now
                this.historyList.splice(this.historyPosition+1)
                this.historyPosition = -1
                this.historyList.push({
                    ...this.entity_view,
                    proto: entityPrototype
                })
            }
        } else {
            this.historyList.push({
                ...this.entity_view,
                proto: entityPrototype
            })
        }
        const maxHistLen = 10
        if (this.historyList.length > maxHistLen) {
            this.historyList.shift()
        }

        this.updateHistoryButtons()
    }

    historyBack() {
        if (this.historyPosition > 0 || (this.historyPosition == -1 && this.historyList.length > 1)) {
            let curHistPos = this.historyPosition == -1 ? this.historyList.length-1 : this.historyPosition
            let histItem = this.historyList[curHistPos-1]
            this.historyPosition = curHistPos-1
            this.show_info(histItem.id, histItem.type, false)
            this.updateHistoryButtons()
        }
    }

    historyForward() {
        if (this.historyPosition != -1 && this.historyPosition < this.historyList.length-1) {
            let histItem = this.historyList[this.historyPosition+1]
            this.show_info(histItem.id, histItem.type)
        }
    }

    show_info(id: string, type: string, updateHist?: boolean) {
        const supported_types = ["item", "fluid", "technology"]
        if (!supported_types.includes(type)) {
            $log_info!(`Codex cant show info for unsupported type '${type}' (id: '${id}')!`)
            let p = game.get_player(this.player_index)
            p?.print(`Codex cannot show information about '${id}' of type '${type}'!`)
            return
        }

        const entity_prototype =  ( type == "item" ? game.item_prototypes :
                type == "fluid" ? game.fluid_prototypes : game.technology_prototypes
        )[id]

        if (entity_prototype == undefined) {
            $log_info!(`Codex cant show info for '${id}' of type '${type}'! No prototype exists!`)
            let p = game.get_player(this.player_index)
            p?.print(`Codex cannot show information about '${id}' of type '${type}'! Error: Prototype does not exist`)
            return
        }

        this.open()

        this.entity_view = { id: id, type: type }
        if (updateHist != false) {
            this.addToHistory(entity_prototype)
        }


        if (this.refs.entity_desc != undefined) {
            //this.refs.entity_desc.caption = EntityInfo.get(entity_prototype)
        }

        if (this.refs.entity_sprite != undefined) {
            this.refs.entity_sprite.sprite = type + "/" + id

            let tooltip = entity_prototype.localised_description
            if ( type == "item" && tooltip == undefined ) {
                const item_prototype = entity_prototype as LuaItemPrototype
                tooltip = item_prototype.place_result != undefined ?
                      item_prototype.place_result.localised_description :
                    item_prototype.place_as_equipment_result != undefined ?
                      item_prototype.place_as_equipment_result.localised_description :
                    item_prototype.place_as_tile_result != undefined ?
                      item_prototype.place_as_tile_result.result.localised_description : undefined
            }
            if ( tooltip == undefined ) {
                tooltip = ["codex-no-description"]
            }

            this.refs.entity_sprite.tooltip = tooltip
        }

        if (this.refs.entity_desc_frame != undefined) this.refs.entity_desc_frame.caption = entity_prototype.localised_name
        if (this.refs.entity_color != undefined) this.refs.entity_color.visible = false
        this.refs.entity_usage?.clear()

        this.categories.select_by_name(type)
        this.categories.scroll_to(id)


        if (type == "item")            this.item_info (entity_prototype as LuaItemPrototype)
        else if (type == "fluid")      this.fluid_info(entity_prototype as LuaFluidPrototype)
        else if (type == "technology") this.tech_info (entity_prototype as LuaTechnologyPrototype)
    }

    item_info(item: LuaItemPrototype) {
        let player_force = game.get_player(this.player_index)?.force
        RecipeInfo.build_gui(this.refs.entity_usage, item, player_force)
    }

    fluid_info(fluid: LuaFluidPrototype) {
        const color = fluid.base_color
        if ( this.refs.entity_color != undefined && (color.r != undefined ||
                color.g != undefined || color.b != undefined) ) {
            const color_int = {
                a: color.a != undefined ? Math.round(color.a*255) : 0,
                r: color.r != undefined ? Math.round(color.r*255) : 0,
                g: color.g != undefined ? Math.round(color.g*255) : 0,
                b: color.b != undefined ? Math.round(color.b*255) : 0
            }

            this.refs.entity_color.style.color = color
            this.refs.entity_color.tooltip = `Red:   ${color_int.r
                                           }\nGreen: ${color_int.g
                                           }\nBlue:  ${color_int.b}`
            this.refs.entity_color.visible = true
        }
        let player_force = game.get_player(this.player_index)?.force
        RecipeInfo.build_gui(this.refs.entity_usage, fluid, player_force)
    }

    tech_info(tech: LuaTechnologyPrototype) {
        TechnologyInfo.build_gui(this.refs.entity_usage, tech)
    }

    execute_task(task: Task) {
    }

    gui_action(guiAction: GuiAction, event: GuiEventData) {
        let action = guiAction.action
        if ( event.player_index != this.player_index ) {
            $log_err!("Something is not right. Received event for another player! "+
                `Expected player id: ${this.player_index} got: ${event.player_index}!`)
            game.get_player(event.player_index)?.print("[factorio-codex] Your UI interaction could not be processed! Is mod data corrupted?")
            return
        }

        if (action == "close") {
            this.close()
        } else if (action == "auto_close") {
            if (!this.keep_open) this.close()
        } else if (action == "toggle_keep_open") {
            this.toggle_keep_open()
        } else if (action == "change_category") {
            let indx = event.element?.selected_index as number
            if (indx != undefined) this.categories.select_by_index(indx-1)
        } else if (action == "view_entity" ) {
            let selected: {id?: string, type?: string} = {}
            const selected_index = event.element?.selected_index

            if ( selected_index != undefined && selected_index > 0 ) {
                selected = this.categories.get_selected_entity_info(event)
            } else if (event.element?.type == "sprite-button" &&  event.element?.sprite != undefined) {
                let [entity_type, id] = string.match(event.element.sprite, "^(%S+)[/.]([%S]+)")

                if (entity_type != "entity") {
                    selected = {type: entity_type, id: id}
                } else {
                    $log_info!(`Invalid entity type: "${entity_type}" ignoring sprite button click!`)
                }
            }

            if ( selected?.id == undefined || selected?.type == undefined ) {
                return
            }
            this.show_info(selected.id, selected.type)
        } else if (action == "hist_back") {
            this.historyBack()
        } else if (action == "hist_fwd") {
            this.historyForward()
        } else if (action == "update_search") {
            // do nothing for now
        }
    }

    get_verify_info(args?: any): Verifyinfo[] {
        let exp_player_indx = typeof args == "number" ? args : -1
        return [
            {field: "player_index", type: "number", value: exp_player_indx},
            {field: "categories", type: "Verifiable"},
            {field: "visible", type: "boolean"},
            {field: "keep_open", type: "boolean"},
            {field: "rebuild_gui", type: "boolean"},
            {field: "entity_view", type: "object", optional: true, content: [
                {field: "type", type: "string"},
                {field: "id", type: "string"},
            ]},
            {field: "historyPosition", type: "number"},
            {field: "historyList", type: "array", content: {
                field: "", type: "object", content: [
                    {field: "type", type: "string"},
                    {field: "id", type: "string"},
                ]
            }},
            {field: "refs", type: "object", content: [
                {field: "window", type: "object", optional: true},
                {field: "titlebar_flow", type: "object", optional: true},
                {field: "codex_categories", type: "object", optional: true},
                {field: "search_field", type: "object", optional: true},

                {field: "entity_viewer", type: "object", optional: true},
                {field: "entity_sprite", type: "object", optional: true},
                {field: "entity_desc_frame", type: "object", optional: true},
                {field: "entity_desc", type: "object", optional: true},
                {field: "entity_color", type: "object", optional: true},
                {field: "entity_usage", type: "object", optional: true},

                {field: "hist_bak", type: "object", optional: true},
                {field: "hist_fwd", type: "object", optional: true},
            ]},
        ]
    }
}

export default Codex