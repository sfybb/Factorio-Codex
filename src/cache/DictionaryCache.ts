import {getPlayerCache, registerCache, CacheFactory, PlayerCache} from "Cache";
import GeneralizedSuffixTree from "search/suffixtree/GeneralizedSuffixTree";
import ISearchable from "search/Searchable";
import {getPrototypeCache} from "./PrototypeCache";
import MigratablePrototype from "../PrototypeHelper";

export type DictionaryEntry = {
    type: string,
    id: string,
    name: string,

    order: string,
    hidden: boolean
}

let DictionaryCacheFactory: CacheFactory = {
    cache_id: "dicts_cache",
    cache_name: "Dictionary Cache",
    global_cache: false,

    Create(player_index: PlayerIndex): PlayerCache {
        return new DictionaryCache(player_index);
    },

    Load(cache: PlayerCache): void {
        // @ts-ignore
        setmetatable(cache, DictionaryCache.prototype)
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
    names_suffixtree: LuaTable<string, GeneralizedSuffixTree<DictionaryEntry>>;
    language: string

    searchables: ISearchable<DictionaryEntry>[]

    constructor(owner: PlayerIndex) {
        this.owner = owner
        this.translated = false
        this.language = "?"
        this.names_translation = new LuaTable()
        this.names_suffixtree = new LuaTable()
        this.searchables = []
    }

    getNamesTranslation(type: string): undefined | LuaTable<string,string> {
        return this.names_translation.get(type)
    }

    getSuffixTrees(type: string): undefined | GeneralizedSuffixTree<DictionaryEntry> {
        return this.names_suffixtree.get(type)
    }

    isTranslated(): boolean {
        return this.translated
    }

    loadLanguageData(langData: FLIBTranslationFinishedOutput): void {
        this.language = langData.language
        $log_info!(`Loading language data ('${this.language}') for player ${this.owner}`)

        for (let [dictName, dictData] of langData.dictionaries) {
            if (dictName.endsWith("_names")) {
                let name = dictName.substring(0, dictName.indexOf("_names"))
                this.names_translation.set(name , dictData )
                //this.buildSuffixtree(name , dictData)
            }
        }
        this.translated = true
    }

    buildSuffixtree(name: string, data: LuaTable<string, string>): void {
        let stree = new GeneralizedSuffixTree<DictionaryEntry>()

        let protoCache = getPrototypeCache()
        // @ts-ignore
        let relevantProtos: LuaTable<string, MigratablePrototype<LuaItemPrototype>> = protoCache != undefined ? protoCache.getAll()[name] : game[`${name}_prototypes`]


        $log_info!(`Building suffix tree for  "${name}"`)
        let prof = game.create_profiler(false)


        for (let [id, translated] of data) {
            let proto = relevantProtos.get(id)
            if (proto == undefined || !proto.valid) continue // skip invalid prototypes

            let dictEntry: DictionaryEntry = {
                type: name,
                id: id,
                name: translated,
                order: proto?.order,
                hidden: proto.object_name == "LuaItemPrototype" || proto.object_name == "LuaEntityPrototype"  ? proto.has_flag("hidden") :
                    // @ts-ignore
                    proto.object_name != "LuaTilePrototype" ? proto.hidden : false
            }

            stree.add(translated.toLowerCase(), dictEntry)
        }
        prof.stop()
        game.print(["", `Build suffix tree for  "${name}" in `, prof])

        this.names_suffixtree.set(name, stree)
        this.searchables.push(stree)
    }

    getSearchables(): ISearchable<DictionaryEntry>[] {
        return this.searchables
    }

    Rebuild() {
        //this.translated = false
    }

    validate(ownerIndex: PlayerIndex): void {

    }
}

export default DictionaryCache
export {getDictionaryCache}