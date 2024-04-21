import {describe, expect, test} from "@jest/globals";

import "./mocks/LuaMocks"
import "./mocks/BaseMocks"

import Quantity from '../src/quick_search/Quantity';

describe("SI Unit module", () => {
    test("Pretty print converts to derived unit", () => {
        let W_base_uints = new LuaMap<string, number>()
        W_base_uints.set('s', -2)
        W_base_uints.set('m',  2)
        W_base_uints.set('g',  1)

        let u = new Quantity(1, {
            exp: 1,
            units: W_base_uints
        })
        expect(u.prettyPrint()).toStrictEqual("10 mJ")
    })

    test("Pretty print does not require units", () => {
        let u = new Quantity(10)
        expect(u.prettyPrint()).toStrictEqual("10")
    })

    test("Pretty print ", () => {
        let u = new Quantity(Math.pow(10, 14))
        expect(u.prettyPrint(true)).toStrictEqual("100T")
    })

    test("Derived units can be recovered", () => {
        let u = Quantity.fromUnit("J")
        expect(u.prettyPrint()).toStrictEqual("1 J")
    })

    test("Unit conversion J -> W", () => {
        let j = Quantity.fromUnit("J")
        let s =  Quantity.fromUnit("s")
        expect(j.div(s).toString()).toStrictEqual("1 W")
    })

    test("Unit conversion J -> Pa", () => {
        let j = Quantity.fromUnit("J")
        let m =  Quantity.fromUnit("m")
        const N = j.div(m)
        expect(N.toString()).toStrictEqual("1 N")
        const Nm = N.div(m)
        expect(Nm.toString()).toStrictEqual("1 N/m")
        const Pa = Nm.div(m)
        expect(Pa.toString()).toStrictEqual("1 Pa")
    })

    test("Unit exponentiation 1/s => 1/m^2", () => {
        let s = Quantity.fromUnit("m")
        let s_inv = Quantity.fromNumber(1).div(s)
        let s_inv_sq = s_inv.pow(Quantity.fromNumber(2))
        expect(s_inv_sq.toString()).toStrictEqual("1 m^-2")
    })

    test("Unit inverse units 1/J^2 => 1 J^-2", () => {
        let J_base_uints = new LuaMap<string, number>()
        J_base_uints.set('s', -4)
        J_base_uints.set('m',  4)
        J_base_uints.set('g',  2)

        let j = new Quantity(1, {
            exp: 6,
            units: J_base_uints
        })
        let j_inv = Quantity.fromNumber(1).div(j)
        expect(j_inv.toString()).toStrictEqual("1 J^-2")
    })
})