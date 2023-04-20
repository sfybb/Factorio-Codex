import {DictionaryEntry, getDictionaryCache} from "cache/DictionaryCache";
import SearchUtils, {SearchResult, multiOrderFunc} from "SearchUtils";
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

        maxRes = maxRes == undefined ? 100 : maxRes

        let searchRes: SearchResult[] = getSearchResultsOld(prompt, player)
        SearchUtils.sort(searchRes, order, maxRes)

        return searchRes
    }
    export function getSearchResults(prompt: string, player: PlayerIndex): SearchResult[] {
        prompt = prompt.toLowerCase()
        let tokens = prompt.split(" ")

        let searchedTokens = new LuaSet<string>()


        let dictCache = getDictionaryCache(player)
        if (dictCache == undefined) return []

        let searchables: ISearchable<DictionaryEntry>[] = dictCache.getSearchables()

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
        game.print(["", "Tree Search: ", prof, " (Search: ", profSearch, "; Merge: ", profMerge, `; #${res.length})`])

        return res
    }

    function getSearchResultsOld(prompt: string, player: PlayerIndex): SearchResult[] {
        //$log_debug!(`Searching for '${prompt}'`)

        let dictCache = getDictionaryCache(player)
        let protoCache = getPrototypeCache()
        if (dictCache == undefined || protoCache == undefined) return []

        let dicts: Dict[] = [
            {
                type: "item",
                data: dictCache.getNamesTranslation("item"),
                prototype_list: protoCache.getItems(),
            }, {
                type: "fluid",
                data: dictCache.getNamesTranslation("fluid"),
                prototype_list: protoCache.getFluid(),
            }, {
                type: "technology",
                data: dictCache.getNamesTranslation("technology"),
                prototype_list: protoCache.getTech(),
            }
        ]

        // let prof = game.create_profiler(false)

        prompt = prompt.toLowerCase()
        let tokens = prompt.split(" ")
        let quoted_tokens = tokens.map(SearchUtils.quote_str)

        // remove duplicate tokens
        let searchedTokens = new LuaSet<string>()
        for (let token of quoted_tokens) if (token.length != 0) searchedTokens.add(token)

        let matchingResults: SearchResult[] = []
        for (let dict of dicts) {
            if (dict == undefined || dict.data == undefined) continue

            for (let [key, val] of dict.data) {
                let val_lower = val.toLowerCase()

                let match_count = 0

                for (let token of searchedTokens) {


                    let [, count] = string.gsub(val_lower, token, "")
                    if (count == 0) {
                        match_count = 0
                        break
                    }
                    /*let [, sowc] = string.gsub(val_lower, "%s+" + token, "")
                    let [, sonc] = string.gsub(val_lower, "^" + token, "")*/
                    match_count += count /*+ sowc + sonc*/
                }
                if (match_count > 0) {
                    let proto = dict.prototype_list.get(key)
                    if (proto == undefined || !proto.valid) continue // skip invalid prototypes

                    matchingResults.push({
                        type: dict.type,
                        id: key,
                        name: val,
                        match_count: match_count,
                        order: proto.order,
                        hidden: SearchUtils.isPrototypeHidden(proto)
                    })
                }
            }
        }
        /*prof.stop()
        game.print(["", "Factorio Codex: Old Search: ", prof])*/

        return matchingResults
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