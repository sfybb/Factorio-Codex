local gui = require("__flib__.gui")

local util = require("scripts.util")
local serpent = require("scripts.serpent")


local codex = {}

local codex_helper_data = nil

local function init_codex_helper_data()
    if codex_helper_data ~= nil then
        return
    end
    
    codex_helper_data = {}

    codex_helper_data.categories = {
        {name= "Items", type="item" , filter=game.get_filtered_item_prototypes},
        {name= "Fluids", type="fluid", filter=game.get_filtered_fluid_prototypes},
        {name= "Technologies", type="technology", filter=game.get_filtered_technology_prototypes},
        {name= "Tiles", type="tile", filter=game.get_filtered_tile_prototypes},
    }
    
    codex_helper_data.sorts = {
        item= function (a,b)
            local a_proto = game.item_prototypes[a.id]
            local b_proto = game.item_prototypes[b.id]
            
            if a_proto.has_flag("hidden") ~= b_proto.has_flag("hidden") then
                return not a_proto.has_flag("hidden")
            end
            return a_proto.order < b_proto.order
        end
    }
end

local function codex_select_category(dicts, codex, type_name)
    init_codex_helper_data()

    local cat = nil
    local indx = nil
    
    if type(type_name) == "string" then
        for i,c in pairs(codex_helper_data.categories) do
            if c.type == type_name then
                cat = c
                indx = i
                break
            end
        end
    elseif type(type_name) == "number" then
        for i,c in pairs(codex_helper_data.categories) do
            if i == type_name then
                cat = c
                indx = i
                break
            end
        end
    end
    
    if codex == nil or dicts == nil or cat == nil or
		codex.category == cat then
        return
    end
    
    if codex.refs.category_picker.selected_index ~= indx then
        codex.refs.category_picker.selected_index = indx
    end
	
    codex.category = cat
    codex.refs.available_entities.clear_items()
    
    local entity_list = {}
    
    for k,v in  pairs(dicts[cat.type .. "_names"]) do
       table.insert(entity_list, {id=k,name=v})
    end
    
    if codex_helper_data.sorts[cat.type] ~= nil then
        table.sort(entity_list, codex_helper_data.sorts[cat.type])
    end
    
    for _,v in  pairs(entity_list) do
        local entity_proto = game[cat.type .. "_prototypes"][v.id]
        local entity_text = "[".. cat.type .. "=" .. v.id .. "] " .. v.name
        
        if cat.type == "item" and entity_proto.has_flag("hidden")then
            entity_text = "[color=gray]" .. entity_text .. " [hidden][/color]"
        end
        
        codex.refs.available_entities.add_item(entity_text)
    end
    
    codex.entity_list = entity_list
    --log("Codex entity array: " .. serpent.block(entity_list))
end

local function build_codex(player)
    init_codex_helper_data()
    
    local refs = gui.build(player.gui.screen, {
        {
            type = "frame",
            direction = "vertical",
            style = "fcodex_codex_main",
            ref = {"window"},
            actions = {
                on_closed = "cx_close"
            },
                {type = "flow", ref = {"titlebar_flow"}, children = {
                    {type ="label", style = "frame_title", caption = "Codex", ignored_by_interaction = true},
                    {type = "empty-widget", style = "flib_titlebar_drag_handle", ignored_by_interaction = true},
                    {
                        type = "sprite-button",
                        style = "frame_action_button",
                        sprite = "utility/close_white",
                        hovered_sprite = "utility/close_black",
                        clicked_sprite = "utility/close_black",
                        mouse_button_filter = {"left"},
                        actions = {
                            on_click = "cx_close"
                        }
                    }
            }},
            {type = "frame", direction = "horizontal", style= "fcodex_codex_frame_no_border",
                {type = "flow", direction = "vertical", style= "fcodex_codex_vflow_no_border",
                    {type = "textfield",
                    enabled= false,
                    text= "Work In Progress",
                    ref = {"search_field"},
                    actions = {
                        on_text_changed = "cx_update_search"
                    }
                    },
                    {type = "flow", direction = "horizontal",
                        {type = "list-box",
                            ref = {"category_picker"},
                            style="fcodex_codex_type_section",
                            actions = {
                                on_selection_state_changed = "cx_change_category"
                            }
                        },
                        {type = "list-box",
                            ref = {"available_entities"},
                            style="fcodex_codex_entity_list",
                            actions = {
                                on_selection_state_changed = "cx_view_entity"
                            }
                        },
                    }
                },
                
                {type = "flow", direction = "vertical", ref = { "entity_viewer" }, style="fcodex_codex_info_flow",
                    {type = "flow", direction = "horizontal",
                        {type = "sprite", style = "fcodex_desc_image", ref = {"entity_sprite"}},
                        {type = "flow", direction = "vertical", caption = "Entity", ref = {"entity_desc_frame"},
                            {type = "label", ref = {"entity_desc"}, style="fcodex_codex_desc"},
                            {type = "progressbar", ref = {"entity_color"}, style = "fcodex_codex_color_indicator", visible=false}
                        }
                    },
                    {type = "scroll-pane", direction = "vertical", ref = { "entity_usage" }}
                }
            }
        }
    })
    
    for _,v in pairs(codex_helper_data.categories) do
        refs.category_picker.add_item(v.name)
    end

    refs.titlebar_flow.drag_target = refs.window
    refs.window.force_auto_center()

    local player_table = global.players[player.index]
    if player_table == nil then
        player_table = {}
    end
    
    player_table.codex = {
        refs = refs,
    }
    global.players[player.index] = player_table
    
    
    refs.category_picker.selected_index = 1
    codex_select_category(player_table.dicts, player_table.codex, "item")
    
    player.opened = refs.window
    return player_table.codex
end

local function is_codex_open(player)
    local player_table = util.get_player_data(player)
    
    local codex = player_table.codex
    if codex == nil or codex.refs == nil or codex.refs.window == nil then
        return false, nil
    end
    
    local visible = codex.refs.window.visible
    return visible, player_table.codex
end

local function recipe_slot(amount, amount_range, probability, item_fluid)
    local amount_str = amount
    if amount_str == nil then
        if amount_range ~= nil and
            amount_range.min ~= nil and
            amount_range.max ~= nil then
            amount_str = "" .. amount_range.min .. "-" .. amount_range.max
        end
    end
    
    if amount_str == nil then
        log("Recipe has neither amount nor amount range for: \""..serpent.line(item_fluid).."\"")
        game.print("A recipe contains strange values please report this to the author of \"Factorio Codex\" to help improve it, thank you!")
        amount_str = "?"
    end
    
    local proto = game[item_fluid.type.."_prototypes"][item_fluid.name]
    
    local tooltip = {"", "" .. amount_str .. " x ", proto.localised_name}
    
    if item_fluid.minimum_temperature ~= nil or item_fluid.maximum_temperature ~= nil then
        local temp_str = " "
        
        if item_fluid.minimum_temperature ~= nil then
            temp_str = temp_str..item_fluid.minimum_temperature.."°C"
        end
        
        
        if item_fluid.minimum_temperature ~= item_fluid.maximum_temperature and
           item_fluid.maximum_temperature ~= nil then
            local max_temp = item_fluid.maximum_temperature
            if item_fluid.maximum_temperature > (2^100) then
                max_temp = "∞"
            end
        
            temp_str = temp_str .. " - "..max_temp.."°C"
        end
        
        table.insert(tooltip, temp_str)
    elseif item_fluid.temperature ~= nil then
        table.insert(tooltip, " " .. item_fluid.temperature .. "°C")
    end
    
    
    return {
        type="sprite-button",
        tooltip= tooltip,
        sprite= item_fluid.type .. "/" .. item_fluid.name,
        show_percent_for_small_numbers= true,
        number= probability ~= 1 and probability or nil,
        children= {
                {type= "label", style= "fcodex_recipe_label_top", ignored_by_interaction= true, caption= amount_str},
        },
        actions = {
            on_click = "cx_view_entity"
        }
    }
end

local function format_recipe_gui(recipe, highlight_id)
    local recipe_ui =  {
        type="flow", direction="horizontal", enabled = not recipe.hidden, style="player_input_horizontal_flow",
    }
        
    for _,ingr in pairs(recipe.ingredients) do
        local ingr_proto = game[ingr.type.."_prototypes"][ingr.name]
        
        local slot = recipe_slot(ingr.amount, nil, nil, ingr)
        slot.style = "flib_standalone_slot_button_" .. (highlight_id == ingr.name and "grey" or "default")
        
        table.insert(recipe_ui, slot)
    end
    
    table.insert(recipe_ui, {type="sprite", sprite="fcodex_produces", style="fcodex_produces_sprite"})
    
    for _,pr in pairs(recipe.products) do
        local slot = recipe_slot(pr.amount, {min= pr.amount_min, max= pr.amount_max}, pr.probability, pr)
        slot.style = "flib_standalone_slot_button_" .. (highlight_id == pr.name and "grey" or "default")
        
        table.insert(recipe_ui, slot)
    end
    
    --{type="sprite-button", sprite="", style="flib_standalone_slot_button_default"}
    
    -- recipe info stuff
    
    -- TODO probably cahce somewhere
     --[[local crafting_machines_for_recipe = game.get_filtered_entity_prototypes({
        {filter= "crafting-category", crafting_category= recipe.category, mode= "and"},
     })
     
     local allowed_effects = {}
     
     for e_id,crafting_entity in pairs(crafting_machines_for_recipe) do
        game.print({"", crafting_entity.localised_name, ": ", serpent.line(crafting_entity.allowed_effects)})
        for eff,allow in pairs(crafting_entity.allowed_effects) do
            allowed_effects[eff] = allowed_effects[eff] or allow
        end
     end
     
     game.print(serpent.line(allowed_effects))
     --allowed_effects]]
     
    local crafting_machines_for_recipe = game.get_filtered_entity_prototypes({
        {filter= "crafting-category", crafting_category= recipe.category, mode= "and"},
    })

    local crafting_machines_slots = {
        type="flow", direction="horizontal",
        {type="label", caption={"factorio-codex.produced-in"}},
    }
    for id,m in pairs(crafting_machines_for_recipe) do
        table.insert(crafting_machines_slots, {
            type="sprite", sprite="entity."..id, style="fcodex_produced_in_sprite",
            tooltip=m.localised_name
        })
    end


    return {
        type="flow", direction="vertical",
        recipe_ui,
        crafting_machines_slots,
        {type="label", caption={"factorio-codex.production-time", recipe.energy, math.floor(recipe.energy)}},
    }
end

local function build_recipe_gui(codex, root_gui_elem, type, id)
    local prod_filter = {{filter = "has-product-"..type, elem_filters = {{filter = "name", name = id}}}}
    local ingr_filter = {{filter = "has-ingredient-"..type, elem_filters = {{filter = "name", name = id}}}}
    
    local prod_recipes = game.get_filtered_recipe_prototypes(prod_filter)
    local ingr_recipes = game.get_filtered_recipe_prototypes(ingr_filter)
    
    local produced_by = {type="table", column_count=1, draw_vertical_lines=false, draw_horizontal_lines = true, style="fcodex_recipe_info_borderless_table"}
    local ingredient_in = {type="table", column_count=1, draw_vertical_lines=false, draw_horizontal_lines = true, style="fcodex_recipe_info_borderless_table"}
    
    local tmp = 0
    
    for _, p in pairs(prod_recipes) do
        table.insert(produced_by, format_recipe_gui(p, id))
        tmp = tmp + 1
    end
    
    if tmp == 0 then
        table.insert(produced_by, {type="label", caption="There is no recipe that produces this"})
    end
    
    
    tmp = 0
    for _, p in pairs(ingr_recipes) do
        table.insert(ingredient_in, format_recipe_gui(p, id))
        tmp = tmp + 1
    end
    
    local recipe_gui = {
        {type="frame", direction="vertical", style="subpanel_frame", {
                type="flow", direction="horizontal", style="player_input_horizontal_flow",
                {type="sprite-button", style="control_settings_section_button", sprite="utility/collapse", 
                    name="produced_by_collapse",
                    ref = {"collapse_produced_by"},
                    mouse_button_filter = {"left"},
                    actions = {
                        on_click = "cx_collapse"
                    }
                },
                {type="label", style="caption_label", caption={"factorio-codex.produced-by"}},
                {type="empty-widget", style="fcodex_filler_widget"}
            }, {
                type="flow", direction="vertical", ref = {"produced_by_items"},
                produced_by
            }
        }
    }
    
    if tmp ~= 0 then
        table.insert(recipe_gui, 
        
            {type="frame", direction="vertical", style="subpanel_frame", {
                    type="flow", direction="horizontal", style="player_input_horizontal_flow",
                    {type="sprite-button", style="control_settings_section_button", sprite="utility/collapse", 
                        name="produced_by_collapse",
                        ref = {"collapse_ingredient_in"},
                        mouse_button_filter = {"left"},
                        actions = {
                            on_click = "cx_collapse"
                        }
                    },
                    {type="label", style="caption_label", caption={"factorio-codex.ingredient-in"}},
                    {type="empty-widget", style="fcodex_filler_widget"}
                }, {
                    type="flow", direction="vertical", ref = {"ingredient_in_items"},
                    ingredient_in
                }
            })
    end
    
    local new_refs = gui.build(root_gui_elem, recipe_gui)
    
    
     
    if new_refs.collapse_produced_by ~= nil and new_refs.produced_by_items ~= nil then
        codex.refs.collapse_produced_by = new_refs.collapse_produced_by
        codex.refs.produced_by_items = new_refs.produced_by_items

        codex.produced_by_collapsed = false
    end

    if new_refs.collapse_ingredient_in ~= nil and new_refs.ingredient_in_items ~= nil then
        codex.refs.collapse_ingredient_in = new_refs.collapse_ingredient_in
        codex.refs.ingredient_in_items = new_refs.ingredient_in_items

        codex.ingredient_in_collapsed = false
    end
end

local function codex_item_info(codex, dicts, item)
     local desc = {""}
     
     if dicts["item_descriptions"][item.name] ~= nil then
        table.insert(desc, dicts["item_descriptions"][item.name].."\n")
     end
     
     
     if item.durability_description_key ~= nil then
        table.insert(desc, {item.durability_description_key})
        table.insert(desc, ": ")
        table.insert(desc, item.durability)
        table.insert(desc, {item.durability_description_key})
     end
     
     if item.place_result ~= nil then
        
     
        if item.place_result.localised_description ~= nil then
            table.insert(desc, item.place_result.localised_description)
        end
     end
     
     
     if #desc == 1 then
        desc = {"", "Empty for now. WIP"}
     end
     
     --game.print(serpent.line(desc))
     
     codex.refs.entity_desc.caption = desc
     
     -- Stack size
     local stack_size = item.stackable and ("Stack size: "..item.stack_size) or "Not stackable"
     
     build_recipe_gui(codex, codex.refs.entity_usage, "item", item.name)
end

local function codex_technology_info(codex, dicts, tech)
    codex.refs.entity_desc.caption = tech.localised_description
    
    
end

local function codex_fluid_info(codex, dicts, fluid)
    --codex.refs.entity_desc.caption = "TODO"
    --  "[color=green]■[/color]"
    --[[codex.refs.entity_color.style.color = fluid.base_color
    codex.refs.entity_color.value = 1]]
    
   build_recipe_gui(codex, codex.refs.entity_usage, "fluid", fluid.name)
end

local function codex_show_info(player, id, id_type)
    --game.print("["..id_type.."="..id.."] "..id.." - "..id_type)
    local dicts = util.get_player_data(player).dicts
    
    local open, codex = is_codex_open(player)
    if not open or dicts == nil then
        game.print("Cant show "..id.." codex not open")
        return
    end
    
    local entity_prototype = game[id_type .. "_prototypes"][id]
    
    codex.entity_view = {
        type=id_type,
        id=id
    }
    
    codex_select_category(dicts, codex, id_type)
    codex.refs.entity_usage.scroll_to_top()
    
    if codex.entity_list ~= nil then
        local indx = nil
        for i, e in pairs(codex.entity_list) do
            if e ~= nil and e.id == id then
                indx = i
                break
            end
        end
        
        if indx ~= nil then
            codex.refs.available_entities.scroll_to_item(indx)
            codex.refs.available_entities.selected_index = indx
        end
    end
    
    
    codex.refs.entity_sprite.sprite = id_type .. "/" .. id
    
    local sprite_tooltip = nil
    if entity_prototype.localised_description ~= nil then
        sprite_tooltip = entity_prototype.localised_description
    elseif id_type == "item" then
        if entity_prototype.place_result ~= nil then
            sprite_tooltip = entity_prototype.place_result.localised_description
        elseif entity_prototype.place_as_equipment_result ~= nil then
            sprite_tooltip = entity_prototype.place_as_equipment_result.localised_description
        elseif entity_prototype.place_as_tile_result ~= nil then
            sprite_tooltip = entity_prototype.place_as_tile_result.localised_description
        end
    end
    
    codex.refs.entity_sprite.tooltip = sprite_tooltip
    --codex.refs.entity_sprite.resize_to_sprite = false
    codex.refs.entity_desc_frame.caption = entity_prototype.localised_name
    codex.refs.entity_desc.caption = entity_prototype.localised_description
    
    
    codex.refs.entity_usage.clear()
    
    local type_switch = {
        item=codex_item_info,
        fluid=codex_fluid_info,
        technology=codex_technology_info
    }
    
    local func = type_switch[id_type]
    if func ~= nil then
        func(codex, dicts, entity_prototype)
    end
end

local function open_codex(player, id, id_type)
    local open, codex = is_codex_open(player)
    if not open then
        if codex == nil then
            codex = build_codex(player)
        end
        codex.refs.window.visible = true
        player.opened = codex.refs.window
    end

    if id ~= nil and id_type ~= nil then
        codex_show_info(player, id, id_type)
    end
end

local function close_codex(player)
    local open, codex = is_codex_open(player)

    if open then
        local player_table = util.get_player_data(player)
        
        if player_table.codex.refs ~= nil then
            player_table.codex.refs.window.visible = false
        end
        
        
        if player.opened then
            player.opened = nil
        end
        
        return true
    else
        return false
    end
end

local function toggle_codex(player)
    local open, codex = is_codex_open(player)
    
     if open then
        close_codex(player)
    else
        open_codex(player)
    end
end

local function codex_gui_action(action, event)
    local action_list = {
        cx_close = 
            function (player, event)
                local could_close = close_codex(player)
                if not could_close then
                    log("Previous pre-mirgation gui detected. trying to close")
                    local tmp = event.element
                    
                    if tmp.name ~= "screen" then
                        while tmp.parent.name ~= "screen" do
                            tmp = tmp.parent
                        end
                    else
                        game.print("Sorry I am unable to close this GUI. Try pressing the [img=utility/close_white] button instead.")
                        return
                    end
                    
                    local player_table = util.get_player_data(player)
                    if player_table.codex ~= nil and player_table.codex.refs ~= nil and player_table.codex.refs.window == tmp then
                        return
                    end

                    tmp.destroy()
                end
            end,
        cx_change_category = 
            function (player, event)
                local player_table = util.get_player_data(player)
                local dicts = player_table.dicts

                codex_select_category(dicts, player_table.codex, event.element.selected_index)
            end,
        cx_view_entity =
            function (player, event)
                local player_table = util.get_player_data(player)
                local dicts = player_table.dicts
                local open, codex = is_codex_open(player)
                
                if not open or codex.entity_list == nil then
                    game.print("Cant view "..event.element.selected_index.." No open codex")
                    return
                end
                
                local selected = {
                    id= nil,
                    type= nil
                }
                local selected_index = event.element.selected_index
                
                -- was the entity list clicked?
                if selected_index ~= nil and selected_index > 0 then
                    selected.type = codex.category.type
                    selected.id = codex.entity_list[selected_index].id
                    
                -- was a sprite button in teh recipe view clicked?
                elseif event.element.type == "sprite-button" and  event.element.sprite ~= nil then
                    local entity_type, id = string.match(event.element.sprite, "^(%S+)[/.]([%S]+)")
                    
                    if codex_helper_data ~= nil and codex_helper_data.categories ~= nil then
                        for _, cx_helper in pairs(codex_helper_data.categories) do
                            if entity_type == cx_helper.type then
                                selected.type = entity_type
                                selected.id = id
                                break
                            end
                        end
                    end
                end
                
                
                if selected == nil or selected.id == nil or selected.type == nil then
                    return
                end

                codex_show_info(player, selected.id, selected.type)
            end,
        cx_update_search =
            function (player, event)
                -- do nothing for now
            end,
        cx_collapse =
            function (player, event)
                 local open, codex = is_codex_open(player)
                 
                 if not open then
                    return
                 end
                 
                 
                 if event.element == codex.refs.collapse_produced_by then
                    codex.produced_by_collapsed = not codex.produced_by_collapsed
                    
                    codex.refs.collapse_produced_by.sprite= "utility/" .. (codex.produced_by_collapsed and "expand" or "collapse")
                    codex.refs.produced_by_items.visible = not codex.produced_by_collapsed
                    
                 elseif event.element == codex.refs.collapse_ingredient_in then
                    codex.ingredient_in_collapsed = not codex.ingredient_in_collapsed
                    
                    codex.refs.collapse_ingredient_in.sprite= "utility/" .. (codex.ingredient_in_collapsed and "expand" or "collapse")
                    codex.refs.ingredient_in_items.visible = not codex.ingredient_in_collapsed
                 end
            end
    }
    
     local player = game.get_player(event.player_index)
     
     local action_func = action_list[action]
     if action_func ~= nil then
        action_func(player, event)
    else
        game.print("Unkown action \"" .. action .. "\" for codex!")
    end
end

local function codex_gui_rebuild(player)
    local player_table = util.get_player_data(player)
    game.print("Rebuilding coedx gui")
    
    local codex = player_table.codex
    if codex ~= nil and codex.refs ~= nil then
        codex.refs.window.destroy()
        codex.refs = nil
        
        build_codex(player)
        
        if codex.entity_view ~= nil then
            codex_show_info(player, codex.entity_view.id, codex.entity_view.type)
        end
        
    end
end

codex.toggle = toggle_codex
codex.open = open_codex
codex.close = close_codex
codex.show_item_info = codex_show_item_info
codex.gui_action = codex_gui_action
codex.rebuild = codex_gui_rebuild

return codex
