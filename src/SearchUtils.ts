import GeneralizedSuffixTree from "search/suffixtree/GeneralizedSuffixTree";
import Search from "search/Search";

type orderFunction<T> = ((this: any, a: T, b: T, ...args: any[]) => number)
export type multiOrderFunc<T> = orderFunction<T> | orderFunction<T>[]


type anyPrototype = LuaTechnologyPrototype |
    LuaItemPrototype |
    LuaFluidPrototype |
    LuaTilePrototype |
    LuaEntityPrototype

export type SearchResult = {
    hidden: boolean,
    order: string,
    match_count: number
    type: string,
    id: string,
    name: string
}

const isHiddenTable = {
    LuaTechnologyPrototype: (p: LuaTechnologyPrototype) => p.hidden,
    LuaFluidPrototype: (p: LuaFluidPrototype) => p.hidden,
    LuaItemPrototype: (p: LuaItemPrototype) => p.has_flag("hidden"),
    LuaTilePrototype: (p: LuaTilePrototype) => false,
    LuaEntityPrototype: (p: LuaEntityPrototype) => p.has_flag("hidden")
}

const SortOrderDefault = {
    factorio(this: any, a: anyPrototype, b: anyPrototype): number {
        if ( a.order == b.order ) return 0
        if ( a.order == undefined || b.order == undefined ) {
            return a.order != undefined ? 1 : -1
        }
        return a.order > b.order ? 1 : -1
    },
    tech_last(this: any, a: anyPrototype, b: anyPrototype): number {
        let a_obj_name = a.object_name
        let b_obj_name = b.object_name
        if (a_obj_name != b_obj_name && ( a_obj_name == "LuaTechnologyPrototype" || b_obj_name == "LuaTechnologyPrototype" )) {
            return a_obj_name != "LuaTechnologyPrototype" ? -1 : 1
        }
        return 0
    },
    hidden_last(this: any, a: anyPrototype, b: anyPrototype): number {
        let a_hidden = SearchUtils.isPrototypeHidden(a)
        return a_hidden == SearchUtils.isPrototypeHidden(b) ? 0 : (a_hidden ? 1 : -1)
    }
}

const SortOrderQS = {
    factorio(this: any, a: SearchResult, b: SearchResult): number {
        if ( a.order == b.order ) return 0
        if ( a.order == undefined || b.order == undefined ) {
            return a.order != undefined ? 1 : -1
        }
        return a.order > b.order ? 1 : -1
    },
    tech_last(this: any, a: SearchResult, b: SearchResult): number {
        if (a.type != b.type && ( a.type == "technology" || b.type == "technology" )) {
            return a.type != "technology" ? -1 : 1
        }
        return 0
    },
    hidden_last(this: any, a: SearchResult, b: SearchResult): number {
        return a.hidden == b.hidden ? 0 : (a.hidden ? 1 : -1)
    },
    match_count(this: any, a: SearchResult, b: SearchResult): number {
        return b.match_count - a.match_count
    }
}

namespace SearchUtils {
    export function isPrototypeHidden(proto: anyPrototype) {
        let func = isHiddenTable[proto.object_name]
        // @ts-ignore
        return func == undefined ? true : func(proto)
    }

    /* Order:
     *   < 0: sort a before b
     *   > 0: sort a after b
     *   = 0: keep original order of a and b
     */
    export function compare_multi_order<T>(this: any, A: T, B: T, ...args: any[]): number {
        let sort_order = 0
        //let orderIndx = -1
        for (let func of args) {
            //orderIndx++
            sort_order = func(null, A, B)
            if (sort_order != 0) break
        }
        // @ts-ignore
        //$log_trace!
        //console.log(`Comparing '${A.name}'('${A.prototype?.order}') vs '${B.name}'('${B.prototype?.order}'): ${sort_order}  (${orderIndx})`)
        return sort_order
    }

    // Performance (search: "e"; SE+K2): 117.6 ms
    // Lua Perf: 157.2 ms

    // Performance (search: "erz"; SE+K2)
    //    26;  8; 0.4 -- partial quicksearch
    // 102.8; 45; 0.8 -- table.sort
    export function sort<T>(A: T[], order: multiOrderFunc<T>, maxResults?: number): void {
        if (A == undefined || A.length == 0) return

        let profSplice = game.create_profiler(true)
        let prof = game.create_profiler()

        let orderCompositeFunc: orderFunction<T>
        let orderArgs: any[] = []
        if (typeof order == "function") {
            orderCompositeFunc = order
        } else {
            // @ts-ignore
            orderCompositeFunc = SearchUtils.compare_multi_order
            orderArgs = order
        }
        $log_debug!(`Sorting array of size ${A.length}`)

        // @ts-ignore
        //$log_debug!(serpent.line(A, {nocode: true, comment: false}))
        /*if (A.length >= 0) {
            $log_info!("Normal Sort")
            A.sort(orderCompositeFunc)
        } else {
            $log_info!("Partial quicksort")*/
            maxResults = maxResults == undefined ? A.length : maxResults
            partial_quicksort(A, orderCompositeFunc, maxResults, undefined, undefined, ...orderArgs)

        prof.stop()
        profSplice.restart()

        if (A.length > maxResults) A.splice(maxResults, A.length-maxResults)
        profSplice.stop()

        game.print(["", "Factorio Codex: Sort: ", prof, "; Splice: ", profSplice])
        //}

        /**/
    }

    export function partial_quicksort<T>(A: T[], order: orderFunction<T>, k: number,
                                         i?: number, j?: number, ...args: any[]) {
        i = i == undefined ? 0 : i
        j = j == undefined ? A.length-1 : j

        if ( i < j ) {
            let pI = Math.floor((i+j)/2) //pivot(A, i, j)
            pI = partition(A, order, i, j, pI, ...args)
            partial_quicksort(A, order, k, i, pI - 1, ...args)
            if ( pI < k - 1 )  partial_quicksort(A, order, k,pI + 1, j, ...args)
        }
    }

    function partition<T>(A: T[], order: orderFunction<T>, l: number, r: number, pI: number, ...args: any[]): number {
        let pivotVal: T = A[pI];
        [A[pI], A[r]] = [A[r], pivotVal];

        /*if (r-l > 10) {
            console.log(`Piviot: ${pivotVal}   ${l}-${r}`)
        } else {
            let tmp = [...A]
            console.log(`Piviot: ${pivotVal}   ${l}-${r}: ${tmp.splice(l, 1+r-l)}`)
        }*/

        if (A[pI] == undefined || A[r] == undefined) {
            $log_info!(`pI: ${pI} A: ${A[pI]} P: ${pivotVal} l: ${l} r: ${r}`)
        }

        let storeIndex = l
        for (let i = l; i < r; i++) {
            /*let cmp = order(A[i], pivotVal)
            console.log(`${JSON.stringify(A[i])}  vs.  pivot ${JSON.stringify(pivotVal)}:  ${cmp < 0 ? "Front" : "End"}`)*/
            if (order(A[i], pivotVal, ...args) < 0) {
                [A[storeIndex], A[i]] = [A[i], A[storeIndex]];
                storeIndex++
            }
        }
        [A[storeIndex], A[r]] = [A[r], A[storeIndex]];

        return storeIndex
    }

    export function quote_str(this: any, str: string): string {
        const quotepattern = `([${"%^$().[]*+-?".split("").join("%%%")}])`
        return string.gsub(str, quotepattern, "%%%1")[0]
    }
}

export default SearchUtils
export {SortOrderDefault, SortOrderQS}