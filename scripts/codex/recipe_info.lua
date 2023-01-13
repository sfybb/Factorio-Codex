RecipeInfo= { }

local function set_expansion_panel_state(button, content, collapsed)
    content.visible = not collapsed
    if collapsed then
        button.sprite = "utility/expand"
    else
        button.sprite = "utility/collapse"
    end
end

function RecipeInfo:new (o)
    local o = o or {}   -- create object if user does not provide one
    setmetatable(o, self)
    self.__index = self
    return o
end


function RecipeInfo:build_recipe_slot(recipe_item_info)
    local amount_str = recipe_item_info.amount
    if amount_str == nil and
       recipe_item_info.amount_min ~= nil and
       recipe_item_info.amount_max ~= nil then
        amount_str = "" ..  recipe_item_info.amount_min .. "-" .. recipe_item_info.amount_max
    end
    
    if amount_str == nil then
        log("Recipe has neither amount nor amount range for: \""..serpent.line(recipe_item_info).."\"")
        game.print("A recipe contains strange values please report this to the author of \"Factorio Codex\" to help improve it, thank you!")
        amount_str = "?"
    end
    
    local proto = game[recipe_item_info.type.."_prototypes"][recipe_item_info.name]
    
    local tooltip = {"", "" .. amount_str .. " x ", proto.localised_name}
    
    if recipe_item_info.minimum_temperature ~= nil or recipe_item_info.maximum_temperature ~= nil then
        local temp_str = " "
        
        if recipe_item_info.minimum_temperature ~= nil then
            temp_str = temp_str..recipe_item_info.minimum_temperature.."°C"
        end
        
        
        if recipe_item_info.minimum_temperature ~= recipe_item_info.maximum_temperature and
           recipe_item_info.maximum_temperature ~= nil then
            local max_temp = recipe_item_info.maximum_temperature
            if recipe_item_info.maximum_temperature > (2^970) then
                max_temp = "∞"
            end
        
            temp_str = temp_str .. " - "..max_temp.."°C"
        end
    end
    
    return {
        type="sprite-button",
        tooltip= tooltip,
        sprite= recipe_item_info.type .. "/" .. recipe_item_info.name,
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

function RecipeInfo:create_gui_for_recipe (recipe, highlight_id)
    local recipe_ui =  {
        type="flow", direction="horizontal", enabled = not recipe.hidden, style="player_input_horizontal_flow",
    }
        
    for _,ingr in pairs(recipe.ingredients) do
        --[[if text ~= "" then
            text = text .. " + "
        end
        text = text .. "" .. ingr.amount .. "[" .. ingr.type .. "=" .. ingr.name .. "]"]]
        
        local ingr_proto = game[ingr.type.."_prototypes"][ingr.name]
        
        local slot = self:build_recipe_slot(ingr)
        slot.style = "flib_standalone_slot_button_" .. (highlight_id == ingr.name and "grey" or "default")
        
        table.insert(recipe_ui, slot)
    end
    
    table.insert(recipe_ui, {type="sprite", sprite="fcodex_produces", style="fcodex_produces_sprite"})
    
    for _,pr in pairs(recipe.products) do
        --text = text .. "" .. pr.amount .. "[" .. pr.type .. "=" .. pr.name .. "]"
        
        local slot = self:build_recipe_slot(pr)
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
   
    return recipe_ui
end

function RecipeInfo:build_gui_for_item(codex, root_gui_elem, type, id)
    local prod_filter = {{filter = "has-product-"..type, elem_filters = {{filter = "name", name = id}}}}
    local ingr_filter = {{filter = "has-ingredient-"..type, elem_filters = {{filter = "name", name = id}}}}
    
    local prod_recipes = game.get_filtered_recipe_prototypes(prod_filter)
    local ingr_recipes = game.get_filtered_recipe_prototypes(ingr_filter)
    
    local produced_by = {type="table", column_count=1, draw_vertical_lines=false, draw_horizontal_lines = true, style="fcodex_recipe_info_borderless_table"}
    local ingredient_in = {type="table", column_count=1, draw_vertical_lines=false, draw_horizontal_lines = true}
    
    local tmp = 0
    
    for _, p in pairs(prod_recipes) do
        table.insert(produced_by, self:create_gui_for_recipe(p, id))
        tmp = tmp + 1
    end
    
    if tmp == 0 then
        table.insert(produced_by, {type="label", caption="There is no recipe that produces this"})
    end
    
    
    tmp = 0
    for _, p in pairs(ingr_recipes) do
        table.insert(ingredient_in, self:create_gui_for_recipe(p, id))
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
                        on_click = "cx_ri_collapse"
                    }
                },
                {type="label", style="caption_label", caption="Produced by"}
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
                            on_click = "cx_ri_collapse"
                        }
                    },
                    {type="label", style="caption_label", caption="Ingerdient in"}
                }, {
                    type="flow", direction="vertical", ref = {"ingredient_in_items"},
                    ingredient_in
                }
            })
    end
    
    local refs = gui.build(root_gui_elem, recipe_gui)
    
    self.refs = refs
    slef.produced_by_collapsed = false
    slef.ingredient_in_collapsed = false
end


function RecipeInfo:handle_gui_action(action, event)
    local action_list = {
        cx_ri_collapse = function(event)
            if event.element == self.refs.collapse_produced_by then
                self.produced_by_collapsed = not self.produced_by_collapsed

                set_expansion_panel_state(self.refs.collapse_produced_by, self.refs.produced_by_items, self.produced_by_collapsed)
            elseif event.element == self.refs.collapse_ingredient_in then
                self.ingredient_in_collapsed = not self.ingredient_in_collapsed

                set_expansion_panel_state(self.refs.collapse_ingredient_in, self.refs.ingredient_in_items, self.ingredient_in_collapsed)
            else
                return false
            end

            return true
        end
    }

    local action_func = action_list[action]
    if action_func == nil then
        return false
    end
    return action_func(event)
end
