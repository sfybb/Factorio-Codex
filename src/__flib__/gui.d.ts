// @noSelfInFile
type FLIBGuiActionsNames =
    | "on_click"
    | "on_opened"
    | "on_closed"
    | "on_confirmed"
    | "on_elem_changed"
    | "on_text_changed"
    | "on_value_changed"
    | "on_location_changed"
    | "on_switch_state_changed"
    | "on_selected_tab_changed"
    | "on_checked_state_changed"
    | "on_selection_state_changed"

type FLIBGuiAction = string | { action: string, [key:string]: string }

type FLIBGuiActions = { [key in FLIBGuiActionsNames]?: FLIBGuiAction }

type FLIBTabAndContent = {
    tab: FLIBGuiBuildStructure
    content: FLIBGuiBuildStructure
}[]

type GuiEventData =
      FactorioRuntime.OnGuiClickEvent
    | FactorioRuntime.OnGuiClosedEvent
    | FactorioRuntime.OnGuiOpenedEvent
    | FactorioRuntime.OnGuiConfirmedEvent
    | FactorioRuntime.OnGuiTextChangedEvent
    | FactorioRuntime.OnGuiElemChangedEvent
    | FactorioRuntime.OnGuiValueChangedEvent
    | FactorioRuntime.OnGuiLocationChangedEvent
    | FactorioRuntime.OnGuiSwitchStateChangedEvent
    | FactorioRuntime.OnGuiSelectedTabChangedEvent
    | FactorioRuntime.OnGuiCheckedStateChangedEvent

interface FLIBGuiBuildStructure {
    type: FactorioRuntime.GuiElementType
    name?: string
    direction?: "horizontal" | "vertical"
    style?: string
    sprite?: FactorioRuntime.SpritePath
    hovered_sprite?: FactorioRuntime.SpritePath
    clicked_sprite?: FactorioRuntime.SpritePath
    mouse_button_filter?: FactorioRuntime.MouseButtonFlagsWrite
    text?: string
    caption?: FactorioRuntime.LocalisedString
    tooltip?: FactorioRuntime.LocalisedString
    enabled?: boolean
    visible?: boolean
    ignored_by_interaction?: boolean
    tags?: FactorioRuntime.Tags
    index?: FactorioRuntime.uint
    anchor?: FactorioRuntime.GuiAnchor
    show_percent_for_small_numbers?: boolean
    draw_vertical_lines?: boolean
    draw_horizontal_lines?: boolean
    number?: number
    value?: number
    column_count?: number



    //TODO all possible properties

    ref?: string[]
    actions?: FLIBGuiActions

    tabs?: FLIBTabAndContent

    children?: FLIBGuiBuildStructure[]
    [key: number]: FLIBGuiBuildStructure
}

/** @noResolution */
declare module "__flib__.gui" {
    export function hook_events(callback: ((e: GuiEventData) => void)): void;

    export function read_action(e: GuiEventData): FLIBGuiAction | null;
    export function set_action(elem: FactorioRuntime.LuaGuiElement, event_name: FLIBGuiActions, msg: string | null): void;
    export function get_action(elem: FactorioRuntime.LuaGuiElement, event_name: FLIBGuiActions): string | null;


    export function build(parent: FactorioRuntime.LuaGuiElement, structures: FLIBGuiBuildStructure[]): { [key: string]: FactorioRuntime.LuaGuiElement };
    export function add(parent: FactorioRuntime.LuaGuiElement, structure: FLIBGuiBuildStructure): FactorioRuntime.LuaGuiElement;
    export function update(parent: FactorioRuntime.LuaGuiElement, structures: FLIBGuiBuildStructure): void;

    export function get_tags(elem: FactorioRuntime.LuaGuiElement): any;
    export function set_tags(elem: FactorioRuntime.LuaGuiElement, tags: any): void;
    export function delete_tags(elem: FactorioRuntime.LuaGuiElement): void;
    export function update_tags(elem: FactorioRuntime.LuaGuiElement, updates: any): void;
}