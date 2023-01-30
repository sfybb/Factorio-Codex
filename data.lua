local styles = data.raw["gui-style"].default

-- Quick search
styles.fcodex_quick_search = {
    type = "vertical_flow_style",
    vertical_align = "top",
    horizontal_align = "center",
    width = 400,
    minimal_height = 20
}

styles.fcodex_quick_search_input = {
    type = "textbox_style",
    parent = "textbox",
    size = {400, 30},
    font = "fcodex_quic_search_inp_font"
}

styles.fcodex_quick_search_results = {
    type = "list_box_style",
    parent = "list_box",
    maxmimal_height = 400
}


styles.fcodex_quick_search_label = {
    type = "label_style",
    parent = "label"
}


-- Codex

styles.fcodex_desc_image = {
    type = "image_style",
    stretch_image_to_widget_size = true,
    size = 80
}

styles.fcodex_codex_main = {
    type = "frame_style",
    -- 24 is the padding size for the window
    natural_width = 1224,
    minimal_width = 1224,
    height = 650
}

styles.fcodex_codex_frame_no_border = {
    type = "frame_style",
    border = nil,
    padding = 0,
    margin = 0
}

styles.fcodex_codex_vflow_no_border = {
    type = "vertical_flow_style",
    padding = 0
}

styles.fcodex_filler_widget = {
    type="empty_widget_style",
    horizontally_stretchable="stretch_and_expand"
}

styles.fcodex_codex_search_box = {
    type="textbox_style",
    horizontally_stretchable="stretch_and_expand",
}

styles.fcodex_codex_info_section = {
    type = "frame_style",
    natural_width = 590,
    minimal_width = 590
}

styles.fcodex_codex_info_flow = {
    type = "vertical_flow_style",
    natural_width = 590,
    minimal_width = 590,
}


styles.fcodex_codex_recipe_header = {
    type = "label_style",
    parent = "label",
    font = "fcodex_quic_search_inp_font"
}

styles.fcodex_codex_desc = {
    type = "label_style",
    parent = "label",
    width = 510,
    single_line = false
}

styles.fcodex_codex_type_section = {
    type = "list_box_style",
    parent = "list_box",
    natural_width = 198,
    minimal_width = 198
}

styles.fcodex_codex_info_scroll = {
    type="scroll_pane_style",
    horizontally_stretchable="stretch_and_expand",
    extra_padding_when_activated = 0
}

styles.fcodex_codex_entity_list = {
    type = "list_box_style",
    parent = "list_box",
    natural_width = 390,
    minimal_width = 390
}

styles.fcodex_produces_sprite = {
    type = "image_style",
    stretch_image_to_widget_size = true,
    size = 50
}

styles.fcodex_produced_in_sprite = {
    type = "image_style",
    stretch_image_to_widget_size = true,
    size = 20
}


styles.fcodex_recipe_label_top = {
    type = "label_style",
    parent = "count_label",
    height = 36,
    width = 36,
    vertical_align = "top",
    horizontal_align = "right",
    right_padding = 2
}

styles.fcodex_recipe_info_borderless_table = {
    type = "table_style",
    cell_padding = 4,
    horizontally_stretchable="stretch_and_expand",
    border = nil
}

styles.fcodex_codex_color_indicator = {
    type="progressbar_style",
    horizontally_stretchable = "on",
    bar_width = 40,
    width = 40,
    color = {g=1},
    bar = {
        --filename = "__core__/graphics/gui.png",
        --filename = "__core__/graphics/gui-new.png",
        position = {195, 72},
        --position = {223, 0},
        --position = {111, 0},
        --position = {148, 0},
        size = { 17, 17},
        --size = {1, 11},
        --size = {36, 36},
        --size = {28, 28},
        corner_size = 8,
        scale = 1,
        border = 4,
    },
    bar_background = {
        filename = "__core__/graphics/gui.png",
        position = {225, 0},
        size = {1, 13},
        scale = 1
    }
}

data:extend({{
        type = "custom-input",
        name = "fcodex_toggle_quick_search",
        key_sequence = "N",
        order = "a"
    }, {
        type = "font",
        name = "fcodex_quic_search_inp_font",
        from = "default",
        size = 20
    }, {
        type = "sprite",
        name = "fcodex_produces",
        filename = "__factorio-codex__/graphics/arrow.png",
        size = 64,
        flags = { "icon" },
  }
})
