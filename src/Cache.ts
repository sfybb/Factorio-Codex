
declare const global: {
    cache: CacheManager
}

export interface CacheFactory {
    readonly cache_id: string
    readonly cache_name: string
    readonly global_cache: boolean

    Create(player_index?: PlayerIndex): Cache;
    Load(this: void, cache: Cache): void;
}

export interface Cache {
    readonly id: string
    readonly name: string
    readonly is_global: boolean

    validate(ownerIndex?: PlayerIndex): void
}

export interface GlobalCache extends Cache {
    is_global: true

    validate(): void
}

export interface PlayerCache extends Cache {
    is_global: false
    readonly owner: PlayerIndex

    validate(ownerIndex: PlayerIndex): void
}

let globalFactories: LuaTable<string, CacheFactory> = new LuaTable();

let playerFactories: LuaTable<string, CacheFactory> = new LuaTable();

function registerCache(this: void, cf: CacheFactory): void {
    $log_info!(`Registering cache ${cf.cache_id} ('${cf.cache_name}')`)
    if ( cf.global_cache ) {
        if ( !globalFactories.has(cf.cache_id) ) {
            globalFactories.set(cf.cache_id, cf)
        } else {
            $log_err!(`Global cache with id '${cf.cache_id}' has already been defined!` +
                `'${cf.cache_name}' tried to overwrite '${globalFactories.get(cf.cache_id).cache_name}'!`)
        }
        } else {
        if ( !playerFactories.has(cf.cache_id) ) {
            playerFactories.set(cf.cache_id, cf)
        } else {
            $log_err!(`Player cache with id '${cf.cache_id}' has already been defined!` +
                `'${cf.cache_name}' tried to overwrite '${playerFactories.get(cf.cache_id).cache_name}'!`)
        }
    }

    $log_info!(`${serpent.line(globalFactories)}`)
    $log_info!(`${serpent.line(playerFactories)}`)
}

class CacheManager {


    playerCaches: LuaTable<PlayerIndex, LuaTable<string, PlayerCache>>;
    globalCaches: LuaTable<string, GlobalCache>;
    constructor() {
        this.globalCaches = new LuaTable();
        this.playerCaches = new LuaTable();

        $log_info!(`Initializing global caches...`)
        for (let [id, gCacheFactory] of globalFactories ) {
            this.globalCaches.set(id, <GlobalCache>gCacheFactory.Create())
            $log_info!(`    ${gCacheFactory.cache_name}      Done`)
        }
    }

    static load(this: void, c: CacheManager) {
        // @ts-ignore
        setmetatable(c, CacheManager.prototype)
    }
    get(cache_id: string): undefined | GlobalCache {
        let cache = this.globalCaches.get(cache_id)
        if (cache == undefined) {
            $log_crit!(`Global Cache with id '${cache_id}' does not exist!`)
        }

        return cache
    }

    get_player(cache_id: string, player: PlayerIndex): undefined | PlayerCache {
        let playerCacheList = this.playerCaches.get(player)

        if (playerCacheList == undefined) {
            playerCacheList = this.InitPlayer(player)
        }
        let cache = playerCacheList.get(cache_id)

        if (cache == undefined) {
            $log_crit!(`Player Cache with id '${cache_id}' does not exist for player ${player}`+
            `('${game.get_player(player)?.name}')!`)
        }

        return cache
    }

    InitPlayer(player: PlayerIndex): LuaTable<string, PlayerCache> {
        let playerCacheList = new LuaTable<string, PlayerCache>();

        $log_info!(`Initializing caches for player ${player}('${game.get_player(player)?.name}')...`)
        for (let [id, pCacheFactory] of playerFactories ) {
            playerCacheList.set(id, <PlayerCache>pCacheFactory.Create(player))
            $log_info!(`    ${pCacheFactory.cache_name}      Done`)
        }

        this.playerCaches.set(player, playerCacheList)
        return playerCacheList
    }
}

function getGlobalCache(cache_id: string): undefined | GlobalCache {
    return global?.cache?.get(cache_id)
}

function getPlayerCache(cache_id: string, player: PlayerIndex): undefined | PlayerCache {
    return global?.cache?.get_player(cache_id, player)
}

export default CacheManager
export { registerCache, getGlobalCache, getPlayerCache }