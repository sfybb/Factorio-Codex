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

type GuiHandler = (e: GuiEventData) => void
type GuiWrapper = (e: GuiEventData, handler: GuiHandler) => void

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
    style_mods?: Partial<FactorioRuntime.BaseStyle>,
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
    export function add_handler(new_handlers: LuaTable<string, GuiHandler>, wrapper?: GuiWrapper, prefix?: string): void;

    export function add(parent: FactorioRuntime.LuaGuiElement, structure: FLIBGuiBuildStructure | FLIBGuiBuildStructure[]):
        LuaMultiReturn<[LuaTable<string, FactorioRuntime.LuaGuiElement>, FactorioRuntime.LuaGuiElement]>;

    export function format_handlers(input: GuiHandler | LuaTable<defines.events, GuiHandler>, existing?: LuaTable<string, string>): LuaTable<string, string>;

    export const events: { [key: FactorioRuntime.EventId<any>]: (e: FactorioRuntime.EventData) => void };
}