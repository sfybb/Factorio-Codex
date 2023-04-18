namespace CodexCommonUI {
    export function get_collapsable_list(label: LocalisedString, list: FLIBGuiBuildStructure[]): FLIBGuiBuildStructure {
        return {
            type: "frame", direction: "vertical", style: "subpanel_frame",
            1: {
                type: "flow", direction: "horizontal", style: "player_input_horizontal_flow",
                1: {
                    type: "sprite-button", style: "control_settings_section_button", sprite: "utility/collapse",
                    name: "collapse_button",
                    mouse_button_filter: ["left"],
                    actions: {
                        on_click: { gui: "common", action: "toggle_list_collapse" }
                    }
                },
                2: {type: "label", style: "caption_label", caption: label},
                3: {type: "empty-widget", style: "flib_titlebar_drag_handle", ignored_by_interaction: true}
            },
            2: {
                type: "flow", direction: "vertical", name: "list_container",
                1: {
                    type: "table",
                    column_count: 1,
                    draw_vertical_lines: false,
                    draw_horizontal_lines: true,
                    style: "fcodex_recipe_info_borderless_table",
                    children: list
                }
            }
        }
    }
}

export default CodexCommonUI