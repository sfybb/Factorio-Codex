local ui_action_names = {
    on_click = "on_gui_click",
    on_opened = "on_gui_opened",
    on_closed = "on_gui_closed",
    on_confirmed = "on_gui_confirmed",
    on_elem_changed = "on_gui_elem_changed",
    on_text_changed = "on_gui_text_changed",
    on_value_changed = "on_gui_value_changed",
    on_location_changed = "on_gui_location_changed",
    on_switch_state_changed = "on_gui_switch_state_changed",
    on_selected_tab_changed = "on_gui_selected_tab_changed",
    on_checked_state_changed = "on_gui_checked_state_changed",
    on_selection_state_changed = "on_gui_selection_state_changed",
}

--[[
events = {
    on_click = {},
    on_opened = {},
    on_closed = {},
    on_confirmed = {},
    on_elem_changed = {},
    on_text_changed = {},
    on_value_changed = {},
    on_location_changed = {},
    on_switch_state_changed = {},
    on_selected_tab_changed = {},
    on_checked_state_changed = {},
    on_selection_state_changed = {},
}
]]

ui_manager = {
    new_events = {}, -- [list] of emitted events by event handlers which have not been processed yet
    registered_events = {
        -- ui_name = {...[events]...}
    },
    modules = {

    },
    vanilla_modules = {

    }
}

--[[
ui-module = {
    build_structure = {},
    event_handler(self, event, emit_event)
        self.refs = {}
    end,
}
]]


function build_module(module_name)
    module_name = module_name or ""
    local module = ui_manager.vanilla_modules[module_name] or ui_manager.modules[module_name]
    if module == nil then
        log("Unknown ui-module \"".. module_name .."\": Neither this module nor its children were created!")
        return nil
    end



end

function build(root_element, build_structure)

end

function event_emitter(event_name, event_data)
    local event = {
        name = event_name,
        data = event_data
    }

    table.insert(ui_manager.new_events, event)
end

function handle_ui_action(event)
    -- find module for event
    module.event_handler(module_data, event, event_emitter)

    for e_name, e_data in ipairs(ui_manager.new_events) do
        -- find module(s)
        module.event_handler(module_data, e_data, event_emitter)
    end
end