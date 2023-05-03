import {default as Util, validate_print_info, validate_status} from "Util";
import {getDictionaryCache} from "cache/DictionaryCache";
import Search, {SortOrderQS} from "search/Search";
import QSMath from "quick_search/QS_math";
import {Task, TaskExecutor} from "Task";
import PlayerData from "PlayerData";
import IGuiRoot, {GuiAction} from "IGuiRoot";

/** @noResolution */
import * as FLIB_on_tick_n from "__flib__.on-tick-n";
/** @noResolution */
import * as FLIB_gui from "__flib__.gui";
import {getSettingsCache} from "./cache/SettingsCache";

declare const global: {
    playerData: typeof PlayerData
}

type QSResult = {
    type: string
    name: string
    id: string

    match_count: number
    hidden: boolean,
    order: string
}

const dicts_to_search = ["item", "fluid", "technology"]
const gui_name = "quick_search"

class QuickSearch implements TaskExecutor, IGuiRoot {
    player_index: PlayerIndex;
    visible: boolean;
    refs: {
        frame?: FlowGuiElement
        caption?: LabelGuiElement
        search_field?: TextFieldGuiElement
        results?: ListBoxGuiElement,
        debug?: LuaTable<string, BaseGuiElement>
    };

    rebuild_gui: boolean;


    last_search_task?: FLIBTaskIdent;

    search_results: QSResult[];
    search_has_math: boolean;
    math_result?: number;

    constructor(player_index: PlayerIndex) {
        this.player_index = player_index

        this.visible = false
        this.refs = {}
        this.rebuild_gui = false

        this.last_search_task = undefined
        this.search_results = []
        this.search_has_math = false
        this.math_result = undefined
    }

    static load(this: void, qs: QuickSearch) {
        // @ts-ignore
        setmetatable(qs, QuickSearch.prototype)
    }

    destroy() {
        this.refs?.frame?.destroy()
        this.refs = {}
    }

    build_gui() {
        if (this.rebuild_gui) {
            this.destroy()
        }

        let player = game.get_player(this.player_index)
        if (player == null) {
            $log_err!(`Error player_index is invalid! No player with index ${this.player_index} exists!`)
            return
        }

        if ( this.refs?.frame?.valid != true ) {
            this.rebuild_gui = false

            this.refs = FLIB_gui.build(player.gui.screen, [{
                type: "flow",
                direction: "vertical",
                style: "fcodex_quick_search",
                ref: ["frame"],
                actions: {
                    on_closed: { gui: gui_name, action: "close" }
                },

                1: {type: "label"    , style: "fcodex_quick_search_label", ref: ["caption"]     , caption: "QUICK SEARCH"},
                2: {type: "textfield", style: "fcodex_quick_search_input", ref: ["search_field"],
                    actions: {
                        on_text_changed: { gui: gui_name, action: "update_search" },
                        on_confirmed: { gui: gui_name, action: "test_debug" }
                    }},
                3: {type: "list-box" , style: "fcodex_quick_search_results", ref: ["results"],
                    actions: {
                        on_selection_state_changed: { gui: gui_name, action: "try_open_codex" }
                    }
                }
            }])

            if ( this.refs.frame != undefined ) this.refs.frame.visible = this.visible
        }

        if ( this.refs.search_field != undefined ) this.refs.search_field.clear_and_focus_on_right_click = true
        this.adjust_size_and_position()
    }

    adjust_size_and_position() {
        let player = game.get_player(this.player_index)

        if (player != null && this.refs.frame != undefined && this.refs.results != undefined) {
            let display_scale = player.display_scale
            let half_height = player.display_resolution.height / 2
            let half_width  = player.display_resolution.width / 2

            this.refs.frame.location = {
                x: half_width - 200 * display_scale,
                y: half_height - 50 * display_scale,
            }

            this.refs.results.style.maximal_height = (half_height - 100) / display_scale
        }
    }

    open() {
        let player = game.get_player(this.player_index)
        if (this.visible || player == null) {
            return
        }

        this.visible = true

        this.build_gui()
        if( this.refs.frame != undefined && this.refs.results != undefined && this.refs.search_field != undefined) {
            this.refs.frame.visible = true
            player.opened = this.refs.frame

            this.adjust_size_and_position()
            this.refs.frame.bring_to_front()
            this.refs.search_field.focus()
            this.refs.search_field.select_all()
        }
    }

    close() {
        if (!this.visible) {
            return
        }

        this.visible = false

        if ( this.refs.frame != undefined ) {
            this.refs.frame.visible = false
        }

        let player = game.get_player(this.player_index)
        if (player?.opened == this.refs.frame && player?.opened != undefined) {
            player.opened = undefined
        }
    }

    toggle() {
        this.visible ? this.close() : this.open();
    }

    is_open() {
        return this.visible
    }

    set_rebuild_gui() {
        this.rebuild_gui = true
    }

    display_result_list(unfiltered_list: QSResult[]) {
        this.remove_search_results()
        this.search_results = []

        if (unfiltered_list.length == 0) {
            return
        }

        for ( let data of unfiltered_list ) {
            if (data.hidden) {
                continue
            }

            let text = data.name
            switch (data.type) {
                case "technology":
                    text = `[color=#add8e6]${text}[/color]`
            }

            /*if ( debug.is_enabled() ) {
                text += ` M: ${data.match_count} O: ${data.prototype.order}`
            }*/

            this.search_results.push(data)

            if ( this.refs.results != undefined ) {
                this.refs.results.add_item(`[${data.type}=${data.id}] ${text}`)
            }
        }
    }

    remove_search_results() {
        let math_text = undefined
        if ( this.search_has_math && this.refs?.results?.items?.length != undefined && this.refs.results.items.length > 0) {
            math_text = this.refs.results.get_item(1)
        }

        if ( this.refs.results != undefined ) this.refs.results.clear_items()
        this.search_results = []

        if ( math_text != undefined ) {
            if ( this.refs.results != undefined ) this.refs.results.add_item(math_text)
        } else if( this.search_has_math ) {
            this.search_has_math = false
        }
    }

    set_math_result(result?: number, err?: string) {
        if ( result == undefined && (err == undefined || err == "") ) {
            if ( this.search_has_math && this.refs.results != undefined && this.refs.results.items.length > 0 ) {
                this.refs.results.remove_item(1)
            }

            this.math_result = undefined
            this.search_has_math = false
        } else {
            let math_text = result == undefined ? "=?" : "="+result

            if ( this.refs.results != undefined ) {
                if ( this.search_has_math && this.refs.results.items.length > 0 ) {
                    this.refs.results.set_item(1, math_text)
                } else {
                    this.refs.results.add_item(math_text, 1)
                }
            }

            this.math_result = result
            this.search_has_math = true
        }
    }

    update_input(prompt?: string) {
        if ( !this.is_open() ) return

        if ( prompt == undefined ) {
            prompt = this.refs?.search_field?.text
        } else if ( this.refs.search_field != undefined ) {
            this.refs.search_field.text = prompt
        }

        if ( prompt == undefined || prompt == "" ) {
            if ( this.refs.results != undefined ) {
                this.refs.results.clear_items()
            }

            this.math_result = undefined
            this.search_has_math = false
            return;
        }

        let math_prompt = prompt.replace(" ", "")
        let [math_result, math_err] = QSMath.calculateString(math_prompt)
        this.set_math_result(math_result, math_err)

        if (this.last_search_task != undefined) {
            FLIB_on_tick_n.remove(this.last_search_task)
        }
        let task: Task = {
            type: "gui",
            player_index: this.player_index,
            gui: "qs",
            args: new LuaTable<string, any>()
        }
        task.args?.set("name", "update_search")
        task.args?.set("prompt", prompt)

        this.last_search_task = FLIB_on_tick_n.add(game.tick + 1, task)
    }

    execute_task(task: Task) {
        if (task.args?.get("name") == "update_search") {
            let dictsCache = getDictionaryCache(this.player_index)
            if (dictsCache == undefined) {
                $log_warn!("Could not retrieve Dictionary cache!")
                return
            }
            if ( !dictsCache.isTranslated() ) {
                this.remove_search_results()
                this.refs.results?.add_item([ "factorio-codex.waiting-for-translation" ])
                return;
            }

            let matching_names = Search.search(task.args?.get("prompt"), this.player_index, [
                SortOrderQS.hidden_last,
                SortOrderQS.tech_last,
                SortOrderQS.match_count,
                SortOrderQS.factorio],
                100)
            //$log_info!(serpent.block(matching_names,  {}))

            this.display_result_list(matching_names)
        }
    }

    gui_action(guiAction: GuiAction, event: GuiEventData) {
        let action = guiAction.action
        if ( event.player_index != this.player_index ) {
            $log_err!("Something is not right. Received event for another player! "+
            `Expected player id: ${this.player_index} got: ${event.player_index}!`)
            game.get_player(event.player_index)?.print("[factorio-codex] Your UI interaction could not be processed! Is mod data corrupted?")
            return
        }


        if (action == "update_search") {
            this.update_input()
        } else if (action == "close") {
            this.close()
        } else if ( action == "test_debug" ) {
            if (event.element?.text == "debug!") {
                getSettingsCache(this.player_index)?.toggleDebug()
            }
        } else if ( action == "try_open_codex" ) {
            let selectedIndex = event.element?.selected_index as uint
            if (selectedIndex == undefined || selectedIndex == 0) return

            if (selectedIndex == 1 && this.search_has_math && this.math_result != undefined) {
                if ( this.refs.search_field != undefined) this.refs.search_field.text = "" + this.math_result
                return;
            }

            selectedIndex -= 1 + (this.search_has_math ? 1 : 0)

            if (this.search_results.length < selectedIndex) {
                $log_info!("Aborted opening Codex: Index out of range!"+
                `Selected element: ${selectedIndex} but only ${this.search_results.length} elements are available!`)
                return;
            }
            let selectedResult = this.search_results[selectedIndex]

            if (selectedResult == undefined) {
                $log_info!(`Aborted opening Codex: Selected element is undefined! Index: ${selectedIndex}`)
                return;
            }

            // @ts-ignore
            if (event.element?.selected_index != undefined) event.element.selected_index = 0


            global.playerData.getCodex(event.player_index)?.show_info(selectedResult.id, selectedResult.type)
        } else if ( action == "debugToggle") {
            if (this.refs.debug == undefined) return;

            let  is_debug = getSettingsCache(this.player_index)?.is_debug()
            is_debug = is_debug ?? false

            for (let [id, debugElem] of this.refs.debug) {
                if (debugElem != undefined) {
                    debugElem.visible = is_debug
                }
            }
        } else {
            $log_info!(`Received Unknown action "${action}" for QuickSearch of player ${this.player_index
            }('${game.get_player(this.player_index)?.name}')`)
        }
    }

    validate(print_info: validate_print_info, indx: PlayerIndex): validate_status {
        let status: validate_status = validate_status.OK
        let curStatus

        curStatus = validate_status.OK
        if ( this.player_index != indx ) {
            this.player_index = indx
            curStatus = validate_status.FIXED
        }
        $log_info!(Util.format_validate_msg(print_info, "player_index", curStatus))
        if (status == validate_status.OK) status = curStatus;
        else if(status == validate_status.FIXED) status = curStatus != validate_status.OK ? curStatus : status;


        curStatus = validate_status.OK
        if ( this.visible == undefined ) {
            curStatus = validate_status.ERROR
        }
        $log_info!(Util.format_validate_msg(print_info, "visible", curStatus))
        if (status == validate_status.OK) status = curStatus;
        else if(status == validate_status.FIXED) status = curStatus != validate_status.OK ? curStatus : status;

        curStatus = validate_status.OK
        if ( this.refs == undefined) {
            this.refs = {}
            curStatus = validate_status.FIXED
        }
        $log_info!(Util.format_validate_msg(print_info, "refs", curStatus))
        if (status == validate_status.OK) status = curStatus;
        else if(status == validate_status.FIXED) status = curStatus != validate_status.OK ? curStatus : status;

        curStatus = validate_status.OK
        if ( this.rebuild_gui == undefined ) {
            this.rebuild_gui = true
            curStatus = validate_status.FIXED
        }
        $log_info!(Util.format_validate_msg(print_info, "rebuild_gui", curStatus))
        if (status == validate_status.OK) status = curStatus;
        else if(status == validate_status.FIXED) status = curStatus != validate_status.OK ? curStatus : status;

        curStatus = validate_status.OK
        if ( this.search_results == undefined ) {
            this.search_results = []
            curStatus = validate_status.FIXED
        }
        $log_info!(Util.format_validate_msg(print_info, "search_results", curStatus))
        if (status == validate_status.OK) status = curStatus;
        else if(status == validate_status.FIXED) status = curStatus != validate_status.OK ? curStatus : status;

        curStatus = validate_status.OK
        if ( this.search_has_math == undefined ) {
            curStatus = validate_status.ERROR
        }
        $log_info!(Util.format_validate_msg(print_info, "search_has_math", curStatus))
        if (status == validate_status.OK) status = curStatus;
        else if(status == validate_status.FIXED) status = curStatus != validate_status.OK ? curStatus : status;

        curStatus = validate_status.OK
        if ( this.search_has_math && this.math_result == undefined  ) {
            this.search_results = []
            curStatus = validate_status.ERROR
        }
        $log_info!(Util.format_validate_msg(print_info, "math_result", curStatus))
        if (status == validate_status.OK) status = curStatus;
        else if(status == validate_status.FIXED) status = curStatus != validate_status.OK ? curStatus : status;


        return status
    }
}

export default QuickSearch