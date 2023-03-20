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

type FLIBGuiActions = { [key in FLIBGuiActionsNames]?: { action: string, [key:string]: string } | string }

type FLIBTabAndContent = {
    tab: FLIBGuiBuildStructure
    content: FLIBGuiBuildStructure
}[]

type GuiEventData =
      OnGuiClickEvent
    | OnGuiClosedEvent
    | OnGuiOpenedEvent
    | OnGuiConfirmedEvent
    | OnGuiTextChangedEvent
    | OnGuiElemChangedEvent
    | OnGuiValueChangedEvent
    | OnGuiLocationChangedEvent
    | OnGuiSwitchStateChangedEvent
    | OnGuiSelectedTabChangedEvent
    | OnGuiCheckedStateChangedEvent

interface FLIBGuiBuildStructure {
    type: GuiElementType
    name?: string
    direction?: "horizontal" | "vertical"
    style?: string
    sprite?: SpritePath
    hovered_sprite?: SpritePath
    clicked_sprite?: SpritePath
    mouse_button_filter?: MouseButtonFlagsWrite
    text?: string
    caption?: LocalisedString
    tooltip?: LocalisedString
    enabled?: boolean
    visible?: boolean
    ignored_by_interaction?: boolean
    tags?: Tags
    index?: uint
    anchor?: GuiAnchor
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

    export function read_action(e: GuiEventData): string | nil;
    export function set_action(elem: LuaGuiElement, event_name: FLIBGuiActions, msg: string | nil): void;
    export function get_action(elem: LuaGuiElement, event_name: FLIBGuiActions): string | nil;


    export function build(parent: LuaGuiElement, structures: FLIBGuiBuildStructure[]): { [key: string]: LuaGuiElement };
    export function add(parent: LuaGuiElement, structure: FLIBGuiBuildStructure): LuaGuiElement;
    export function update(parent: LuaGuiElement, structures: FLIBGuiBuildStructure): void;

    export function get_tags(elem: LuaGuiElement): any;
    export function set_tags(elem: LuaGuiElement, tags: any): void;
    export function delete_tags(elem: LuaGuiElement): void;
    export function update_tags(elem: LuaGuiElement, updates: any): void;
}