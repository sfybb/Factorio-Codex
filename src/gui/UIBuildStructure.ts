type GuiEventNames =
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

type GuiEventActions = { [key in GuiEventNames]?: { action: string, [key:string]: string } | string }

interface UISlots {
    name: string,
    replace?: boolean,
    content: UIBuildStructure[]
}

interface UIBuildStructure {
    type?: string
    actions?: GuiEventActions
    ref?: string[]
    children?: UIBuildStructure
    [key: number]: UIBuildStructure

    slots?: UISlots[]


    caption?: LocalisedString
    tooltip?: LocalisedString
    enabled?: boolean
    visible?: boolean
    ignored_by_interaction?: boolean
    tags?: Tags
    index?: uint
    anchor?: GuiAnchor
    style?: string
    [key: string]: undefined | any
}

interface UIRefs {
    [key: string]: LuaGuiElement | UIElement
}