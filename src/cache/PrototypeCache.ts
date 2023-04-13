// @ts-ignore
import CacheManager, {getGlobalCache, registerCache, CacheFactory, GlobalCache} from "Cache";

/** @noResolution */
import * as FLIB_table from "__flib__.table"

let PrototypeCacheFactory: CacheFactory = {
    cache_id: "prototype_cache",
    cache_name: "Prototype Cache",
    global_cache: true,

    Create(): GlobalCache {
        return new PrototypeCache();
    },

    Load(cache: GlobalCache): void {
        // @ts-ignore
        setmetatable(cache, PrototypeCache.prototype)
    }
}

registerCache(PrototypeCacheFactory)

function getPrototypeCache(): undefined | PrototypeCache {
    return getGlobalCache(PrototypeCacheFactory.cache_id) as PrototypeCache
}

type ProtoStorage = {
    fluid: LuaTable<string, LuaFluidPrototype>;
    item: LuaTable<string, LuaItemPrototype>;
    technology: LuaTable<string, LuaTechnologyPrototype>;
    tile: LuaTable<string, LuaTilePrototype>;
}

export type Category_type = {
    name: string,
    localised_name: LocalisedString
    parent?: Category_type
}

type Categories_storage = {
    tree: Category_type[],
    list: Category_type[],
}

class PrototypeCache implements GlobalCache {
    readonly id: string = PrototypeCacheFactory.cache_id;
    readonly name: string = PrototypeCacheFactory.cache_name;
    readonly is_global: true = true;

    luaPrototypes: ProtoStorage;

    categories: Categories_storage

    constructor() {
        this.luaPrototypes = {
            fluid: new LuaTable(),
            item: new LuaTable(),
            technology: new LuaTable(),
            tile: new LuaTable()
        }
        this.categories = {
            tree: [],
            list: []
        }

        this.Rebuild()
    }

    Rebuild() {
        this.luaPrototypes.fluid = FLIB_table.shallow_copy(game.fluid_prototypes) as LuaTable<string, LuaFluidPrototype>
        this.luaPrototypes.item = FLIB_table.shallow_copy(game.item_prototypes) as LuaTable<string, LuaItemPrototype>
        this.luaPrototypes.technology = FLIB_table.shallow_copy(game.technology_prototypes) as LuaTable<string, LuaTechnologyPrototype>
        this.luaPrototypes.tile = FLIB_table.shallow_copy(game.tile_prototypes) as LuaTable<string, LuaTilePrototype>

        let cat_tree: Category_type[] = [
            {name: "item", localised_name: ["", "Items"]},
            {name: "fluid", localised_name: ["", "Fluids"]},
            {name: "technology", localised_name: ["", "Technologies"]},
            {name: "tile", localised_name: ["", "Tiles"]}
        ]

        let cat_list: Category_type[] = []
        for (let cat of cat_tree) {
            cat_list.push(cat)
            // TODO subcategories
        }

        this.categories = {
            tree: cat_tree,
            list: cat_list
        }
    }

    getAll(): ProtoStorage {
        return this.luaPrototypes
    }

    getItems(): LuaTable<string, LuaItemPrototype> {
        return this.luaPrototypes.item
    }

    getFluid(): LuaTable<string, LuaFluidPrototype> {
        return this.luaPrototypes.fluid
    }

    getTech(): LuaTable<string, LuaTechnologyPrototype> {
        return this.luaPrototypes.technology
    }

    getCategories(): Category_type[] {
        return this.categories.list
    }

    validate(): void {

    }
}

export default PrototypeCache
export {getPrototypeCache}