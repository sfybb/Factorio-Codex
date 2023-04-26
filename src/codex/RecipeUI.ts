import {getRecipeCache, AnyRecipe, CustomIngredient} from "cache/RecipeCache";

interface ColorPallet {
    default: string,
    highlight: string,
    main_product?: string,
    debug_highlight?: string
}

const ColorPallets: {[key: string]: ColorPallet} = {
    default: {
        default: "default",
        highlight: "green",
        main_product: "grey",
        debug_highlight: "pink"
    },
    locked: {
        default: "red",
        highlight: "yellow",
        main_product: "orange",
        debug_highlight: "purple"
    }
}

interface ProdOrIngrExtension {
    // Product definitions
    amount_min?: number,
    amount_max?: number,
    probability?: number,
    temperature?: double

    // Ingredient definitions
    minimum_temperature?: double,
    maximum_temperature?: double


    // Addons
    localised_name?: LocalisedString
    sprite?: SpritePath
}

type ProdOrIngr = (Product | Ingredient | CustomIngredient) & ProdOrIngrExtension

const infinityTemp = (2 ** 100)

const gui_name = "codex"
const UIStructures : {
    base_recipe_ui: FLIBGuiBuildStructure,
    recipe_visualization: FLIBGuiBuildStructure,
    ingredient_product_separator: FLIBGuiBuildStructure,
    slotButton: FLIBGuiBuildStructure
} = {
    base_recipe_ui: {type: "flow", direction: "vertical"},
    recipe_visualization: {type: "flow", direction: "horizontal", enabled: true, style: "player_input_horizontal_flow"},
    ingredient_product_separator:  {type: "sprite", sprite: "fcodex_produces", style: "fcodex_produces_sprite"},
    slotButton: { type: "sprite-button", show_percent_for_small_numbers: true, actions: { on_click: { gui: gui_name, action: "view_entity"} }}
}

namespace RecipeUI {
    function roundToDecimal(num: number, dec: number): number {
        let shift = 10 ** dec
        return Math.round(num * shift) / shift
    }

    function roundAmount(num: number): number {
        return Math.round(num * 100) / 100
    }

    function getStyle(recipe: AnyRecipe, itemOrFluid: ProdOrIngr,
                      highlightId: undefined | string, colorPallet: ColorPallet): string {
        const prefix = "flib_standalone_slot_button_"
        if (highlightId == itemOrFluid.name)
            return prefix + colorPallet.highlight
        // @ts-ignore
        if (colorPallet.main_product != undefined && recipe?.main_product?.name == itemOrFluid.name)
            return prefix + colorPallet.main_product
        // TODO Debug highlighting
        /*if ($is_debug_enabled!() && colorPallet.debug_highlight != undefined && itemOrFluid.amount == 0)
            return colorPallet.debug_highlight*/
        return prefix + colorPallet.default
    }

    function getTooltip(itemOrFluid: ProdOrIngr, force?: LuaForce): LuaMultiReturn<[LocalisedString,string]> {
        let sprite = itemOrFluid.sprite != undefined ? itemOrFluid.sprite : `${itemOrFluid.type}.${itemOrFluid.name}`
        let tooltip: [string, ...LocalisedString[]] = ["", `[img=${sprite}] `]
        let localised_name = itemOrFluid.localised_name

        if (localised_name == undefined) {
            let proto = (itemOrFluid.type == "item" ? game.item_prototypes : game.fluid_prototypes)[itemOrFluid.name]
            localised_name = proto?.localised_name != undefined ? proto.localised_name : itemOrFluid.name
        }
        tooltip.push(localised_name)

        let roundedAmountStr
        if ( itemOrFluid.amount == undefined ) {
            // itemOrFluid has to be a Product and therefore amount_min and amount_max are always defined at this point
            let prob = itemOrFluid.probability != undefined ? itemOrFluid.probability : 1
            // @ts-ignore
            let avgAmount = prob*((itemOrFluid.amount_max - itemOrFluid.amount_min)*0.5 + itemOrFluid.amount_min)
            tooltip.push(["factorio-codex.tooltip-amount_avg", avgAmount], ["factorio-codex.tooltip-amount_detailed"],
                ["factorio-codex.tooltip-amount_min", itemOrFluid.amount_min],
                ["factorio-codex.tooltip-amount_max", itemOrFluid.amount_max])

            if (itemOrFluid.probability != undefined && itemOrFluid.probability != 1) {
                tooltip.push(["factorio-codex.tooltip-amount_probability", itemOrFluid.probability])
            }

            // @ts-ignore
            roundedAmountStr = `${roundAmount(itemOrFluid.amount_min)}-${roundAmount(itemOrFluid.amount_max)}`
        } else {
            if (itemOrFluid.probability != undefined && itemOrFluid.probability != 1) {
                let prob = itemOrFluid.probability != undefined ? itemOrFluid.probability : 1
                let avgAmount = prob*itemOrFluid.amount
                tooltip.push(["factorio-codex.tooltip-amount_avg", avgAmount],
                    ["factorio-codex.tooltip-amount", itemOrFluid.amount],
                    ["factorio-codex.tooltip-amount_probability", itemOrFluid.probability])
            } else {
                tooltip.push(["factorio-codex.tooltip-amount", itemOrFluid.amount])
            }

            roundedAmountStr = "" + roundAmount(itemOrFluid.amount)
        }

        if (itemOrFluid.type == "fluid") {
            let temps = []
            let temp = itemOrFluid.minimum_temperature
            if (temp != undefined)  temps.push( temp >= infinityTemp ? "∞":  temp)
            temp = itemOrFluid.maximum_temperature
            if (temp != undefined)  temps.push( temp >= infinityTemp ? "∞":  temp)
            temp = itemOrFluid.temperature
            if (temp != undefined)  temps.push( temp >= infinityTemp ? "∞":  temp)

            if (temps.length == 1) {
                tooltip.push(["factorio-codex.tooltip_temperature", temps[0]])
            } else if (temps.length == 2) {
                tooltip.push(["factorio-codex.tooltip_temperature_min", temps[0]], ["factorio-codex.tooltip_temperature_max", temps[1]])
            }
        }

        let prodRecipes = getMainProductionWays(itemOrFluid, force)
        if (prodRecipes != undefined) {
            tooltip.push(["factorio-codex.tooltip_main_production_ways", `[img=${itemOrFluid.type}/${itemOrFluid.name}]`, localised_name, prodRecipes])
        }

        return $multi(tooltip, roundedAmountStr)
    }

    function getMainProductionWays(itemOrFluid: ProdOrIngr, force?: LuaForce) : LocalisedString | undefined {
        let recipeCache = getRecipeCache()
        if (recipeCache == undefined) {
            return undefined
        }

        let mainRecipes = recipeCache.getMainProductionWays(itemOrFluid, force)
        let localisedString: [string, ...string[]] = [""]

        let recipeString: string[]

        let maxRecipes = 2
        for (let recipe of mainRecipes) {
            recipeString = ["\n"]
            for (let ingr of recipe.ingredients) {
                recipeString.push(`${roundAmount(ingr.amount)}`, " [img=", ingr.type, "/", ingr.name, "] ")
            }

            let spriteString : string = UIStructures.ingredient_product_separator.sprite as string
            recipeString.push("[img=", spriteString, "] ")

            for (let prod of recipe.products) {
                let amount = prod.amount
                if (amount == undefined) {
                    // @ts-ignore
                    amount = (prod.amount_max - prod.amount_min)*0.5 + prod.amount_min
                }
                amount *= prod.probability != undefined ? prod.probability : 1

                recipeString.push(`${roundAmount(amount)}`, " [img=", prod.type, "/", prod.name, "] ")
            }

            localisedString.push(recipeString.join(""))
            maxRecipes -= 1
            if (maxRecipes <= 0) break
        }
        return localisedString
    }

    function getSlot(itemOrFluid: ProdOrIngr, style: string, is_clickable?: boolean, force?: LuaForce): FLIBGuiBuildStructure {
        let [tooltip, roundedAmountStr] = getTooltip(itemOrFluid, force)

        let sprite = itemOrFluid.sprite != undefined ? itemOrFluid.sprite : (itemOrFluid.type + "/" + itemOrFluid.name)
        is_clickable = (is_clickable != undefined ? is_clickable : true) &&
                       (itemOrFluid.type == "item" || itemOrFluid.type == "fluid")

        return {
            ...UIStructures.slotButton,
            style: style,
            tooltip: tooltip,
            sprite: sprite ,
            number: itemOrFluid.probability != 1 ? itemOrFluid.probability : undefined,
            enabled: is_clickable,
            children: [
                {type: "label", style: "fcodex_recipe_label_top", ignored_by_interaction: true, caption: roundedAmountStr},
            ]
        }
    }

    function getAdditionalRecipeInfo(recipe: AnyRecipe): FLIBGuiBuildStructure[] {
        let additionalInfoUi: FLIBGuiBuildStructure[] = []

        // TODO modules
        if (recipe.category != undefined) {
            let machines = getRecipeCache()?.get_crafting_machines(recipe.category)

            let machines_ui:FLIBGuiBuildStructure[] = [
                {type: "label", caption: ["factorio-codex.produced-in"]}
            ]
            if (machines != undefined) {
                for (let m of machines) {
                    machines_ui.push({
                        type: "sprite", sprite: "entity." + m.name,
                        style: "fcodex_produced_in_sprite",
                        tooltip: ["", `[entity=${m.name}]`, m.localised_name,
                            ["factorio-codex.machine-crafting-speed", m.crafting_speed != undefined ? m.crafting_speed : m.mining_speed]]
                    })
                }
            }

            additionalInfoUi.push({
                type: "flow", direction: "horizontal",
                children: machines_ui
            })
        }

        additionalInfoUi.push({
            type: "label",
            caption: ["factorio-codex.production-time",
                        roundToDecimal(recipe.energy, 4),
                        math.floor(recipe.energy)
            ]})
        return additionalInfoUi
    }
    export function getUI(recipe: AnyRecipe, locked: boolean,
                          highlightId?: string, force?: LuaForce, colorPallet?: ColorPallet): FLIBGuiBuildStructure {
        if ( colorPallet == undefined ) colorPallet = !locked ? ColorPallets.default : ColorPallets.locked

        const recipeUi: FLIBGuiBuildStructure = {
            ...UIStructures.recipe_visualization,
            children: []
        }


        for ( let ingredient of recipe.ingredients ) {
            if (ingredient.amount == 0 && recipe.ingredients.length != 1 && highlightId != ingredient.name) continue

            let style = getStyle(recipe, ingredient, highlightId, colorPallet)
            // @ts-ignore
            recipeUi.children.push(getSlot(ingredient, style, highlightId != ingredient.name, force))
        }

        // @ts-ignore
        recipeUi.children.push(UIStructures.ingredient_product_separator)

        for ( let product of recipe.products ) {
            if (product.amount == 0 && recipe.products.length != 1 && highlightId != product.name) continue

            let style = getStyle(recipe, product, highlightId, colorPallet)
            // @ts-ignore
            recipeUi.children.push(getSlot(product, style, highlightId != product.name, force))
        }

        let completeUi = {
            ...UIStructures.base_recipe_ui,
            children: [recipeUi]
        }

        completeUi.children = completeUi.children.concat(getAdditionalRecipeInfo(recipe))

        return completeUi
    }
}

export default RecipeUI