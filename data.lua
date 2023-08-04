local styles = data.raw["gui-style"].default

local prefix = "fcodex_"

-- Quick search
styles[prefix .. "quick_search"] = {
    type = "vertical_flow_style",
    vertical_align = "top",
    horizontal_align = "center",
    width = 400,
    minimal_height = 20,
    vertical_spacing = 0
}

styles[prefix .. "quick_search_input"] = {
    type = "textbox_style",
    parent = "textbox",
    size = {400, 30},
    top_padding = 5,
    bottom_padding = 5,
    left_padding = 10,
    right_padding = 10,
    font = "fcodex_quic_search_inp_font",
    font_color = {1, 1, 1},
    active_background = { base = {
        center = { position = { 336, 0 }, size = { 1, 1 } },
        opacity = 0.5,
        background_blur = true
    }},
    default_background = { base = {
        center = { position = { 336, 0 }, size = { 1, 1 } },
        opacity = 0.5,
        background_blur = true
    }}
}

styles[prefix .. "quick_search_results"] = {
    type = "list_box_style",
    parent = "list_box",
    maxmimal_height = 400,

    item_style = {
        type = "button_style",
        parent = "list_box_item",
        bottom_padding = 2,
        top_padding = 2,
        font = "fcodex_quick_search_result_font",
        --default_font_color = {1, 1, 1},

        default_graphical_set = {base = {
            center = {position = {25, 8}, size = {1, 1}, opacity = 0.5},
            bottom_border = 1
        }},
        hovered_graphical_set = {base = {position = {34, 17}, corner_size = 8, opacity = 0.5}},
    },

    scroll_pane_style = {
        type = "scroll_pane_style",
        extra_padding_when_activated = 0,
        --[[vertical_scrollbar_style = {

        },]]
        graphical_set = { base = {
            center = { position = { 336, 0 }, size = { 1, 1 } },
            opacity = 0.75,
            background_blur = true
        }}
    }
}


styles[prefix .. "quick_search_label"] = {
    type = "label_style",
    parent = "label",
    font = "fcodex_quick_search_label_font",
    --horizontal_align = "left",
}




-- Codex

styles[prefix .. "desc_image"] = {
    type = "image_style",
    stretch_image_to_widget_size = true,
    size = 80
}

styles[prefix .. "codex_main"] = {
    type = "frame_style",
    -- 24 is the padding size for the window
    natural_width = 1224,
    minimal_width = 1224,
    height = 650
}

styles[prefix .. "codex_frame_no_border"] = {
    type = "frame_style",
    border = nil,
    padding = 0,
    margin = 0,
    --[[graphical_set = { base = {
        center = { position = { 336, 0 }, size = { 1, 1 } },
        opacity = 0.75,
        background_blur = true
    }}]]
}

styles[prefix .. "codex_vflow_no_border"] = {
    type = "vertical_flow_style",
    padding = 0
}

styles[prefix .. "filler_widget"] = {
    type="empty_widget_style",
    horizontally_stretchable="stretch_and_expand"
}

styles[prefix .. "codex_search_box"] = {
    type="textbox_style",
    horizontally_stretchable="stretch_and_expand",
}

styles[prefix .. "codex_info_section"] = {
    type = "frame_style",
    natural_width = 590,
    minimal_width = 590
}

styles[prefix .. "codex_info_flow"] = {
    type = "vertical_flow_style",
    natural_width = 590,
    minimal_width = 590,
}


styles[prefix .. "codex_recipe_header"] = {
    type = "label_style",
    parent = "label",
    font = "fcodex_quic_search_inp_font"
}

styles[prefix .. "codex_desc"] = {
    type = "label_style",
    parent = "label",
    width = 510,
    single_line = false
}

styles[prefix .. "codex_type_section"] = {
    type = "list_box_style",
    parent = "list_box",
    natural_width = 198,
    minimal_width = 198
}

styles[prefix .. "codex_info_scroll"] = {
    type="scroll_pane_style",
    horizontally_stretchable="stretch_and_expand",
    extra_padding_when_activated = 0
}

styles[prefix .. "codex_entity_list"] = {
    type = "list_box_style",
    parent = "list_box",
    width = 390,
    horizontally_stretchable="off"
}

styles[prefix .. "produces_sprite"] = {
    type = "image_style",
    stretch_image_to_widget_size = true,
    size = 50
}

styles[prefix .. "produced_in_sprite"] = {
    type = "image_style",
    stretch_image_to_widget_size = true,
    size = 20
}


styles[prefix .. "recipe_label_top"] = {
    type = "label_style",
    parent = "count_label",
    height = 36,
    width = 36,
    vertical_align = "top",
    horizontal_align = "right",
    right_padding = 2
}

styles[prefix .. "recipe_info_borderless_table"] = {
    type = "table_style",
    cell_padding = 4,
    horizontally_stretchable="stretch_and_expand",
    border = nil
}

styles[prefix .. "codex_color_indicator"] = {
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
        type = "font",
        name = "fcodex_quick_search_label_font",
        from = "default-bold",
        size = 25
    }, {
        type = "font",
        name = "fcodex_quick_search_result_font",
        from = "default",
        size = 18
    }, {
        type = "sprite",
        name = "fcodex_produces",
        filename = "__factorio-codex__/graphics/arrow.png",
        size = 64,
        flags = { "icon" },
    }, {
        type = "sprite",
        name = "fcodex_produces",
        filename = "__factorio-codex__/graphics/arrow.png",
        size = 64,
        flags = { "gui-icon" },
    }, {
        type = "sprite",
        name = "fcodex_history_back",
        filename = "__factorio-codex__/graphics/history-back.png",
        priority = "extra-high-no-scale",
        size = 32,
        scale = 0.5,
        mipmap_count = 2,
        flags = { "gui-icon" },
    }, {
       type = "sprite",
       name = "fcodex_history_back_dark",
       filename = "__factorio-codex__/graphics/history-back-dark.png",
       priority = "extra-high-no-scale",
       size = 32,
       scale = 0.5,
       mipmap_count = 2,
       flags = { "gui-icon" },
    }
})
