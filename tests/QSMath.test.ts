import {describe, expect, test, beforeEach} from '@jest/globals';

import "./mocks/StringMock"
import "./mocks/LuaMocks"
import "./mocks/BaseMocks"

global.log = console.log

import QSMath, {QSMathResultSuccess} from "../src/core/QS_math";
import Quantity from "../src/core/Quantity";
import {ExpectationResult, MatcherContext} from "expect";
import {PlayerIndex} from "factorio:runtime";

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
    let qs_math: QSMath;

    beforeEach(() => {
        qs_math = new QSMath();
    });

    test("addition", () => {
        let res = qs_math.apply_prompt("1234 +69 +	123.567+0.4+10+	", 0 as PlayerIndex) as QSMathResultSuccess[] // result = 1,436.967

        expect(res[0].error).toStrictEqual(false)
        // @ts-ignore
        expect(res[0].result).quantityToBeCloseTo(Quantity.fromNumber(1436.967));
    })

    test("subtraction", () => {
        let res = qs_math.apply_prompt("69420 -420 -	33.33-0.7-45-	", 0 as PlayerIndex) as QSMathResultSuccess[] // result = 68,920.97

        expect(res[0].error).toStrictEqual(false)
        // @ts-ignore
        expect(res[0].result).quantityToBeCloseTo(Quantity.fromNumber(68920.97));
    })

    test("multiplication", () => {
        let res = qs_math.apply_prompt("1*3*5*10*3.21 *	", 0 as PlayerIndex) as QSMathResultSuccess[] // result = 481.5

        expect(res[0].error).toStrictEqual(false)
        // @ts-ignore
        expect(res[0].result).quantityToBeCloseTo(Quantity.fromNumber(481.5));
    })

    test("division", () => {
        let res = qs_math.apply_prompt("481.5/3.21/5/	10  	/ ", 0 as PlayerIndex) as QSMathResultSuccess[] // result = 3

        expect(res[0].error).toStrictEqual(false)
        // @ts-ignore
        expect(res[0].result).quantityToBeCloseTo(Quantity.fromNumber(3));
    })

    test("exponents", () => {
        let res = qs_math.apply_prompt("2^3^1^2^", 0 as PlayerIndex) as QSMathResultSuccess[] // result = 8

        expect(res[0].error).toStrictEqual(false)
        // @ts-ignore
        expect(res[0].result).quantityToBeCloseTo(Quantity.fromNumber(8));
    })

    test("brackets simple", () => {
        let res = qs_math.apply_prompt("(1+4)/5)", 0 as PlayerIndex) as QSMathResultSuccess[] // result = 1

        expect(res[0].error).toStrictEqual(false)
        // @ts-ignore
        expect(res[0].result).quantityToBeCloseTo(Quantity.fromNumber(1));
    })

    test("brackets", () => {
        let res = qs_math.apply_prompt("(4*(3+2))^(2", 0 as PlayerIndex) as QSMathResultSuccess[] // result = 400

        expect(res[0].error).toStrictEqual(false)
        // @ts-ignore
        expect(res[0].result).quantityToBeCloseTo(Quantity.fromNumber(400));
    })

    test("implicit multiplication", () => {
        let res = qs_math.apply_prompt("2 (3-1)^2", 0 as PlayerIndex) as QSMathResultSuccess[] // result = 8

        expect(res[0].error).toStrictEqual(false)
        // @ts-ignore
        expect(res[0].result).quantityToBeCloseTo(Quantity.fromNumber(8));
    })

    test("negate number", () => {
        let res = qs_math.apply_prompt("2 * -1", 0 as PlayerIndex) as QSMathResultSuccess[] // result = 8

        expect(res[0].error).toStrictEqual(false)
        // @ts-ignore
        expect(res[0].result).quantityToBeCloseTo(Quantity.fromNumber(-2));
    })

    test("superscript numbers", () => {
        let res = qs_math.apply_prompt("2³ ^ 2", 0 as PlayerIndex) as QSMathResultSuccess[] // result = 512

        expect(res[0].error).toStrictEqual(false)
        // @ts-ignore
        expect(res[0].result).quantityToBeCloseTo(Quantity.fromNumber(512));
    })

    test("superscript numbers long", () => {
        let res = qs_math.apply_prompt("2²³", 0 as PlayerIndex) as QSMathResultSuccess[] // result = 8388608

        expect(res[0].error).toStrictEqual(false)
        // @ts-ignore
        expect(res[0].result).quantityToBeCloseTo(Quantity.fromNumber(8388608));
    })

    test("Unit conversion", () => {
        let res = qs_math.apply_prompt("4 GJ / 40 MW", 0 as PlayerIndex) as QSMathResultSuccess[]
        expect(res[0].error).toStrictEqual(false)
        // @ts-ignore
        expect(res[0].result.toString()).toStrictEqual("1 min + 40 s");
    })
})