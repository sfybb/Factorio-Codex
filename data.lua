local styles = data.raw["gui-style"].default

local prefix = "fcodex_"

-- Quick search
styles[prefix .. "quick_search_input"] = {
    type = "textbox_style",
    padding = 4,
    font_color = { 1, 1, 1 },
    width = 400,
    rich_text_setting = "disabled",
    default_background = {
        base = { position = { 17, 0 }, corner_size = 1, opacity = 0.7 },
        shadow = textbox_dirt
    },
    active_background = {
        base = { position = { 70, 146 }, corner_size = 1, opacity = 0.7 },
        shadow = textbox_dirt
    }
}

styles[prefix .. "quick_search_results"] = {
    type = "list_box_style",
    parent = "list_box",
    maxmimal_height = 400,
    horizontally_stretchable = "on",

    item_style = {
        type = "button_style",
        parent = "list_box_item",
        bottom_padding = 2,
        top_padding = 2,
        default_font_color = {1, 1, 1},
        hovered_font_color = {1, 1, 1},
        clicked_font_color = {1, 1, 1},
        --default_font_color = {1, 1, 1},
        -- #e59344
        hovered_graphical_set = {base = {position = {70, 146}, size = {1, 1}}},
        clicked_graphical_set = {base = {position = {70, 146}, size = {1, 1}}},
    },

    scroll_pane_style = {
        type = "scroll_pane_style",
        always_draw_borders = false,
        extra_padding_when_activated = 0,
        graphical_set = {shadow = default_shadow},
    },
}

styles[prefix .. "quick_search"] = {
    type = "vertical_flow_style",
    padding = 10,
    width = 400,
}

--[[styles[prefix .. "quick_search"] = {
    type = "vertical_flow_style",
    vertical_align = "top",
    horizontal_align = "center",
    width = 600,
    --minimal_height = 48,
    vertical_spacing = 0
}

styles[prefix .. "quick_search_input"] = {
    type = "textbox_style",
    parent = "textbox",
    size = {600, 48},
    top_padding = 8,
    bottom_padding = 8,
    left_padding = 10,
    right_padding = 10,
    font = "fcodex_quic_search_inp_font",
    font_color = {1, 1, 1},
    active_background = { base = {
        center = {
            filename = "__core__/graphics/gui-new.png",
            position = {40, 766}, size = {1, 1}
    }}},
    default_background = { base = {
        center = {
            filename = "__core__/graphics/gui-new.png",
            position = { 40, 766 }, size = { 1, 1 }
    }}}
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
        font = "fcodex_quic_search_inp_font",
        default_font_color = {1, 1, 1},
        hovered_font_color = {1, 1, 1},
        clicked_font_color = {1, 1, 1},
        --default_font_color = {1, 1, 1},
-- #e59344
        default_graphical_set = {base = {
            center = {position = {25, 8}, size = {1, 1}, opacity = 0.5},
            bottom_border = 1
        }},
        hovered_graphical_set = {base = {filename = "__core__/graphics/gui-new.png", position = {70, 146}, size = {1, 1}}},
        clicked_graphical_set = {base = {filename = "__core__/graphics/gui-new.png", position = {70, 146}, size = {1, 1}}},
    },

    scroll_pane_style = {
        type = "scroll_pane_style",
        extra_padding_when_activated = 0,
        --[[vertical_scrollbar_style = {

        },] ]
        graphical_set = { base = {
            center = { position = { 336, 0 }, size = { 1, 1 } },
            opacity = 0.75,
            background_blur_sigma = 2,
            background_blur = true
        }}
    }
}]]


styles[prefix .. "quick_search_label"] = {
    type = "label_style",
    parent = "label",
    font = "fcodex_quic_search_inp_font",
    horizontal_align = "left",
    width = 600,
    left_padding = 8
}

-------------- Old style
-- Quick search
--[[styles.fcodex_quick_search = {
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
}]]


styles.fcodex_quick_search_label = {
    type = "label_style",
    parent = "label"
}

data:extend({{
        type = "custom-input",
        name = "fcodex_toggle_quick_search",
        key_sequence = "N",
        consuming = "none"
    }, {
        type = "custom-input",
        name = "fcodex_close_quick_search",
        key_sequence = "ESCAPE",
        consuming = "none"
    }, {
        type = "font",
        name = "fcodex_quic_search_inp_font",
        from = "default",
        size = 24
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
