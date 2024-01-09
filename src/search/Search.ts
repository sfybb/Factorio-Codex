import {DictionaryEntry, getDictionaryCache} from "cache/DictionaryCache";
import {default as SearchUtils, SearchResult, multiOrderFunc} from "SearchUtils";
import {getPrototypeCache} from "cache/PrototypeCache";
import ISearchable from "search/Searchable";
import MigratablePrototype from "PrototypeHelper";

type Dict = {
    prototype_list: LuaTable<string, MigratablePrototype<LuaTechnologyPrototype>> |
        LuaTable<string, MigratablePrototype<LuaItemPrototype>> |
        LuaTable<string, MigratablePrototype<LuaFluidPrototype>> |
        LuaTable<string, MigratablePrototype<LuaTilePrototype>>,
    type: string,
    data?: LuaTable<string, string>
}

namespace Search {
    export function search(this: any, prompt: string, player: PlayerIndex, order: multiOrderFunc<SearchResult>, maxRes?: number) {
        //$log_info!(`Args: prompt: "${prompt} player: ${player} ... maxRes: ${maxRes}"`)
        //if (prompt == undefined || prompt.length == 0) return []

        maxRes = maxRes ?? 100

        let searchRes: SearchResult[] = getSearchResults(prompt, player)
        SearchUtils.sort(searchRes, order, maxRes)

        return searchRes
    }
    export function getSearchResults(prompt: string, player: PlayerIndex): SearchResult[] {
        prompt = prompt.toLowerCase()
        let tokens = prompt.split(" ")

        let searchedTokens = new LuaSet<string>()


        let dictCache = getDictionaryCache()
        if (dictCache == undefined) return []

        let searchables: ISearchable<DictionaryEntry>[] = dictCache.getSearchables(player)

        let profSearch = game.create_profiler(true)
        let profMerge = game.create_profiler(true)
        let prof = game.create_profiler(false)

        let resSet = undefined
        for (let token of tokens) {
            if (token.length == 0 || searchedTokens.has(token)) continue
            searchedTokens.add(token)

            profSearch.restart()
            let tokenRes = new LuaSet<DictionaryEntry>()
            for (let searchable of searchables) {
                searchable.getResults(token, tokenRes)
            }

            profSearch.stop()
            profMerge.restart()

            if (resSet != undefined) resSet = SetIntersection(resSet, tokenRes);
            else resSet = tokenRes

            profMerge.stop()
        }
        if (resSet == undefined) return []

        let res: SearchResult[] = []
        if (table_size(resSet) > 500) {
            for (let e of resSet) {
                if (!e.hidden && e.type != "technology") table.insert(res, e)
            }
        }
        else {
            for (let e of resSet) {
                table.insert(res, e)
            }
        }

        prof.stop()
        //game.print(["", "Tree Search: ", prof, " (Search: ", profSearch, "; Merge: ", profMerge, `; #${res.length})`])

        return res
    }

    function SetIntersection<T extends AnyNotNil>(A: LuaSet<T>, B: LuaSet<T>): LuaSet<T> {
        let A_size = table_size(A)
        let B_size = table_size(B)

        if (A_size > B_size) [A, B] = [B, A]

        for (let entry of A) {
            // @ts-ignore
            A[entry] = B[entry]
        }
        return A
    }
}

export default Search
export {SortOrderQS, SortOrderDefault} from "SearchUtils"