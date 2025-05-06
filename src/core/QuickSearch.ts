import {
    BaseGuiElement,
    DropDownGuiElement,
    FlowGuiElement,
    ListBoxGuiElement,
    PlayerIndex,
    TextFieldGuiElement,
} from "factorio:runtime";
import {QSSearch, QSSearchResult, QSSearchResultWaiting} from "core/Search";
import {default as QSMath, QSMathResult} from "core/QS_math";
import {UiEventHandler} from "../ui/uiEvents";
import {GameEventRegistry} from "../events/eventRegistry";
import {registerPlayerDataInitializer, getEventForwardingForPlayer} from "./dataHandler";
import {QSSolarResult} from "./SolarRatio";
import LocalisedString = FactorioRuntime.LocalisedString;
import {TaskBaseData, TaskID, TaskScheduler} from "../events/taskScheduler";

/** @noResolution */
import * as FLIB_gui from "__flib__.gui";
import {on_translations_indexed} from "./Dictionary";

export interface QSResultBase {
    type: string;

    text: LocalisedString;
}

export type QSResult = QSResultBase | QSMathResult | QSSolarResult | QSSearchResult | QSSearchResultWaiting;

export interface QSModule {
    readonly id: string;
    readonly order: string;
    readonly async: boolean;

    apply_prompt(prompt: string, player: PlayerIndex,): QSResult[];

    on_selected(item: QSResult, player: PlayerIndex): string | undefined;
}

interface QSUpdateTaskData extends TaskBaseData {
    readonly task_name: "update_search",
    prompt: string
}

class QuickSearch {
    static modules: QSModule[] = [];
    static readonly gui_name = "quick_search"

    static registerModule(module: QSModule) {
        QuickSearch.modules = QuickSearch.modules ?? []
        for (const m of QuickSearch.modules) {
            if (m.id == module.id) {
                $log_crit!(`Cannot add module "${m.id}" to QuickSearch! Id already in use`, "");
                return
            }
        }

        let low = 0;
        let high = QuickSearch.modules.length;
        let mid = 0;

        while (low < high) {
            mid = Math.floor((low + high) / 2);
            if (QuickSearch.modules[mid].order < module.order) low = mid + 1;
            else high = mid;
        }
        QuickSearch.modules.splice(low, 0, module);
    }

    player_index: PlayerIndex;
    visible: boolean;
    refs: {
        frame?: FlowGuiElement
        search_field?: TextFieldGuiElement
        results?: ListBoxGuiElement,
        debug?: LuaTable<string, BaseGuiElement>
    };

    rebuild_gui: boolean;


    last_search_task?: TaskID;

    search_results: QSResult[];

    cur_prompt?: string;

    constructor(player_index: PlayerIndex) {
        this.player_index = player_index

        this.visible = false
        this.refs = {}
        this.rebuild_gui = false

        this.last_search_task = undefined
        this.search_results = []
    }

    static load(this: void, qs: QuickSearch) {
        // @ts-ignore
        setmetatable(qs, QuickSearch.prototype)
    }

    destroy() {
        this.refs?.frame?.destroy()
        this.refs = {}
        this.visible = false
    }

    build_gui() {
        $log_debug!(`Build ${serpent.line(this.refs)} Rebuild? ${this.rebuild_gui}`)
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

            $log_debug!("Create")
            // @ts-ignore
            let new_refs = FLIB_gui.add(player.gui.screen, [{
                type: "flow",
                direction: "vertical",
                style: "fcodex_quick_search",
                caption: "Quick Search",
                name: "frame",

                1: {type: "label"    , style: "fcodex_quick_search_label", caption: "QUICK SEARCH"},
                2: {type: "textfield", style: "fcodex_quick_search_input", name: "search_field",
                    tags: { gui: QuickSearch.gui_name, action: "update_search"}
                },
                3: {type: "list-box" , style: "fcodex_quick_search_results", name: "results",
                    tags: { gui: QuickSearch.gui_name, action: "try_open_codex"},
                }
            }])
            this.refs = new_refs[0] as typeof this.refs

            if ( this.refs.frame != undefined ) this.refs.frame.visible = this.visible
        }

        //if ( this.refs.search_field != undefined ) this.refs.search_field.clear_and_focus_on_right_click = true
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
            this.visible = true
            player.opened = this.refs.frame

            this.refs.frame.bring_to_front()
            this.refs.search_field.focus()

            if (this.cur_prompt) {
                this.refs.search_field.text = this.cur_prompt
            }

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
        $log_debug!("Toggle")
        this.visible ? this.close() : this.open();
    }

    is_open() {
        return this.visible
    }

    set_rebuild_gui() {
        this.rebuild_gui = true
    }

    display_results() {
        $log_trace!(`Search results (#${this.search_results.length}):`)

        if ( this.refs.results != undefined ) this.refs.results.clear_items()

        for (const res of this.search_results) {
            $log_trace!(`- ${res.text}`)
            if ( this.refs.results != undefined ) {
                this.refs.results.add_item(res.text)
            }
        }
    }

    update_input(prompt?: string) {
        if ( !this.is_open() ) {
            $log_debug!("Search not open how are you searching?")
            return
        }

        this?.refs?.frame?.bring_to_front()

        if ( prompt == undefined ) {
            prompt = this.refs?.search_field?.text
        } else if ( this.refs.search_field != undefined ) {
            this.refs.search_field.text = prompt
        }

        this.cur_prompt = prompt

        if ( prompt == undefined || prompt == "" ) {
            if ( this.refs.results != undefined ) {
                this.refs.results.clear_items()
            }
            return;
        }

        this.search_results = []

        // Evaluate all synchronous modules
        for (let module of QuickSearch.modules) {
            if (!module.async) {
                let res = module.apply_prompt(prompt, this.player_index)
                this.search_results = this.search_results.concat(res)
                $log_debug!(`["${module.id}"] Adding results ${serpent.line(res, {maxnum: 10})}`)
            }
        }
        this.display_results()

        if (this.last_search_task != undefined) {
            TaskScheduler.remove(this.last_search_task)
        }

        let task: QSUpdateTaskData = {
            handler_id: QuickSearch.gui_name,
            player_index: this.player_index,

            task_name: "update_search",
            prompt: prompt
        }

        // Defer evaluation of async modules (improves usability for modules with higher computational demand)
        this.last_search_task = TaskScheduler.scheduleTask(task);
    }

    execute_task(task: QSUpdateTaskData) {
        if (task.task_name == "update_search") {
            let prompt: string = task.prompt ?? ""

            // Evaluate all async modules
            for (let module of QuickSearch.modules) {
                if (module.async) {
                    let res = module.apply_prompt(prompt, task.player_index)
                    this.search_results = this.search_results.concat(res)
                    $log_debug!(`["${module.id}"] Adding results ${serpent.line(res, {maxnum: 10, maxlength: 100})}`)
                }
            }

            this.display_results()
        }
    }

    itemSelected(event: GuiEventData) {
        if (event.element == undefined) return;

        let selectedIndex = (event.element.selected_index as number) - 1 // make index start at 0 dammit
        if (selectedIndex == undefined || selectedIndex < 0) return

        if (this.search_results.length < selectedIndex) {
            $log_info!("Aborted opening Codex: Index out of range!"+
                `Selected element: ${selectedIndex} but only ${this.search_results.length} elements are available!`)
            return;
        }

        let selectedResult = this.search_results[selectedIndex]

        if (selectedResult == undefined) {
            $log_info!(`Aborted quick search action: Selected element is undefined! Index: ${selectedIndex}`)
            return;
        }

        if (event.element?.selected_index != undefined) (<DropDownGuiElement>event.element).selected_index = 0

        let new_prompt = undefined
        for (const module of QuickSearch.modules) {
            new_prompt = module.on_selected(selectedResult, this.player_index)
            if (new_prompt != undefined) break
        }

        if (new_prompt != undefined) this.update_input(new_prompt)
    }
}

function QSError(fn: Function, payload: any) {
    // Try to find function in class QuickSearch
    let fun_name: string | undefined = undefined
    for (const [name, value] of Object.entries(QuickSearch.prototype)) {
        if (typeof value == "function" && fn == value) {
            fun_name = name
            break
        }
    }
    if (!fun_name) $log_warn!(`Failed to forward event: Missing payload`)
    else  $log_warn!(`Failed to forward event to "QuickSearch:${fun_name}": Missing payload`)

}
function QSInstance(player_data: any) { return player_data.quick_search }

UiEventHandler.addUi(QuickSearch.gui_name, {
    on_gui_closed: getEventForwardingForPlayer(QuickSearch.prototype.close, QSInstance, false, QSError),
    on_gui_text_changed: getEventForwardingForPlayer(QuickSearch.prototype.update_input, QSInstance, false, QSError),
    on_gui_selection_state_changed: getEventForwardingForPlayer(QuickSearch.prototype.itemSelected, QSInstance, true, QSError),
})

GameEventRegistry.register("fcodex_toggle_quick_search", getEventForwardingForPlayer(QuickSearch.prototype.toggle, QSInstance, false, QSError))
GameEventRegistry.register("fcodex_close_quick_search", getEventForwardingForPlayer(QuickSearch.prototype.close, QSInstance, false, QSError))
GameEventRegistry.register(on_translations_indexed, getEventForwardingForPlayer(QuickSearch.prototype.update_input, QSInstance, false, QSError))

registerPlayerDataInitializer(QuickSearch.gui_name, (pIndx: PlayerIndex) => new QuickSearch(pIndx), (qs: any) => QuickSearch.load(qs))

TaskScheduler.register(QuickSearch.gui_name, getEventForwardingForPlayer(QuickSearch.prototype.execute_task, QSInstance, true, QSError));

QuickSearch.registerModule(new QSMath())
//QuickSearch.registerModule(new SolarRatio())
QuickSearch.registerModule(new QSSearch())

export default QuickSearch