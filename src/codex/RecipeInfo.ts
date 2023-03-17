import {getRecipeCache} from "cache/RecipeCache"
import RecipeUI from "codex/RecipeUI"

/** @noResolution */
import * as FLIB_gui from "__flib__.gui";


namespace RecipeInfo {
    function get_collapsable_list(label: LocalisedString, list: FLIBGuiBuildStructure[]): FLIBGuiBuildStructure {
        return {
            type: "frame", direction: "vertical", style: "subpanel_frame",
            1: {
                type: "flow", direction: "horizontal", style: "player_input_horizontal_flow",
                1: {
                    type: "sprite-button", style: "control_settings_section_button", sprite: "utility/collapse",
                    name: "collapse_button",
                    mouse_button_filter: ["left"],
                    actions: {
                        on_click: "toggle_list_collapse"
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

    function get_mineable_from(itemOrFluid: LuaItemPrototype | LuaFluidPrototype, force: LuaForce): FLIBGuiBuildStructure[] {
        let miner_recipes = getRecipeCache()?.getMinerRecipesFor(itemOrFluid, force)
        let mineable_from:FLIBGuiBuildStructure[] = []

        if (miner_recipes != undefined) {
            mineable_from = miner_recipes.map(
                (recipe) => RecipeUI.getUI(recipe, false, itemOrFluid.name))
        }

        return mineable_from
    }

    function get_produced_by_recipes(itemOrFluid: LuaItemPrototype | LuaFluidPrototype): FLIBGuiBuildStructure[] {
        let isItem = itemOrFluid.object_name == "LuaItemPrototype"
        const filter: RecipePrototypeFilterWrite[] = [{
            filter: isItem ? "has-product-item" : "has-product-fluid",
            elem_filters: [{ filter: "name", name: itemOrFluid.name}]
        }]
        const prod_recipes_raw = game.get_filtered_recipe_prototypes(filter)

        let produced_by:FLIBGuiBuildStructure[] = []

        for (let [, recipe] of prod_recipes_raw) {
            produced_by.push(RecipeUI.getUI(recipe, false, itemOrFluid.name))
        }

        return produced_by
    }

    function get_ingredient_in_recipes(itemOrFluid: LuaItemPrototype | LuaFluidPrototype): FLIBGuiBuildStructure[] {
        let isItem = itemOrFluid.object_name == "LuaItemPrototype"
        const filter: RecipePrototypeFilterWrite[] = [{
            filter: isItem ? "has-ingredient-item" : "has-ingredient-fluid",
            elem_filters: [{ filter: "name", name: itemOrFluid.name}]
        }]
        const ingr_recipes_raw = game.get_filtered_recipe_prototypes(filter)

        let ingredient_in:FLIBGuiBuildStructure[] = []
        for (let [, recipe] of ingr_recipes_raw) {
            ingredient_in.push(RecipeUI.getUI(recipe, false, itemOrFluid.name))
        }

        return ingredient_in
    }
    export function build_gui(root: undefined | LuaGuiElement, itemOrFluid: LuaItemPrototype | LuaFluidPrototype,
                              force: undefined | LuaForce) {
        if (root == undefined) {
            $log_info!("No root gui element to attach recipe info to!")
            return
        }

        let recipeGui:FLIBGuiBuildStructure[] = []

        if (force != undefined) {
            let mined_from = get_mineable_from(itemOrFluid, force)
            if (mined_from.length > 0) {
                recipeGui.push(get_collapsable_list(["factorio-codex.mined-from"], mined_from))
            }
        }

        let producedBy = get_produced_by_recipes(itemOrFluid)
        if (producedBy.length > 0) {
            recipeGui.push(get_collapsable_list(["factorio-codex.produced-by"], producedBy))
        }

        let ingredientIn = get_ingredient_in_recipes(itemOrFluid)
        if (ingredientIn.length > 0) {
            recipeGui.push(get_collapsable_list(["factorio-codex.ingredient-in"], ingredientIn))
        }

        if (recipeGui.length > 0) {
            FLIB_gui.build(root, recipeGui)
        }

        getRecipeCache()
    }
}

export default RecipeInfo