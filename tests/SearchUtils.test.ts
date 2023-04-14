import {describe, expect, afterEach, test, jest} from '@jest/globals';
import "./mocks/LuaMocks"

import SearchUtils, {SortOrderDefault, SortOrderQS} from "../src/SearchUtils";
import {ExpectationResult, MatcherContext} from "expect";

// @ts-ignore
global.game = {
    create_profiler: () => ({stop: jest.fn()}),
    print: jest.fn()
}

// @ts-ignore
global.$log_debug = jest.fn()
// @ts-ignore
global.$log_info = jest.fn()
// @ts-ignore
global.$log_warn = jest.fn()

function arrayToObeyOrder<Context extends MatcherContext = MatcherContext>(this: Context, actual: any[], isOrdered: (A: any, B: any) => number): ExpectationResult {
    if (!Array.isArray(actual)) {
        throw new Error('Only works on arrays');
    }
    if (typeof isOrdered !== "function") {
        throw new Error('Requires a function that checks the expected order');
    }

    let outOfOrderIndices = []
    if (actual.length >= 1) {
        let cur, last
        cur = actual[0]
        for (let i = 1; i < actual.length; i++) {
            last = cur
            cur = actual[i]
            if (isOrdered(last, cur) > 0) {
                outOfOrderIndices.push({a: i - 1, b: i})
            }
        }
    }

    if (outOfOrderIndices.length === 0) {
        return {
            message: () => `expected ${this.utils.printReceived(actual
            )}\n not to obey ordering ${this.utils.printExpected(isOrdered.toString())}`,
            pass: true
        }
    } else {
        let acceptedActual = [...actual]
        acceptedActual.sort(isOrdered)

        return {
            message: () => `expected ${this.utils.printReceived(actual
            )}\nto obey ordering ${this.utils.printExpected(isOrdered.toString())
            }\n\n${this.utils.diff(
                acceptedActual,
                actual,
                {includeChangeCounts: true}
            )}`,
            pass: false
        }
    }
}

expect.extend({
    arrayToObeyOrder,
})

describe("SearchUtils module", () => {
    test("Sort order reverse", () => {
        let toSort = [...Array(42).keys()]
        let truth = [...Array(42).keys()]

        toSort.reverse()

        SearchUtils.sort(toSort, (a, b) => a - b)
        expect(toSort).toStrictEqual(truth)
    })
    test("Sort already sorted", () => {
        let toSort = [...Array(42).keys()]
        let truth = [...Array(42).keys()]

        SearchUtils.sort(toSort, (a, b) => a - b)
        expect(toSort).toStrictEqual(truth)
    })
    test("Sort random array", () => {
        let toSort = [
            28, 33, 4, 19,
            24, 22, 2, 1,
            15, 8, 35, 20,
            9, 12, 31, 26,
            23, 13, 27, 18,
            11, 10, 21, 36,
            32, 34, 17, 5,
            7, 6, 14, 25,
            29, 30, 3, 16,
            0
        ]
        let truth = [...Array(37).keys()]

        SearchUtils.sort(toSort, (a, b) => a - b)
        expect(toSort).toStrictEqual(truth)
    })
    test("Multi sort", () => {
        let toSort = [
            {a: 8,b: 3},
            {a: 2,b: 2},
            {a: 5,b: 1},
            {a: 9,b: 2},
            {a: 6,b: 1},
            {a: 7,b: 1},
            {a: 3,b: 3},
            {a: 1,b: 2},
            {a: 4,b: 3},
        ]

        let truth = [...toSort]
        truth.sort((a, b) => {
            if (a.b != b.b) {
                return a.b - b.b
            } else {
                return a.a - b.a
            }
        })

        SearchUtils.sort(toSort, [
            (a,b) => a.b - b.b,
            (a,b) => a.a - b.a,
        ])
        expect(toSort).toStrictEqual(truth)
    })

    test("Provided sort functions", () => {
        let toSortOrg = [
            {order: "z", match_count: 24, hidden: false, object_name: "LuaFluidPrototype"},
            {order: "f", match_count: 0, hidden: true, object_name: "LuaFluidPrototype"},
            {order: "a", match_count: 9, hidden: true, object_name: "LuaTechnologyPrototype"},
            {order: "d", match_count: 7, object_name: "LuaTilePrototype"}
        ]

        let toSort = [...toSortOrg]
        // @ts-ignore
        SearchUtils.sort(toSort, SortOrderQS.match_count)
        //expect(toSort).toStrictEqual(truth)
        // @ts-ignore
        expect(toSort).arrayToObeyOrder(SortOrderQS.match_count)


        toSort = [...toSortOrg]
        // @ts-ignore
        SearchUtils.sort(toSort, SortOrderDefault.factorio)
        //expect(toSort).toStrictEqual(truth)
        // @ts-ignore
        expect(toSort).arrayToObeyOrder(SortOrderDefault.factorio)


        toSort = [...toSortOrg]
        // @ts-ignore
        SearchUtils.sort(toSort, SortOrderDefault.tech_last)
        // @ts-ignore
        expect(toSort).arrayToObeyOrder(SortOrderDefault.tech_last)


        toSort = [...toSortOrg]
        // @ts-ignore
        SearchUtils.sort(toSort, SortOrderDefault.hidden_last)
        //expect(toSort).toStrictEqual(truth)
        // @ts-ignore
        expect(toSort).arrayToObeyOrder(SortOrderDefault.hidden_last)
    })

    test("Provided sort functions multi", () => {
        let toSort = [
            {order: "f", match_count: 3, hidden: true, object_name: "LuaFluidPrototype"},
            {order: "a", match_count: 9, hidden: true, object_name: "LuaTechnologyPrototype"},
            {order: "d", match_count: 7, object_name: "LuaTilePrototype"},
            {order: "z", match_count: 24, hidden: false, object_name: "LuaFluidPrototype"},
            {order: "f", match_count: 0, hidden: true, object_name: "LuaFluidPrototype"},
            {order: "x", match_count: 24, hidden: false, object_name: "LuaFluidPrototype"}
        ]
        let truth = [
            {order: "x", match_count: 24, hidden: false, object_name: "LuaFluidPrototype"},
            {order: "z", match_count: 24, hidden: false, object_name: "LuaFluidPrototype"},
            {order: "d", match_count: 7, object_name: "LuaTilePrototype"},
            {order: "f", match_count: 3, hidden: true, object_name: "LuaFluidPrototype"},
            {order: "f", match_count: 0, hidden: true, object_name: "LuaFluidPrototype"},
            {order: "a", match_count: 9, hidden: true, object_name: "LuaTechnologyPrototype"}
        ]

        // @ts-ignore
        SearchUtils.sort(toSort, [
            SortOrderDefault.hidden_last,
            SortOrderDefault.tech_last,
            SortOrderQS.match_count,
            SortOrderDefault.factorio
        ])
        expect(toSort).toStrictEqual(truth)
    })

    test("Sorts are commutative", () => {
        let water = {
            id: "water",
            match_count: 2,
            name: "Wasser[color=0,86,153] ■[/color]",
            prototype: {
                order: "a[fluid]-a[water]",
                object_name: "LuaFluidPrototype",
                hidden: false
            },
            type: "fluid"
        }
        let cosmic_water = {
            id: "se-space-water",
            match_count: 2,
            name: "Kosmisches Wasser[color=0,86,153] ■[/color]",
            prototype: {
                order: "a[fluid]-a[water]",
                object_name: "LuaFluidPrototype",
                hidden: false
            },
            type: "fluid"
        }

        let sortFuncs = [SortOrderQS.hidden_last,
            SortOrderQS.tech_last,
            SortOrderQS.match_count,
            SortOrderQS.factorio]

        // @ts-ignore´
        expect(SearchUtils.compare_multi_order( water, cosmic_water, ...sortFuncs)).toBe(0)
        // @ts-ignore´
        expect(SearchUtils.compare_multi_order(cosmic_water, water, ...sortFuncs)).toBe(0)
    })

    test("Partial quicksort", () => {
        let toSort = [...Array(500).keys()]
        let truth = [...Array(30).keys()]

        toSort.reverse()
        SearchUtils.partial_quicksort(toSort, ((a, b) => a - b), 30, 0, toSort.length - 1)
        expect(toSort.splice(0, 30)).toEqual(truth)
    })
})