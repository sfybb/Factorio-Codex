import {default as Dictionary, DictionaryEntry, ISearchable} from "core/Dictionary";
import {default as SearchUtils, multiOrderFunc, SearchResult, SortOrderQS} from "util/SearchUtils";
import MigratablePrototype from "PrototypeHelper";
import {
    LuaFluidPrototype,
    LuaItemPrototype,
    LuaTechnologyPrototype,
    LuaTilePrototype,
    PlayerIndex
} from "factorio:runtime";
import {QSModule, QSResult, QSResultBase} from "./QuickSearch";
import {getPlayerData} from "./dataHandler";
import {SettingsColor} from "../settings";
import Features from "../Features";

declare let prototypes: {
    technology: LuaTable<string, MigratablePrototype<LuaTechnologyPrototype>>
    item: LuaTable<string, MigratablePrototype<LuaItemPrototype>>,
    fluid: LuaTable<string, MigratablePrototype<LuaFluidPrototype>>,
    tile: LuaTable<string, MigratablePrototype<LuaTilePrototype>>,
}

type Dict = {
    prototype_list: LuaTable<string, MigratablePrototype<LuaTechnologyPrototype>> |
        LuaTable<string, MigratablePrototype<LuaItemPrototype>> |
        LuaTable<string, MigratablePrototype<LuaFluidPrototype>> |
        LuaTable<string, MigratablePrototype<LuaTilePrototype>>,
    type: string,
    data?: LuaTable<string, string>
}

export interface QSSearchResult extends QSResultBase {
    readonly type: "search";

    search_terms: string[];

    prototype_type: "fluid" | "item" | "tile" | "technology";
    id: string;

    match_count?: number;
    hidden: boolean;
    order: string;
}

export interface QSSearchResultWaiting extends QSResultBase {
    readonly type: "search-waiting";
}

export class QSSearch implements QSModule {
    readonly id = "search";
    readonly order = "c";
    readonly async = true;

    apply_prompt(prompt: string, player: PlayerIndex): QSResult[] {
        if (!Dictionary.hasTranslations(player)) {
            return [{
                type: "search-waiting",
                text: ["factorio-codex.waiting-for-translation"]
            }]
        }

        let playerData = getPlayerData(player)
        let searchTargets: LuaSet<string> = new LuaSet<string>();
        let order = [SortOrderQS.hidden_last]

        if (playerData.settings.get("search_items") == true) searchTargets.add("item")
        if (playerData.settings.get("search_fluids") == true) searchTargets.add("fluid")
        if (playerData.settings.get("search_technologies") == true) searchTargets.add("technology")

        if (playerData.settings.get("search_technologies_always_last") == true) order.push(SortOrderQS.tech_last)

        order.push(SortOrderQS.match_count)
        order.push(SortOrderQS.factorio)

        prompt = prompt.toLowerCase()
        let tokens = prompt.split(" ").map(s => s.trim())


        let matching_names = this.search(
            tokens, player, order,
            100,  searchTargets)
        //$log_info!(serpent.block(matching_names,  {}))


        if (matching_names.length == 0) return [];

        const typeColors: LuaMap<string, string> = new LuaMap()
        typeColors.set("item", (playerData.settings.get("search_items_color") as SettingsColor).hex)
        typeColors.set("fluid", (playerData.settings.get("search_fluids_color") as SettingsColor).hex)
        typeColors.set("technology", (playerData.settings.get("search_technologies_color") as SettingsColor).hex)

        let res: QSSearchResult[] = []
        for (let search_res of matching_names ) {
            if (search_res.hidden) {
                continue
            }

            if (search_res.id.startsWith("parameter-")) {
                // Showing an item parameter in factoriopedia would result in text like "Stack size: 1\nRocket capacity..."
                // So the type has to be changed to entity
                search_res.type = "entity"
            }

            let text = search_res.name
            if (typeColors.has(search_res.type)) {
                text = `[color=${typeColors.get(search_res.type)}]${text}[/color]`
            }

            /*if ( debug.is_enabled() ) {
                text += ` M: ${data.match_count} O: ${data.prototype.order}`
            }*/

            res.push({
                type: "search",
                text: `[${search_res.type}=${search_res.id}] ${text}`,

                search_terms: tokens,

                prototype_type: search_res.type,
                id: search_res.id,

                match_count: search_res.match_count,
                hidden: search_res.hidden,
                order: search_res.order,
            } as QSSearchResult)
        }

        return res;
    }

    on_selected(item: QSResult, player: PlayerIndex): string | undefined {
        if (item.type != "search") return undefined

        let search_res = item as QSSearchResult;

        let cur_player = game.get_player(player)
        if (cur_player == undefined) return undefined;

        if (search_res.prototype_type == "technology") {
            cur_player.open_technology_gui(search_res.id)
        } else {
            if (!Features.supports("factoriopedia")) {
                cur_player.print(`To open Factoriopedia please update Factorio to Version 2.0.45 or higher!`)
            } else {
                let prototype = prototypes[search_res.prototype_type].get(search_res.id)
                if (prototype == undefined) {
                    cur_player.print(`[FACTORIO CODEX] The ${search_res.prototype_type} with id "${search_res.id}" is not a factorio prototype. This is a bug.`)
                    cur_player.print("Maybe the command [/color][color=cyan]/fc-rebuild-all[/color] can fix this. If you find the result you clicked on again please report this error.")
                    $log_err!(`What the heck how did we even get here. Player ${$get_player_string(player)}; Search result: ${serpent.line(item)}`)
                }

                $log_debug!(`Opening Factoriopedia for ${search_res.prototype_type} ${search_res.id} ${prototype}`)
                // @ts-ignore
                cur_player.open_factoriopedia_gui(prototype)
            }
        }

        return undefined;
    }

    search(this: any, tokens: string[], player: PlayerIndex, order: multiOrderFunc<SearchResult>, maxRes?: number, toSearch?: LuaSet<string>) {
        $log_debug!(`Args: prompt: ${serpent.line(tokens)} player: ${player} ... maxRes: ${maxRes}" search targets: ${serpent.line(toSearch)}`)
        //if (prompt == undefined || prompt.length == 0) return []

        maxRes = maxRes ?? 100
        let searchRes: SearchResult[] = this.getSearchResults(this, tokens, player, toSearch) // FIXME dont care
        SearchUtils.sort(searchRes, order, maxRes)

        return searchRes
    }

    getSearchResults(this: any, tokens: string[], player: PlayerIndex, toSearch?: LuaSet<string>): SearchResult[] {
        let searchedTokens = new LuaSet<string>()
        let searchables: ISearchable<DictionaryEntry>[] = Dictionary.getSearchables(player, toSearch)

        /*let profSearch = game.create_profiler(true)
        let profMerge = game.create_profiler(true)
        let prof = game.create_profiler(false)*/

        let resSet = undefined
        for (let token of tokens) {
            if (token.length == 0 || searchedTokens.has(token)) continue
            searchedTokens.add(token)

            //profSearch.restart()
            let tokenRes = new LuaSet<DictionaryEntry>()
            for (let searchable of searchables) {
                searchable.getResults(token, tokenRes)
            }

            /*profSearch.stop()
            profMerge.restart()*/

            if (resSet != undefined) resSet = SetIntersection(resSet, tokenRes);
            else resSet = tokenRes

            //profMerge.stop()
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

        //prof.stop()
        //game.print(["", "Tree Search: ", prof, " (Search: ", profSearch, "; Merge: ", profMerge, `; #${res.length})`])

        return res
    }
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