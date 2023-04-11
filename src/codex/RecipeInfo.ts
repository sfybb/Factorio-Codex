import {getRecipeCache} from "cache/RecipeCache"
import RecipeUI from "codex/RecipeUI"
import CodexCommonUI from "codex/CodexCommonUI";

/** @noResolution */
import * as FLIB_gui from "__flib__.gui";
import SearchUtils, {anyPrototype, SortOrderDefault} from "../SearchUtils";



namespace RecipeInfo {
    function sortRawResults(raw: LuaCustomTable<string, LuaRecipePrototype>, mainProd?: string): LuaRecipePrototype[] {
        mainProd = mainProd != undefined ? mainProd : ""
        let res: LuaRecipePrototype[] = []
        let mainProdArr: LuaRecipePrototype[] = []
        for (let [, recipe] of raw) {
            if(recipe.main_product?.name != mainProd) res.push(recipe)
            else mainProdArr.push(recipe)
        }
        SearchUtils.sort(res, SortOrderDefault.factorio)
        SearchUtils.sort(mainProdArr, SortOrderDefault.factorio)

        return mainProd != "" ? mainProdArr.concat(res) : res
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

    function get_rocket_launch_recipes(itemOrFluid: LuaItemPrototype | LuaFluidPrototype): FLIBGuiBuildStructure[] {
        let rl_recipes = getRecipeCache()?.getRocketLaunchRecipes(itemOrFluid)
        let rl_ui:FLIBGuiBuildStructure[] = []

        if (rl_recipes != undefined) {
            rl_ui = rl_recipes.map(
                (recipe) => RecipeUI.getUI(recipe, false, itemOrFluid.name))
        }

        return rl_ui
    }

    function get_produced_by_recipes(itemOrFluid: LuaItemPrototype | LuaFluidPrototype,
                                     force_recipes: Record<string, LuaRecipe>): FLIBGuiBuildStructure[] {
        let isItem = itemOrFluid.object_name == "LuaItemPrototype"
        const filter: RecipePrototypeFilterWrite[] = [{
            filter: isItem ? "has-product-item" : "has-product-fluid",
            elem_filters: [{ filter: "name", name: itemOrFluid.name}]
        }]
        const prod_recipes_arr = sortRawResults(game.get_filtered_recipe_prototypes(filter), itemOrFluid.name)

        let produced_by:FLIBGuiBuildStructure[] = []

        for (let recipe of prod_recipes_arr) {
            let isUnavailable = !(recipe.name in force_recipes) || !force_recipes[recipe.name].enabled
            produced_by.push(RecipeUI.getUI(recipe, isUnavailable, itemOrFluid.name))
        }

        return produced_by
    }

    function get_ingredient_in_recipes(itemOrFluid: LuaItemPrototype | LuaFluidPrototype,
                                       force_recipes: Record<string, LuaRecipe>): FLIBGuiBuildStructure[] {
        let isItem = itemOrFluid.object_name == "LuaItemPrototype"
        const filter: RecipePrototypeFilterWrite[] = [{
            filter: isItem ? "has-ingredient-item" : "has-ingredient-fluid",
            elem_filters: [{ filter: "name", name: itemOrFluid.name}]
        }]
        const ingr_recipes_arr: LuaRecipePrototype[] = sortRawResults(game.get_filtered_recipe_prototypes(filter))

        let ingredient_in:FLIBGuiBuildStructure[] = []
        for (let recipe of ingr_recipes_arr) {
            let isUnavailable = !(recipe.name in force_recipes) || !force_recipes[recipe.name].enabled
            ingredient_in.push(RecipeUI.getUI(recipe, isUnavailable, itemOrFluid.name))
        }

        return ingredient_in
    }
    export function build_gui(root: undefined | LuaGuiElement, itemOrFluid: LuaItemPrototype | LuaFluidPrototype,
                              force: undefined | LuaForce) {
        if (root == undefined) {
            $log_info!("No root gui element to attach recipe info to!")
            return
        }

        const force_recipes: Record<string, LuaRecipe> =  force != undefined ? force.recipes : {}

        let recipeGui:FLIBGuiBuildStructure[] = []

        if (force != undefined) {
            let mined_from = get_mineable_from(itemOrFluid, force)
            if (mined_from.length > 0) {
                recipeGui.push(CodexCommonUI.get_collapsable_list(["factorio-codex.mined-from"], mined_from))
            }
        }

        let rocketLaunchRecipes = get_rocket_launch_recipes(itemOrFluid)
        if (rocketLaunchRecipes.length > 0) {
            recipeGui.push(CodexCommonUI.get_collapsable_list(["factorio-codex.rocket-launch-recipes"], rocketLaunchRecipes))
        }

        let producedBy = get_produced_by_recipes(itemOrFluid, force_recipes)
        if (producedBy.length > 0) {
            recipeGui.push(CodexCommonUI.get_collapsable_list(["factorio-codex.produced-by"], producedBy))
        }

        let ingredientIn = get_ingredient_in_recipes(itemOrFluid, force_recipes)
        if (ingredientIn.length > 0) {
            recipeGui.push(CodexCommonUI.get_collapsable_list(["factorio-codex.ingredient-in"], ingredientIn))
        }

        if (recipeGui.length > 0) {
            FLIB_gui.build(root, recipeGui)
        }
    }
}

export default RecipeInfo