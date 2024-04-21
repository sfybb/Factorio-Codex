import {describe, expect, afterEach, test, jest} from '@jest/globals';

import "./mocks/StringMock"
import "./mocks/LuaMocks"
import "./mocks/BaseMocks"

global.log = console.log

import QSMath from "../src/quick_search/QS_math";
import Quantity from "../src/quick_search/Quantity";
import {ExpectationResult, MatcherContext} from "expect";

function quantityToBeCloseTo<Context extends MatcherContext = MatcherContext>(this: Context, actual: undefined | Quantity, expected:  undefined | Quantity): ExpectationResult {
    let isCloseTo: boolean = true



    if (actual != undefined && expected != undefined) {
        if (this.isNot) {
            expect(actual.getValue()).not.toBeCloseTo(expected.getValue())
        } else {
            expect(actual.getValue()).toBeCloseTo(expected.getValue())
        }

        let act_units = actual?.si_units?.units ?? new LuaMap<string, number>()
        let exp_units = expected?.si_units?.units ?? new LuaMap<string, number>()

        for (let [u, e] of act_units) {
            if (exp_units.get(u) !== e) {
                isCloseTo = false;
                break
            }
        }
    } else {
        isCloseTo = actual == expected
    }



    if (isCloseTo) {
        return {
            message: () => `expected ${this.utils.printReceived(actual
            )}\nis close to ${this.utils.printExpected(expected)}`,
            pass: true
        }
    } else {
        return {
            message: () => `expected ${this.utils.printReceived(actual
            )}\nto be close to ${this.utils.printExpected(expected)
            }\n\n${this.utils.diff(
                expected,
                actual,
                {includeChangeCounts: true}
            )}`,
            pass: false
        }
    }
}

expect.extend({
    quantityToBeCloseTo,
})

describe("QSMath evaluate string math formula", () => {
    test("addition", () => {
        let res = QSMath.calculateString("1234 +69 +	123.567+0.4+10+	") // result = 1,436.967

        expect(res[0]).toStrictEqual(true)
        // @ts-ignore
        expect(res[1]).quantityToBeCloseTo(Quantity.fromNumber(1436.967));
    })

    test("subtraction", () => {
        let res = QSMath.calculateString("69420 -420 -	33.33-0.7-45-	") // result = 68,920.97

        expect(res[0]).toStrictEqual(true)
        // @ts-ignore
        expect(res[1]).quantityToBeCloseTo(Quantity.fromNumber(68920.97));
    })

    test("multiplication", () => {
        let res = QSMath.calculateString("1*3*5*10*3.21 *	") // result = 481.5

        expect(res[0]).toStrictEqual(true)
        // @ts-ignore
        expect(res[1]).quantityToBeCloseTo(Quantity.fromNumber(481.5));
    })

    test("division", () => {
        let res = QSMath.calculateString("481.5/3.21/5/	10  	/ ") // result = 3

        expect(res[0]).toStrictEqual(true)
        // @ts-ignore
        expect(res[1]).quantityToBeCloseTo(Quantity.fromNumber(3));
    })

    test("exponents", () => {
        let res = QSMath.calculateString("2^3^2^") // result = 512

        expect(res[0]).toStrictEqual(true)
        // @ts-ignore
        expect(res[1]).quantityToBeCloseTo(Quantity.fromNumber(512));
    })

    test("brackets simple", () => {
        let res = QSMath.calculateString("(1+4)/5") // result = 1

        expect(res[0]).toStrictEqual(true)
        // @ts-ignore
        expect(res[1]).quantityToBeCloseTo(Quantity.fromNumber(1));
    })

    test("brackets", () => {
        let res = QSMath.calculateString("(4*(3+2))^2") // result = 400

        expect(res[0]).toStrictEqual(true)
        // @ts-ignore
        expect(res[1]).quantityToBeCloseTo(Quantity.fromNumber(400));
    })
})