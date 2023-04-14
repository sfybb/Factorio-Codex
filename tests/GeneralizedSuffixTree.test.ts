import {describe, expect, afterEach, test, jest} from '@jest/globals';

import "./mocks/LuaMocks"

import GeneralizedSuffixTree from "../src/search/suffixtree/GeneralizedSuffixTree";

global.$log_err = console.log
global.$log_info = console.log

function assert<V, A extends any[]>(cond: V, ...args: A): LuaMultiReturn<[Exclude<V, undefined | null | false>, ...A]> {
    if (cond === false || cond == undefined) {
        throw args || "Assertion failed";
    }
    // @ts-ignore
    return $multi(cond, args)
}

global.assert = assert
describe("Generalized Suffix Tree", () => {
    test("simple insertion", () => {
        let stree = new GeneralizedSuffixTree<any>()
        stree.add("abc", "val")
        console.log(stree.toGraphviz())
    })
    test("complex insertion", () => {
        let stree = new GeneralizedSuffixTree<number>()

        let testStr = "abcabxabcd"
        stree.add(testStr, 1)

        for (let i=0; i < testStr.length; i++) {
            let set = new LuaSet<number>()
            let substr = testStr.substring(i)
            stree.getResults(substr, set)
            expect({has: set.has(1), str: substr, key: 1}).toEqual({has: true, str: substr, key: 1})
        }
    })

    test("multi insertion", () => {
        let stree = new GeneralizedSuffixTree<any>()

        let inserts: Record<string, string> = {
            "Stahlkiste": "steel-chest",
            "Passive provider strongbox": "aai-strongbox-passive-provider",
            "Arcolinkspeicher": "se-linked-container",
            "Passive provider storehouse": "aai-storehouse-passive-provider",
        }

        for (let key in inserts) {
            stree.add(key, inserts[key])
        }

        for (let str in inserts) {
            let key = inserts[str]
            for (let i=0; i < str.length; i++) {
                let set = new LuaSet()
                let substr = str.substring(i)
                stree.getResults(substr, set)
                expect({has: set.has(key), str: substr, key: key}).toEqual({has: true, str: substr, key: key})
            }
        }
    })

    test("extreme insertion", () => {
        let stree = new GeneralizedSuffixTree<string>()

        let inserts: Record<string, string> = {
            "Steel chest": "steel-chest",
            "Passive provider chest": "logistic-chest-passive-provider",
            "Active provider chest": "logistic-chest-active-provider",
            "Storage chest": "logistic-chest-storage",
            "Buffer chest": "logistic-chest-buffer",
            "Requester chest": "logistic-chest-requester",
            "Iron chest": "iron-chest",
            "Wooden chest": "wooden-chest",
            "Strongbox": "aai-strongbox",
            "Passive provider strongbox": "aai-strongbox-passive-provider",
            "Active provider strongbox": "aai-strongbox-active-provider",
            "Storage strongbox": "aai-strongbox-storage",
            "Buffer strongbox": "aai-strongbox-buffer",
            "Requester strongbox": "aai-strongbox-requester",
            "Arcolink storage": "se-linked-container",
            "Storehouse": "aai-storehouse",
            "Passive provider storehouse": "aai-storehouse-passive-provider",
            "Active provider storehouse": "aai-storehouse-active-provider",
            "Storage storehouse": "aai-storehouse-storage",
            "Buffer storehouse": "aai-storehouse-buffer",
            "Requester storehouse": "aai-storehouse-requester",
            "Warehouse": "aai-warehouse",
            "Passive provider warehouse": "aai-warehouse-passive-provider",
            "Active provider warehouse": "aai-warehouse-active-provider",
            "Storage warehouse": "aai-warehouse-storage",
            "Buffer warehouse": "aai-warehouse-buffer",
            "Requester warehouse": "aai-warehouse-requester",
            "Shelter": "kr-shelter",
            "Advanced shelter [color=173, 19, 173](Patreon Item)[/color]": "kr-shelter-plus",
            "Large storage tank": "kr-fluid-storage-1",
            "Huge storage tank": "kr-fluid-storage-2",
            "Loader": "kr-loader",
            "Fast loader": "kr-fast-loader",
            "Express loader": "kr-express-loader",
            "Advanced loader": "kr-advanced-loader",
            "Superior loader": "kr-superior-loader",
            "Space loader": "kr-se-loader",
            "Deep space loader": "kr-se-deep-space-loader-black",
            "Advanced miniloader": "kr-advanced-miniloader",
            "Superior miniloader": "kr-superior-miniloader",
            "Advanced filter miniloader": "kr-advanced-filter-miniloader",
            "Superior filter miniloader": "kr-superior-filter-miniloader",
            "Transport belt": "transport-belt",
            "Fast transport belt": "fast-transport-belt",
            "Express transport belt": "express-transport-belt",
            "Advanced transport belt": "kr-advanced-transport-belt",
            "Superior transport belt": "kr-superior-transport-belt",
            "Space transport belt": "se-space-transport-belt",
            "Black deep space transport belt": "se-deep-space-transport-belt-black",
            "Blue deep space transport belt": "se-deep-space-transport-belt-blue",
            "Cyan deep space transport belt": "se-deep-space-transport-belt-cyan",
            "Green deep space transport belt": "se-deep-space-transport-belt-green",
            "Magenta deep space transport belt": "se-deep-space-transport-belt-magenta",
            "Red deep space transport belt": "se-deep-space-transport-belt-red",
            "White deep space transport belt": "se-deep-space-transport-belt-white",
            "Yellow deep space transport belt": "se-deep-space-transport-belt-yellow",
            "Underground belt": "underground-belt",
            "Fast underground belt": "fast-underground-belt",
            "Express underground belt": "express-underground-belt",
            "Advanced underground belt": "kr-advanced-underground-belt",
            "Superior underground belt": "kr-superior-underground-belt",
            "Chute": "chute-miniloader",
            "Miniloader": "miniloader",
            "Fast miniloader": "fast-miniloader",
            "Express miniloader": "express-miniloader",
            "Filter miniloader": "filter-miniloader",
            "Fast filter miniloader": "fast-filter-miniloader",
            "Express filter miniloader": "express-filter-miniloader",
            "Space underground belt": "se-space-underground-belt",
            "Space filter miniloader": "space-filter-miniloader",
            "Space miniloader": "space-miniloader",
            "Deep space filter miniloader": "deep-space-filter-miniloader",
            "Deep space miniloader": "deep-space-miniloader",
            "Black deep space underground belt": "se-deep-space-underground-belt-black",
            "Blue deep space underground belt": "se-deep-space-underground-belt-blue",
            "Cyan deep space underground belt": "se-deep-space-underground-belt-cyan",
            "Green deep space underground belt": "se-deep-space-underground-belt-green",
            "Magenta deep space underground belt": "se-deep-space-underground-belt-magenta",
            "Red deep space underground belt": "se-deep-space-underground-belt-red",
            "White deep space underground belt": "se-deep-space-underground-belt-white",
            "Yellow deep space underground belt": "se-deep-space-underground-belt-yellow",
            "Splitter": "splitter",
            "Fast splitter": "fast-splitter",
            "Express splitter": "express-splitter",
            "Advanced splitter": "kr-advanced-splitter",
            "Superior splitter": "kr-superior-splitter",
            "Space splitter": "se-space-splitter",
            "Black deep space splitter": "se-deep-space-splitter-black",
            "Blue deep space splitter": "se-deep-space-splitter-blue",
            "Cyan deep space splitter": "se-deep-space-splitter-cyan",
            "Green deep space splitter": "se-deep-space-splitter-green",
            "Magenta deep space splitter": "se-deep-space-splitter-magenta",
            "Red deep space splitter": "se-deep-space-splitter-red",
            "White deep space splitter": "se-deep-space-splitter-white",
            "Yellow deep space splitter": "se-deep-space-splitter-yellow",
            "Burner inserter": "burner-inserter",
            "Inserter": "inserter",
            "Long-handed inserter": "long-handed-inserter",
            "Fast inserter": "fast-inserter",
            "Filter inserter": "filter-inserter",
            "Stack inserter": "stack-inserter",
            "Stack filter inserter": "stack-filter-inserter",
            "Superior inserter": "kr-superior-inserter",
            "Superior long inserter": "kr-superior-long-inserter",
            "Superior filter inserter": "kr-superior-filter-inserter",
            "Superior long filter inserter": "kr-superior-long-filter-inserter",
            "Pipe": "pipe",
            "Steel pipe": "kr-steel-pipe",
            "Space pipe": "se-space-pipe",
            "Pipe to ground": "pipe-to-ground",
            "Steel underground pipe": "kr-steel-pipe-to-ground",
        }

        for (let key in inserts) {
            stree.add(key, inserts[key])
        }

        for (let str in inserts) {
            let key = inserts[str]
            for (let i=0; i < str.length; i++) {
                let set = new LuaSet<string>()
                let substr = str.substring(i)
                stree.getResults(substr, set)
                expect({has: set.has(key), str: substr, key: key}).toEqual({has: true, str: substr, key: key})
            }
        }
    })
})