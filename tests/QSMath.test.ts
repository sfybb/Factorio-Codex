import {describe, expect, afterEach, test, jest} from '@jest/globals';

import "./mocks/StringMock"

import QSMath from "../src/quick_search/QS_math";

global.log = console.log
describe("QSMath evaluate string math formula", () => {
    test("addition", () => {
        let res = QSMath.calculateString("1234 +69 +	123.567+0.4+10+	") // result = 1,436.967

        expect(res).toStrictEqual([1436.967, ""])
    })

    test("subtraction", () => {
        let res = QSMath.calculateString("69420 -420 -	33.33-0.7-45-	") // result = 68,920.97

        expect(res).toStrictEqual([68920.97, ""])
    })

    test("multiplication", () => {
        let res = QSMath.calculateString("1*3*5*10*3.21 *	") // result = 481.5

        expect(res).toStrictEqual([481.5, ""])
    })

    test("division", () => {
        let res = QSMath.calculateString("481.5/3.21/5/	10  	/ ") // result = 3

        expect(res).toStrictEqual([3, ""])
    })

    test("exponents", () => {
        let res = QSMath.calculateString("2^3^2") // result = 512

        expect(res).toStrictEqual([512, ""])
    })

    test("brackets simple", () => {
        let res = QSMath.calculateString("(1+4)/5") // result = 1

        expect(res).toStrictEqual([1, ""])
    })

    test("brackets", () => {
        let res = QSMath.calculateString("(4*(3+2))^2") // result = 400

        expect(res).toStrictEqual([400, ""])
    })
})