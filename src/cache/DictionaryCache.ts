// @ts-ignore
import CacheManager, {getPlayerCache, registerCache, CacheFactory, PlayerCache} from "Cache";

let DictionaryCacheFactory: CacheFactory = {
    cache_id: "dicts_cache",
    cache_name: "Dictionary Cache",
    global_cache: false,

    Create(player_index: PlayerIndex): PlayerCache {
        return new DictionaryCache(player_index);
    },

    Load(cache: PlayerCache): void {
        // @ts-ignore
        setmetatable(c, DictionaryCache.prototype)
    }
}

registerCache(DictionaryCacheFactory)


function getDictionaryCache(player: PlayerIndex): undefined | DictionaryCache {
    return getPlayerCache(DictionaryCacheFactory.cache_id, player) as DictionaryCache
}

class DictionaryCache implements PlayerCache {
    readonly id: string = DictionaryCacheFactory.cache_id;
    readonly name: string = DictionaryCacheFactory.cache_name;
    readonly is_global: false = false;
    readonly owner: PlayerIndex;

    translated: boolean;
    names_translation: LuaTable<string, LuaTable<string, string>>;
    language: string

    constructor(owner: PlayerIndex) {
        this.owner = owner
        this.translated = false
        this.language = "?"
        this.names_translation = new LuaTable()
    }

    getNamesTranslation(type: string): undefined | LuaTable<string,string> {
        return this.names_translation.get(type)
    }

    isTranslated(): boolean {
        return this.translated
    }

    loadLanguageData(langData: FLIBTranslationFinishedOutput): void {
        this.language = langData.language
        $log_info!(`Loading language data ('${this.language}') for player ${this.owner}`)

        for (let [dictName, dictData] of langData.dictionaries) {
            if (dictName.endsWith("_names")) {
                this.names_translation.set( dictName.substring(0, dictName.indexOf("_names")), dictData )
            }
        }
        this.translated = true
    }

    validate(ownerIndex: PlayerIndex): void {

    }
}

export default DictionaryCache
export {getDictionaryCache}