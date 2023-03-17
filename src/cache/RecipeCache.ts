// @ts-ignore
import {CacheFactory, getGlobalCache, GlobalCache, registerCache} from "Cache";

let RecipeCacheFactory: CacheFactory = {
    cache_id: "recipe_cache",
    cache_name: "Recipe Cache",
    global_cache: true,

    Create(player_index: PlayerIndex): GlobalCache {
        return new RecipeCache();
    },

    Load(cache: GlobalCache): void {
        // @ts-ignore
        setmetatable(c, RecipeCache.prototype)
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
    main_product?: string

    category: string
    energy: double

    ingredients: (Ingredient | CustomIngredient)[]
    products: Product[]
}

export type AnyRecipe = VirtualRecipe | LuaRecipePrototype | LuaRecipe

type RecipeStorage = {
    type: "item" | "fluid" | "resource"
    products: LuaTable<string, AnyRecipe[]>
    ingredients: LuaTable<string, AnyRecipe[]>

    list: AnyRecipe[]
}

class RecipeCache implements GlobalCache {
    readonly id: string = RecipeCacheFactory.cache_id;
    readonly name: string = RecipeCacheFactory.cache_name;
    readonly is_global: true = true;

    additionalRecipes : {
        fluid: RecipeStorage,
        item: RecipeStorage,
        resource: RecipeStorage
    }

    category_machines: {
        // Has basis in in-game categories
        resources: LuaTable<string, LuaEntityPrototype[]>,
        crafting: LuaTable<string, LuaEntityPrototype[]>,

        // Own virtual categories
        pumping: LuaTable<string, LuaEntityPrototype[]>, // id: 'offshore-pump/${pump.fluid.name}'
        rockets: LuaTable<string, LuaEntityPrototype[]>  // id: 'rocket/${silo.name}'
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

    addRecipeToStorage(main_storage: RecipeStorage, recipe: AnyRecipe): void {
        main_storage.list.push(recipe)

        let tmp: AnyRecipe[]
        let storage: RecipeStorage
        if (recipe.ingredients.length > 0) {
            for (let ingr of recipe.ingredients) {
                storage = this.additionalRecipes[ingr.type]
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
                storage = this.additionalRecipes[prod.type]
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

        $log_info!(`Found ${rocketSilos.length()} rocket silo(s)! (${serpent.line(tmpRocketSilos, {nocode: true, comment: false})})`)
        $log_info!(`Found ${rocketLaunchProducts.length()} items produced by rocket launches!`)

        let rocketPart = game.item_prototypes["rocket-part"]

        for (let [_, silo] of rocketSilos) {
            $log_info!(`Rocket Silo ${silo.name}: Rocket parts: ${silo.rocket_parts_required} Fixed Recipe: ${silo.fixed_recipe}`)
            if (silo.fixed_recipe != undefined) {
                let siloRecipe = game.recipe_prototypes[silo.fixed_recipe]
                let ingr = siloRecipe.ingredients.map((i) => `${i.amount} x ${i.name}`)
                let pr = siloRecipe.products.map((p) => `${p.amount} x ${p.name}`)

                $log_info!(`    Recipe: Ingredients ${ingr.join(", ")};  Products: ${pr.join(", ")}`)
            }
        }

        $log_info!(`Items: ${serpent.line(tmpRocketLaunchProducts, {nocode: true, comment: false})}`)
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
                    category: `offshore-pump/${fluid.name}`,
                    energy: 1,
                    ingredients: [],
                    products: [{
                        type: "fluid",
                        name: fluid.name,
                        // @ts-ignore never undefined
                        amount: Math.round(pump.pumping_speed*60)
                    }]
                }
                this.addRecipeToStorage(this.additionalRecipes.fluid, recipe)
            }
        }
    }

    addResourceMinerRecipes() {
        let resource_list = game.get_filtered_entity_prototypes([{filter: "type", type: "resource"}])

        for (let [, res] of resource_list) {
            let props = res.mineable_properties
            if (props.minable) {
                let recipe: VirtualRecipe = {
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
                    }]
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

    getMinerRecipesFor(itemOrFluid: LuaItemPrototype | LuaFluidPrototype, force: LuaForce): AnyRecipe[] {
        let res: AnyRecipe[] | undefined
        if (itemOrFluid.object_name == "LuaFluidPrototype") {
            res = this.additionalRecipes.fluid.products.get(itemOrFluid.name)
        } else {
            let tmp = this.additionalRecipes.item.products.get(itemOrFluid.name)
            // Add mining productivity
            if (tmp != undefined) {
                let productivity_bonus = force.mining_drill_productivity_bonus + 1
                res = []
                for (let recipe of tmp) {
                    let copy: AnyRecipe = {...recipe}

                    // @ts-ignore
                    copy.products = recipe.products.map((p) => {
                        if (p.amount != undefined) return {...p, amount: p.amount * productivity_bonus}
                        // @ts-ignore
                        return {...p, amount_min: p.amount_min * productivity_bonus,
                        // @ts-ignore
                                      amount_max: p.amount_max * productivity_bonus}
                    })

                    res.push(copy)
                }
            }
        }

        if (res == undefined) {
            res = []
        }

        return res
    }

    validate(): void {

    }
}

export default RecipeCache
export {getRecipeCache}