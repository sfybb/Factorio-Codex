local gui = require("__flib__.gui")

local TechInfo = { }
local TechInfo_mt = {__index = TechInfo}

local RecipeInfo = require("scripts.codex.recipe_info")

function TechInfo:new(force_index)
    local o = {}   -- create object if user does not provide one
    setmetatable(o, TechInfo_mt)

    o.force_index = force_index
    return o
end

function TechInfo:load()
    setmetatable(self, TechInfo_mt)
end

function TechInfo:build_gui_for_tech(root_gui_elem, tech)

    local unlocked_recipes = {type="table", column_count=1, draw_vertical_lines=false, draw_horizontal_lines = true, style="fcodex_recipe_info_borderless_table"}

    for _,effect in pairs(tech.effects) do
        log("Effect: " .. effect.type)
        if effect.type == "unlock-recipe" then
            local recipe_gui = RecipeInfo:get_single_recipe_gui(game.recipe_prototypes[effect.recipe], "", false)
            if recipe_gui ~= nil then
                table.insert(unlocked_recipes, recipe_gui)
            end
        end
    end

    local tech_gui = {
    }

    log("Ul R: " .. #unlocked_recipes)
    if #unlocked_recipes > 0 then
        table.insert(tech_gui, {
            type="frame", direction="vertical", style="subpanel_frame", {
                type="flow", direction="horizontal", style="player_input_horizontal_flow",
                {type="sprite-button", style="control_settings_section_button", sprite="utility/collapse",
                 name="produced_by_collapse",
                 ref = {"collapse_produced_by"},
                 mouse_button_filter = {"left"},
                 actions = {
                     on_click = "cx_ri_collapse"
                 }
                },
                {type="label", style="caption_label", caption={"factorio-codex.unlocked-recipes"}},
                {type = "empty-widget", style = "flib_titlebar_drag_handle", ignored_by_interaction = true}
            }, {
                 type="flow", direction="vertical", ref = {"produced_by_items"},
                 unlocked_recipes
             }
        })
    end

    gui.build(root_gui_elem, tech_gui)
end

return TechInfo