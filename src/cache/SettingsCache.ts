import {getPlayerCache, registerCache, CacheFactory, PlayerCache} from "Cache";
import PlayerData from "PlayerData";
import SearchOptions, {getDefaultSearchOptions} from "search/SearchOptions";

let SettingsCacheFactory: CacheFactory = {
    cache_id: "settings_cache",
    cache_name: "Settings Cache",
    global_cache: false,

    Create(player_index: PlayerIndex): PlayerCache {
        return new SettingsCache(player_index)
    },

    Load(cache: PlayerCache): void {
        // @ts-ignore
        setmetatable(cache, SettingsCache.prototype)
    }
}

registerCache(SettingsCacheFactory)

function getSettingsCache(player: PlayerIndex): undefined | SettingsCache {
    return getPlayerCache(SettingsCacheFactory.cache_id, player) as SettingsCache
}

declare const global: {
    playerData: typeof PlayerData
}

class SettingsCache implements PlayerCache {
    readonly id: string = SettingsCacheFactory.cache_id;
    readonly name: string = SettingsCacheFactory.cache_name;
    readonly is_global: false = false;
    readonly owner: PlayerIndex;

    debug: boolean
    searchOptions: SearchOptions

    constructor(owner: PlayerIndex) {
        this.owner = owner
        this.debug = false

        this.searchOptions = getDefaultSearchOptions()
    }

    Rebuild(): void {
    }

    toggleDebug() {
        this.debug = !this.debug

        let actionName: string = "debugToggle"
        // @ts-ignore
        let event: GuiEventData = { player_index: this.owner }

        let handleUIEvents = global.playerData?.handleUIEvents
        if (handleUIEvents != undefined) {
            handleUIEvents( { gui: "quick_search", action: actionName }, event)
            handleUIEvents( { gui: "codex", action: actionName }, event)
        }
    }

    is_debug(): boolean {
        return this.debug
    }

    getSearchOptions(): SearchOptions {
        return this.searchOptions
    }

    validate(ownerIndex: PlayerIndex): void {

    }
}

export default SettingsCache
export {getSettingsCache}