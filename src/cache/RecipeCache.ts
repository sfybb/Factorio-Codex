// @ts-ignore
import {CacheFactory, getGlobalCache, GlobalCache, registerCache} from "Cache";
import {getPrototypeCache} from "./PrototypeCache";

let RecipeCacheFactory: CacheFactory = {
    cache_id: "recipe_cache",
    cache_name: "Recipe Cache",
    global_cache: true,

    Create(player_index: PlayerIndex): GlobalCache {
        return new RecipeCache();
    },

    Load(cache: GlobalCache): void {
        // @ts-ignore
        setmetatable(cache, RecipeCache.prototype)
    }
}

registerCache(RecipeCacheFactory)

function getRecipeCache(): undefined | RecipeCache {
    return getGlobalCache(RecipeCacheFactory.cache_id) as RecipeCache
}

export type CustomIngredient = {
    type: "item" | "fluid" | "resource",
    name: string,
    amount: double,
    catalyst_amount?: uint | double,

    sprite?: SpritePath,
    localised_name?: LocalisedString
}

type VirtualRecipe = {
    localised_name: LocalisedString,
    main_product?: string

    category: string
    energy: double

    ingredients: (Ingredient | CustomIngredient)[]
    products: Product[],
    hasMiningProductivity: boolean,
    object_name: "VirtualRecipe"
}

export type AnyRecipe = VirtualRecipe | LuaRecipePrototype | LuaRecipe

export type ItemOfFluidId = { name: string, type: "item" | "fluid" | "resource" }

type RecipeStorage<T> = {
    type: "item" | "fluid" | "resource"
    products: LuaTable<string, T[]>
    ingredients: LuaTable<string, T[]>

    list: T[]
}

class RecipeCache implements GlobalCache {
    readonly id: string = RecipeCacheFactory.cache_id;
    readonly name: string = RecipeCacheFactory.cache_name;
    readonly is_global: true = true;

    additionalRecipes : {
        fluid: RecipeStorage<AnyRecipe>,
        item: RecipeStorage<AnyRecipe>,
        resource: RecipeStorage<VirtualRecipe>
    }

    category_machines: {
        // Has basis in in-game categories
        resources: LuaTable<string, LuaEntityPrototype[]>,
        crafting: LuaTable<string, LuaEntityPrototype[]>,

        // Own virtual categories
        pumping: LuaTable<string, LuaEntityPrototype[]>, // id: 'offshore-pump/${pump.fluid.name}'
        rockets: LuaTable<string, LuaEntityPrototype[]>  // id: 'rocket/${silo.name}'
    }

    mainProductionWays: {
        fluid: LuaTable<string, AnyRecipe[]>,
        item: LuaTable<string, AnyRecipe[]>,
    }

    constructor() {
        this.additionalRecipes = {
            fluid:    {type: "fluid",    products: new LuaTable(), ingredients: new LuaTable(), list: []},
            item:     {type: "item",     products: new LuaTable(), ingredients: new LuaTable(), list: []},
            resource: {type: "resource", products: new LuaTable(), ingredients: new LuaTable(), list: []}
        }
        this.category_machines = {
            resources: new LuaTable(),
            crafting: new LuaTable(),
            pumping: new LuaTable(),
            rockets: new LuaTable(),
        }
        this.mainProductionWays = {
            fluid: new LuaTable(),
            item: new LuaTable(),
        }
        this.Rebuild()
    }

    Rebuild() {
        this.additionalRecipes = {
            fluid:    {type: "fluid",    products: new LuaTable(), ingredients: new LuaTable(), list: []},
            item:     {type: "item",     products: new LuaTable(), ingredients: new LuaTable(), list: []},
            resource: {type: "resource", products: new LuaTable(), ingredients: new LuaTable(), list: []}
        }
        this.category_machines = {
            resources: new LuaTable(),
            crafting: new LuaTable(),
            pumping: new LuaTable(),
            rockets: new LuaTable(),
        }
        this.mainProductionWays = {
            fluid: new LuaTable(),
            item: new LuaTable(),
        }

        this.initCategories()

        this.addRocketLaunchRecipes()
        this.addOffshorePumpRecipes()
        this.addResourceMinerRecipes()
    }

    initCategories() {
        // Add crafting categories
        for (let [, cat] of game.recipe_category_prototypes) {
            let machines = game.get_filtered_entity_prototypes([
                {filter: "crafting-category", crafting_category: cat.name},
            ])
            let machines_list:LuaEntityPrototype[] = []
            for (let [, m] of machines) {
                machines_list.push(m)
            }
            this.category_machines.crafting.set(cat.name, machines_list)
        }

        // Add resource mining categories
        for (let [, cat] of game.resource_category_prototypes) {
            this.category_machines.resources.set(cat.name, [])
        }

        let drills =  game.get_filtered_entity_prototypes([{filter: "type", type: "mining-drill"}])
        for (let [, drill] of drills) {
            if (drill.resource_categories != undefined) {
                for (let [cat, _] of Object.entries(drill.resource_categories)) {
                    this.category_machines.resources.get(cat).push(drill)
                }
            }
        }

        // Add virtual offshore pumping categories
        let offshore_pumps = game.get_filtered_entity_prototypes([{filter: "type", type: "offshore-pump", mode: "and"}])
        for (let [, pump] of offshore_pumps) {
            let cat = this.category_machines.pumping.get(`offshore-pump/${pump.fluid?.name}`)
            if (cat == undefined) {
                cat = []
                this.category_machines.pumping.set(`offshore-pump/${pump.fluid?.name}`, cat)
            }
            cat.push(pump)
        }

        // Add virtual rocket launch categories
        let rocketSilos = game.get_filtered_entity_prototypes([{filter: "type", type: "rocket-silo"}])
        for (let [, silo] of rocketSilos) {
            this.category_machines.rockets.set(`rocket/${silo.name}`, [silo])
        }
    }

    addRecipeToStorage<T extends AnyRecipe | VirtualRecipe>(storage: RecipeStorage<T>, recipe: T): void {
        storage.list.push(recipe)

        let tmp: T[]
        if (recipe.ingredients.length > 0) {
            for (let ingr of recipe.ingredients) {
                tmp = storage.ingredients.get(ingr.name)
                if (tmp == undefined) {
                    tmp = []
                    storage.ingredients.set(ingr.name, tmp)
                }
                tmp.push(recipe)
            }
        }

        if (recipe.products.length > 0) {
            for (let prod of recipe.products) {
                tmp = storage.products.get(prod.name)
                if (tmp == undefined) {
                    tmp = []
                    storage.products.set(prod.name, tmp)
                }
                tmp.push(recipe)
            }
        }
    }


    addRocketLaunchRecipes() {
        let rocketSilos = game.get_filtered_entity_prototypes([{filter: "type", type: "rocket-silo"}])
        let rocketLaunchProducts = game.get_filtered_item_prototypes([{filter: "has-rocket-launch-products"}])

        let tmpRocketSilos = []
        for (let [_, s] of rocketSilos) tmpRocketSilos.push(s.name)

        let tmpRocketLaunchProducts = []
        for (let [_, s] of rocketLaunchProducts) tmpRocketLaunchProducts.push(s.name)

        if (tmpRocketSilos.length == 0) return

        $log_info!(`Found ${rocketSilos.length()} rocket silo(s)! (${serpent.line(tmpRocketSilos, {nocode: true, comment: false})})`)
        $log_info!(`Found ${rocketLaunchProducts.length()} items produced by rocket launches!`)

        let rocketPart = game.item_prototypes["rocket-part"]

        let possibleLaunchSilos: {
            silo: RocketSiloEntityPrototype,
            category: string,
            recipe: LuaRecipePrototype
        }[] = []

        for (let [_, silo] of rocketSilos) {
            $log_info!(`Rocket Silo ${silo.name}: Rocket parts: ${silo.rocket_parts_required} Fixed Recipe: ${silo.fixed_recipe}`)
            if (silo.fixed_recipe != undefined) {
                let siloRecipe = game.recipe_prototypes[silo.fixed_recipe]
                possibleLaunchSilos.push({
                    silo: silo,
                    category: `rocket/${silo.name}`,
                    recipe: siloRecipe
                })

                let ingr = siloRecipe.ingredients.map((i) => `${i.amount} x ${i.name}`)
                let pr = siloRecipe.products.map((p) => `${p.amount} x ${p.name}`)

                $log_info!(`    Recipe: Ingredients ${ingr.join(", ")};  Products: ${pr.join(", ")}`)
            }
        }

        $log_info!(`Items: ${serpent.line(tmpRocketLaunchProducts, {nocode: true, comment: false})}`)

        for (let [_, rlp] of rocketLaunchProducts) {
            let ingr: CustomIngredient = {
                type: 'item',
                name: rlp.name,
                amount: 1
            }

            for (let siloData of possibleLaunchSilos) {
                let new_recipe: VirtualRecipe
                let amount = siloData.silo.rocket_parts_required ?? 1
                if (amount == 1) {
                    new_recipe = {
                        localised_name: ["factorio-codex.rocket-launch-recipes"],
                        category: siloData.category,
                        energy: siloData.silo.launch_wait_time != undefined ? siloData.silo.launch_wait_time : 1,
                        ingredients: [...siloData.recipe.ingredients, ingr],
                        products: [...siloData.recipe.products, ...rlp.rocket_launch_products],
                        hasMiningProductivity: false,
                        object_name: "VirtualRecipe"
                    }
                } else {
                    let rocket_parts: Ingredient[] = siloData.recipe.products.map((p) => ({
                        type: 'item',
                        name: p.name,
                        amount: amount,
                    }))

                    new_recipe = {
                        localised_name: ["factorio-codex.rocket-launch-recipes"],
                        category: siloData.category,
                        energy: siloData.silo.launch_wait_time ?? 1,
                        ingredients: [...rocket_parts, ingr],
                        products: [...rlp.rocket_launch_products],
                        hasMiningProductivity: false,
                        object_name: "VirtualRecipe"
                    }
                }

                this.addRecipeToStorage(this.additionalRecipes.item, new_recipe)
            }
        }
    }

    addOffshorePumpRecipes() {
        let offshore_pumps = game.get_filtered_entity_prototypes([
            {filter: "type", type: "offshore-pump", mode: "and"},
        ])

        // TODO implement merging of same recipes with different pumps

        for (let [, pump] of offshore_pumps) {
            let fluid = pump.fluid
            if (fluid != undefined) {
                let recipe: VirtualRecipe = {
                    localised_name: ["factorio-codex.offshore-pumping-recipes"],
                    category: `offshore-pump/${fluid.name}`,
                    energy: 1,
                    ingredients: [],
                    products: [{
                        type: "fluid",
                        name: fluid.name,
                        // @ts-ignore never undefined
                        amount: Math.round(pump.pumping_speed*60)
                    }],
                    hasMiningProductivity: false,
                    object_name: "VirtualRecipe"
                }
                this.addRecipeToStorage(this.additionalRecipes.resource, recipe)
            }
        }
    }

    addResourceMinerRecipes() {
        let resource_list = game.get_filtered_entity_prototypes([{filter: "type", type: "resource"}])

        for (let [, res] of resource_list) {
            let props = res.mineable_properties
            if (props.minable) {
                let recipe: VirtualRecipe = {
                    localised_name: ["factorio-codex.mining-recipes"],
                    // @ts-ignore never undefined for type "resource"
                    category: res.resource_category,
                    energy: props.mining_time,
                    // @ts-ignore never undefined for type "resource"
                    products: props.products,
                    ingredients: [{
                        type: "resource",
                        name: res.name,
                        amount: 1,
                        sprite: "entity/" + res.name,
                        localised_name: res.localised_name
                    }],
                    hasMiningProductivity: true
                }

                if (props.required_fluid != undefined) {
                    recipe.ingredients.push({
                        type: "fluid",
                        name: props.required_fluid,
                        //  @ts-ignore never undefined if required_fluid is defined
                        amount: props.fluid_amount
                    })
                }
                this.addRecipeToStorage(this.additionalRecipes.resource, recipe)
            }
        }
    }

    get_crafting_machines(category: string): LuaEntityPrototype[] {
        let tmp
        for (let cat_entry of Object.values(this.category_machines)) {
            tmp = cat_entry.get(category)
            if (tmp != undefined) return tmp
        }
        return []
    }

    getRocketLaunchRecipes(itemOrFluid: LuaItemPrototype | LuaFluidPrototype, requiredPosition?: "ingredient" | "product"): AnyRecipe[] {
        let res: AnyRecipe[]
        let addIngr = requiredPosition == undefined || requiredPosition == "ingredient"
        let addProds = requiredPosition == undefined || requiredPosition == "product"

        if (itemOrFluid.object_name == "LuaItemPrototype") {
            let ingr: AnyRecipe[] = []
            let prod: AnyRecipe[] = []
            if (addIngr) ingr = this.additionalRecipes.item.ingredients.get(itemOrFluid.name)
            if (addProds) prod = this.additionalRecipes.item.products.get(itemOrFluid.name)
            ingr = ingr ?? []
            prod = prod ?? []
            res = [
                ...ingr,
                ...prod,
            ]
        } else {
            let ingr: AnyRecipe[] = []
            let prod: AnyRecipe[] = []
            if (addIngr) ingr = this.additionalRecipes.fluid.ingredients.get(itemOrFluid.name)
            if (addProds) prod = this.additionalRecipes.fluid.products.get(itemOrFluid.name)
            prod = prod ?? []
            ingr = ingr ?? []
            res = [
                ...ingr,
                ...prod,
            ]
        }

        return res
    }

    getMinerRecipesFor(itemOrFluid: LuaItemPrototype | LuaFluidPrototype, force: LuaForce): AnyRecipe[] {
        let res: VirtualRecipe[] | undefined
        if (itemOrFluid.object_name == "LuaFluidPrototype") {
            res = this.additionalRecipes.resource.products.get(itemOrFluid.name)
        } else {
            res = this.additionalRecipes.resource.products.get(itemOrFluid.name)
        }

        if (res != undefined) {
            // Add mining productivity
            let productivity_bonus = force.mining_drill_productivity_bonus + 1

            let tmp = res
            res = []
            for (let recipe of tmp) {
                let copy: VirtualRecipe
                if (recipe.hasMiningProductivity) {
                    copy = {
                        localised_name: recipe.localised_name,
                        main_product: recipe.main_product,

                        category: recipe.category,
                        energy: recipe.energy,

                        ingredients: recipe.ingredients,
                        products: [],
                        hasMiningProductivity: recipe.hasMiningProductivity,
                        object_name: "VirtualRecipe"
                    }

                    // @ts-ignore
                    copy.products = recipe.products.map((p) => {
                        if (p.amount != undefined) return {...p, amount: p.amount * productivity_bonus}
                        return { ...p,
                            // @ts-ignore
                            amount_min: p.amount_min * productivity_bonus,
                            // @ts-ignore
                            amount_max: p.amount_max * productivity_bonus
                        }
                    })
                } else {
                    copy = recipe
                }

                res.push(copy)
            }
        } else {
            res = []
        }

        return res
    }

    getMainProductionWays(itemOrFluid: ItemOfFluidId, force?: LuaForce): LuaMultiReturn<[AnyRecipe[], boolean]> {
        let force_recipes: Record<string, LuaRecipe> | undefined = force?.recipes
        let type = itemOrFluid.type
        let expectedId = itemOrFluid.name

        if (type == "resource") return $multi([], false)

        let cachedRecipes = this.mainProductionWays[type].get(expectedId)
        if (cachedRecipes == undefined) {
            cachedRecipes = []

            // Prefer to show mining recipes
            let prototypeCache = getPrototypeCache()
            if (prototypeCache != undefined) {
                let prototype = type == "fluid" ? prototypeCache.getFluid().get(expectedId) : prototypeCache.getItems().get(expectedId)

                if (prototype != undefined && prototype.valid) {
                    if (force != undefined) {
                        cachedRecipes = this.getMinerRecipesFor(prototype, force)
                    }
                    cachedRecipes.push(...this.getRocketLaunchRecipes(prototype, "product"))
                }
            }

            // Find other ways to produce said item without mining or shooting something into space
            const filter: RecipePrototypeFilterWrite[] = [{
                filter: type == "item" ? "has-product-item" : "has-product-fluid",
                elem_filters: [{filter: "name", name: expectedId}]
            }]

            let filteredProtos = game.get_filtered_recipe_prototypes(filter)

            let hasItemAsMainProd = false
            for (let [_, recipe] of filteredProtos) {
                let main_prod = recipe.main_product
                if (main_prod != undefined && main_prod.name == expectedId && main_prod.type == type) {
                    hasItemAsMainProd = true
                    break
                }
            }

            for (let [_, recipe] of filteredProtos) {
                let main_prod = recipe.main_product

                // include this recipe if it has the item / fluid we are searching for as main product
                let shouldInclude = main_prod != undefined && main_prod.name == expectedId && main_prod.type == type
                // or if this is not a main product for any recipe we found and this recipe has no main product
                shouldInclude ||= main_prod == undefined

                if (shouldInclude) {
                    cachedRecipes.push(recipe)
                }
            }

            // Limit the results to 50 (mining or rocket launch recipes are at the front)
            const maxRecipesToCache = 50
            if (cachedRecipes.length > maxRecipesToCache) {
                cachedRecipes = cachedRecipes.slice(0, maxRecipesToCache)
            }

            this.mainProductionWays[type].set(expectedId, cachedRecipes)
        }

        let hasRecipes = cachedRecipes.length > 0
        if (force_recipes != undefined) {
            // only includes enabled recipes and virtual recipes
            return $multi(cachedRecipes.filter(
                (val: AnyRecipe) =>
                    val.object_name == "VirtualRecipe" ||
                        // @ts-ignore
                        (val.name != undefined && force_recipes[val.name]?.enabled)
            ), hasRecipes)
        }
        return $multi(cachedRecipes, hasRecipes)
    }

    validate(): void {

    }
}

export default RecipeCache
export {getRecipeCache}