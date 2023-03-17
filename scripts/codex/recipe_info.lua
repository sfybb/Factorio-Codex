local gui = require("__flib__.gui")
local flib_table = require("__flib__.table")

local sort = require("scripts.sort")
local serpent = require("scripts.serpent")

local RecipeInfo = { }
local RecipeInfo_mt = {__index = RecipeInfo}

local function set_expansion_panel_state(button, content, collapsed)
    content.visible = not collapsed
    if collapsed then
        button.sprite = "utility/expand"
    else
        button.sprite = "utility/collapse"
    end
end

function RecipeInfo:new (force_index)
    local o = {}   -- create object if user does not provide one
    setmetatable(o, RecipeInfo_mt)

    o.force_index = force_index
    return o
end

function RecipeInfo:load()
    setmetatable(self, RecipeInfo_mt)
    log("Loading RecipeInfo: "..serpent.line(self, {nocode=true}))
    return self
end

function RecipeInfo:destroy()
    -- nothing to do
end

function RecipeInfo:build_recipe_slot(recipe_item_info, keep_empty)
    local slot_style = nil
	local rounded_amount_str
    local amount_str = recipe_item_info.amount
    if amount_str == nil and
       recipe_item_info.amount_min ~= nil and
       recipe_item_info.amount_max ~= nil then
        amount_str = "" ..  recipe_item_info.amount_min .. "-" .. recipe_item_info.amount_max

		rounded_amount_str = "" ..  math.round(recipe_item_info.amount_min,2) ..
							"-" ..  math.round(recipe_item_info.amount_max,2)
	else
		rounded_amount_str = math.round(recipe_item_info.amount, 2)
    end

    --log("Amount: "  .. serpent.line(recipe_item_info.amount,{comment=false}) .. " ; "..serpent.line(recipe_item_info.amount_min,{comment=false}).." - "..serpent.line(recipe_item_info.amount_max,{comment=false}))

    if amount_str == nil then
        log("Recipe has neither amount nor amount range for: \""..serpent.line(recipe_item_info).."\"")
        game.print("A recipe contains strange values please report this to the author of \"Factorio Codex\" to help improve it, thank you!")
        amount_str = "?"
		rounded_amount_str= "?"
    end

    if keep_empty == false and (recipe_item_info.amount == 0 or (recipe_item_info.amount_min == 0 and recipe_item_info.amount_max == 0)) then
        return nil
    end

    local tooltip = {"", "" .. amount_str .. " x "}

    if recipe_item_info.localised_name == nil then
        local proto = game[recipe_item_info.type.."_prototypes"][recipe_item_info.name]
        table.insert(tooltip, proto.localised_name)
    else
        table.insert(tooltip, recipe_item_info.localised_name)
    end



    if recipe_item_info.minimum_temperature ~= nil or recipe_item_info.maximum_temperature ~= nil then
        local temp_str = " "

        if recipe_item_info.minimum_temperature ~= nil then
            temp_str = temp_str..recipe_item_info.minimum_temperature.."°C"
        end


        if recipe_item_info.minimum_temperature ~= recipe_item_info.maximum_temperature and
           recipe_item_info.maximum_temperature ~= nil then
            local max_temp = recipe_item_info.maximum_temperature
            if recipe_item_info.maximum_temperature > (2^100) then
                max_temp = "∞"
            end

            temp_str = temp_str .. " - "..max_temp.."°C"
        end

        table.insert(tooltip, temp_str)
	elseif recipe_item_info.temperature ~= nil then
        table.insert(tooltip, " " .. recipe_item_info.temperature .. "°C")
    end

    local is_clickable = (recipe_item_info.type == "item" or recipe_item_info.type == "fluid")

    --table.insert(tooltip, {"\nType: \""..recipe_item_info.type.."\""})

    return {
        type="sprite-button",
        style = slot_style,
        tooltip= tooltip,
        sprite= recipe_item_info.sprite or (recipe_item_info.type .. "/" .. recipe_item_info.name),
        show_percent_for_small_numbers= true,
        number= recipe_item_info.probability ~= 1 and recipe_item_info.probability or nil,
        children= {
                {type= "label", style= "fcodex_recipe_label_top", ignored_by_interaction= true, caption= rounded_amount_str},
        },
        actions = {
            on_click = "cx_view_entity"
        },
        enabled = is_clickable
    }
end

function RecipeInfo:get_recipe_slot_style(slot, entity, should_highlight, main_product, is_locked)
    local normal_colors = {
        default = "default",
        highlight = "green",
        main_product = "grey",
        debug_highlight = "pink"
    }

    local locked_colors = {
        default = "red",
        highlight = "yellow",
        main_product = "orange",
        debug_highlight = "purple"
    }

    local active_color_pallet = is_locked and locked_colors or normal_colors

    local color = active_color_pallet.default
    if should_highlight then
        color = active_color_pallet.highlight
    elseif main_product ~= nil and main_product.name == entity.name then
        color = active_color_pallet.main_product
    elseif debug:is_enabled() and slot.tooltip[2] == "0 x " then
        color = active_color_pallet.debug_highlight
    end

    return "flib_standalone_slot_button_"..color
end

function RecipeInfo:get_single_recipe_gui (recipe, highlight_id, locked)
    locked = locked or false
    local recipe_ui =  {
        type="flow", direction="horizontal", enabled = true, style="player_input_horizontal_flow",
    }

    local highlight_id_occured = false

    local has_one_ingr = #recipe.ingredients == 1

    local always_show_recipe = debug:is_enabled()

    for _,ingr in pairs(recipe.ingredients) do
        local should_highlight = highlight_id == ingr.name

        local slot = RecipeInfo:build_recipe_slot(ingr, has_one_ingr or always_show_recipe)

        if slot ~= nil then
            slot.style = RecipeInfo:get_recipe_slot_style(slot, ingr, should_highlight, nil, locked)

            if should_highlight then
                highlight_id_occured = true
                slot.enabled = false
            end

            table.insert(recipe_ui, slot)
        end
    end

    table.insert(recipe_ui, {type="sprite", sprite="fcodex_produces", style="fcodex_produces_sprite"})

    local has_one_pr = #recipe.products == 1
    for _,pr in pairs(recipe.products) do
        local should_highlight = highlight_id == pr.name

        local slot = self:build_recipe_slot(pr, has_one_pr or always_show_recipe)

        if slot ~= nil then
            slot.style = self:get_recipe_slot_style(slot, pr, should_highlight, recipe.main_product, locked)

            if should_highlight then
                highlight_id_occured = true
                slot.enabled = false
            end

            table.insert(recipe_ui, slot)
        end
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

    local crafting_machines_slots = {}
    if recipe.category ~= nil then
        local crafting_machines_for_recipe = global.cache:get_cache("recipe_cache"):
        get_crafting_machines(recipe.category)

        crafting_machines_slots = {
            type="flow", direction="horizontal",
            {type="label", caption={"factorio-codex.produced-in"}},
        }
        for id,m in pairs(crafting_machines_for_recipe) do
            table.insert(crafting_machines_slots, {
                type="sprite", sprite="entity."..id, style="fcodex_produced_in_sprite",
                tooltip=m.localised_name
            })
        end
    end


    return {
        type="flow", direction="vertical",
        recipe_ui,
        crafting_machines_slots,
        {type="label", caption={"factorio-codex.production-time", math.round(recipe.energy, 4), math.floor(recipe.energy)}},
        --{type="label", caption={"", "Order: \""..recipe.order.."\""}},
    }
end

function RecipeInfo:build_gui_for_item(root_gui_elem, type, id)
    local prod_filter = {{filter = "has-product-"..type, elem_filters = {{filter = "name", name = id}}}}
    local ingr_filter = {{filter = "has-ingredient-"..type, elem_filters = {{filter = "name", name = id}}}}

    local prod_recipes_cust_table = game.get_filtered_recipe_prototypes(prod_filter)
    local ingr_recipes_cust_table = game.get_filtered_recipe_prototypes(ingr_filter)

    local produced_by = {type="table", column_count=1, draw_vertical_lines=false, draw_horizontal_lines = true, style="fcodex_recipe_info_borderless_table"}
    local ingredient_in = {type="table", column_count=1, draw_vertical_lines=false, draw_horizontal_lines = true, style="fcodex_recipe_info_borderless_table"}

    local add_prod_recipes = global.cache:get_cache("recipe_cache"):get_additional_recipes_for_product(type, id, game.forces[self.force_index])
    local add_ingr_recipes = global.cache:get_cache("recipe_cache"):get_additional_recipes_for_ingredient(type, id, game.forces[self.force_index])

    local prod_recipes = {}
    for _,p in pairs(prod_recipes_cust_table) do table.insert(prod_recipes,p) end

    local ingr_recipes = {}
    for _,p in pairs(ingr_recipes_cust_table) do table.insert(ingr_recipes,p) end

    sort.array(prod_recipes, {sort.factorio})
    sort.array(ingr_recipes, {sort.factorio})

    local recipe_locked = false
    local force_recipes = game.forces[self.force_index].recipes or {}

    for _, p in pairs(add_prod_recipes) do
        local recipe_gui = self:get_single_recipe_gui(p, id)
        if recipe_gui ~= nil then
            table.insert(produced_by, recipe_gui)
        end
    end

    for _, p in ipairs(prod_recipes) do
        local recipe_gui = self:get_single_recipe_gui(p, id, force_recipes[p.name])
        if recipe_gui ~= nil then
            table.insert(produced_by, recipe_gui)
        end
    end

    if #prod_recipes == 0 and next(add_prod_recipes) == nil then
        table.insert(produced_by, {type="label", caption="There is no recipe that produces this"})
    end


    for _, p in pairs(add_ingr_recipes) do
        local recipe_gui = self:get_single_recipe_gui(p, id)
        if recipe_gui ~= nil then
            table.insert(ingredient_in, recipe_gui)
        end
    end

    for _, p in ipairs(ingr_recipes) do
        local recipe_gui = self:get_single_recipe_gui(p, id, force_recipes[p.name])
        if recipe_gui ~= nil then
            table.insert(ingredient_in, recipe_gui)
        end
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
                {type="label", style="caption_label", caption={"factorio-codex.produced-by"}},
                {type = "empty-widget", style = "flib_titlebar_drag_handle", ignored_by_interaction = true}
            }, {
                type="flow", direction="vertical", ref = {"produced_by_items"},
                produced_by
            }
        }
    }

    if #ingr_recipes ~= 0 or next(add_ingr_recipes) ~= nil then
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
                    {type="label", style="caption_label", caption={"factorio-codex.ingredient-in"}},
                    {type = "empty-widget", style = "flib_titlebar_drag_handle", ignored_by_interaction = true}
                }, {
                    type="flow", direction="vertical", ref = {"ingredient_in_items"},
                    ingredient_in
                }
            })
    end

    local refs = gui.build(root_gui_elem, recipe_gui)

    self.refs = refs
    self.produced_by_collapsed = false
    self.ingredient_in_collapsed = false
end


function RecipeInfo:handle_gui_action(action, event)
    local this = self
    local action_list = {
        cx_ri_collapse = function(event)
            if event.element == this.refs.collapse_produced_by then
                this.produced_by_collapsed = not this.produced_by_collapsed

                set_expansion_panel_state(this.refs.collapse_produced_by, this.refs.produced_by_items, this.produced_by_collapsed)
            elseif event.element == this.refs.collapse_ingredient_in then
                this.ingredient_in_collapsed = not this.ingredient_in_collapsed

                set_expansion_panel_state(this.refs.collapse_ingredient_in, this.refs.ingredient_in_items, this.ingredient_in_collapsed)
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

function RecipeInfo:validate(expected_force_index)
    log("   Recipe Info Validate: Checking recipe info...")
    local valid = true
    local fixed = true

    if getmetatable(self) ~= RecipeInfo_mt then
        log("   Recipe Info Validate: Metatable is not the Categories metatable!")
        setmetatable(self, RecipeInfo_mt)
        valid = false
        fixed = fixed and true
    end

    local not_nil_values = {
        "force_index"
    }
    local nil_detected = false

    for _,v in pairs(not_nil_values) do
        if self[v] == nil then
            log("   Recipe Info Validate: Detected nil value \""..v.."\"")
            nil_detected = true
        end
    end

    if nil_detected then
        log("   Recipe Info Validate: Contents: " .. serpent.line(self, {nocode=true}))
        valid = false
        fixed = false
    end

    if self.force_index ~= expected_force_index then
        log("   Recipe Info Validate: Force mismatch (updating)! E: "..expected_force_index.." A: " .. serpent.line(self.force_index))
        self.force_index = expected_force_index
    end

    return valid, fixed
end

return RecipeInfo
