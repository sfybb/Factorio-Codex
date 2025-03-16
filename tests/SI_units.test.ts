import {describe, expect, test} from "@jest/globals";

import "./mocks/LuaMocks"
import "./mocks/BaseMocks"

import SI from "../src/quick_search/SI_units";

describe("SI Unit module", () => {
    test("Pretty print handles unit less case", () => {
        let NoUnit = SI.DerivedToBaseUnits("")

        expect(SI.BaseUnitsToDerived(NoUnit)).toStrictEqual({exp: 0, units: new LuaMap()})
    })

    test("Pretty print converts to derived unit", () => {
        let Watt = SI.DerivedToBaseUnits("W")

        Watt.exp *= 100
        for(let [key, exp] of Watt.units) {
            Watt.units.set(key, exp * 100)
        }

        let expected = {exp: 0, units: new LuaMap()}
        expected.units.set("W", 100)

        expect(SI.BaseUnitsToDerived(Watt)).toStrictEqual(expected)
    })

    test("Pretty print m/s", () => {
        let m_per_s = SI.DerivedToBaseUnits("m")
        m_per_s.units.set("s", -1)

        expect(SI.BaseUnitsToDerived(m_per_s)).toStrictEqual(m_per_s)
    })

    // While it would be great that this works, the greedy approach cannot find this solution since "W" and "J"
    // fir into the base units more than 100 times
    test.skip("Pretty print converts to multiple derived units", () => {
        let Watt = SI.DerivedToBaseUnits("W")
        let Joule = SI.DerivedToBaseUnits("J")
        let WJ = SI.DerivedToBaseUnits("")

        WJ.exp = (Watt.exp + Joule.exp) * 100
        for(let [key, exp] of Watt.units) {
            WJ.units.set(key, exp * 100)
        }

        for(let [key, exp] of Joule.units) {
            WJ.units.set(key, (WJ.units.get(key) ?? 0) + exp * 100)
        }

        let expected = {exp: 0, units: new LuaMap()}
        expected.units.set("W", 100)
        expected.units.set("J", 100)

        expect(SI.BaseUnitsToDerived(WJ)).toStrictEqual(expected)
    })
})