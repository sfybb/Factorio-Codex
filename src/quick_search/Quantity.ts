let console = {log: log}

namespace SI {
    export type UnitList = LuaMap<string, number>

    export type Units = {
        exp: number,
        units: UnitList
    }

    function makeUnit(exp: number, units: {[unit: string]: number}): Units {
        let res = new LuaMap<string, number>()
        for (const [key, val] of Object.entries(units)) {
            res.set(key, val)
        }
        return {exp, units: res}
    }

    const si_str = ["P", "T", "G", "M", "k", "", "m", "µ", "n"]
    const si_exp = [15, 12, 9, 6, 3, 0, -3, -6, -9]
    const si_derived: { [dunit: string]: Units } = {
        Hz: makeUnit(0, {s: -1}),
        N:  makeUnit(3, {g: 1, m: 1, s: -2}),
        Pa: makeUnit(3, {g: 1, m: -1, s: -2}),
        J:  makeUnit(3, {g: 1, m: 2, s: -2}),
        W:  makeUnit(3, {g: 1, m: 2, s: -3})
    }
    const si_derived_keys_largest_first = Object.keys(si_derived).sort((a, b) => b.length - a.length)

    export function PrefixToExp(si: string): number | undefined {
        const indx = si_str.findIndex((ele) => ele.length != 0 && ele === si)
        if (indx < 0) return undefined

        return si_exp[indx]
    }

    export function DerivedToBaseUnits(units: string): Units {
        let result: Units = {exp: 0, units: new LuaMap()}
        if (units.length == 0) return result

        for (let i = 0; units.length > 0 && i < si_derived_keys_largest_first.length; i++) {
            const key = si_derived_keys_largest_first[i]
            const derived_unit = si_derived[key]

            let indx
            while ((indx = units.indexOf(key)) >= 0) {
                units = units.substring(0, indx) + units.substring(indx + key.length);

                result = mergeUnits(result, derived_unit)
            }
        }

        if (units.length > 0) {
            // Split the remaining units into single characters
            let add_units: UnitList = new LuaMap()
            for (let i = 0; i < units.length; i++) {
                const key = units.charAt(i)
                add_units.set(key, (add_units.get(key) ?? 0) + 1)
            }
            result = mergeUnits(result, {exp: 0, units: add_units})
        }
        return result
    }

    function DotProdUnits(a: UnitList, b: UnitList) {
        let res: number = 0
        for (const key in a) {
            const a_val = a.get(key)
            const b_val = b.get(key)
            if (b_val != undefined && a_val != undefined) res += a_val * b_val
        }
        return res
    }

    export function BaseUnitsToDerived(si_units: Units): Units {
        let best_match = undefined
        let best_dot = 0
        let best_dot_abs = 0
        const len_si_sq = DotProdUnits(si_units.units, si_units.units)
        const len_si = Math.sqrt(len_si_sq)
        if (len_si_sq == 0) return {exp: si_units.exp, units: {...si_units.units}}

        for (let key in si_derived) {
            const derived_unit = si_derived[key]
            const len_derived = Math.sqrt(DotProdUnits(derived_unit.units, derived_unit.units))

            const dot = DotProdUnits(derived_unit.units, si_units.units) / (len_derived * len_si)

            if (Math.abs(dot) > best_dot_abs) {
                best_match = key
                best_dot = dot
                best_dot_abs = Math.abs(dot)

                if (dot == 1) break;
            }
        }

        let res_units: Units = {exp: si_units.exp, units: {...si_units.units}}

        if (best_match == undefined) return res_units
        const derived_unit = si_derived[best_match]



        let sign: 1 | -1 = best_dot > 0 ? -1 : 1
        let tmp = mergeUnits(si_units, derived_unit, sign)
        let cur_len_sq = DotProdUnits(tmp.units, tmp.units)
        let last_len_sq = len_si_sq
        let num_iter = 0
        while(cur_len_sq < last_len_sq) {
            num_iter -= sign
            res_units = tmp
            last_len_sq = cur_len_sq

            tmp = mergeUnits(tmp, derived_unit, sign)
            cur_len_sq = DotProdUnits(tmp.units, tmp.units)
        }

        res_units.units.set(best_match, num_iter)
        return res_units
    }

    export function mergeUnits(a: Units, b: Units, sig?: 1 | -1): Units {
        sig = sig ?? 1
        let result: Units = {exp: a.exp, units: {...a.units}}
        result.exp += sig * b.exp

        const bunits = b.units
        const runits = result.units
        for (let [u, exp] of bunits) {
            let sum = (runits.get(u) ?? 0) + sig * exp
            if (sum == 0) runits.delete(u)
            else runits.set(u, sum)
        }

        return result
    }

    export function CompareUnits(a: Units, b: Units): boolean {
        const a_keys = Object.keys(a.units)
        const b_keys = Object.keys(b.units)

        if (a_keys.length != b_keys.length) return false

        for (let key of a_keys) {
            if (a.units.get(key) != b.units.get(key)) return false
        }
        return true
    }

    export function Format(value: number, si_units: Units, si_prefix_no_unit?: boolean) {
        si_prefix_no_unit = si_prefix_no_unit ?? false
        let derived_units = BaseUnitsToDerived(si_units)

        let unit = ""
        let exp = derived_units.exp

        // may negate the exp variable
        if (Object.keys(derived_units.units).length != 0) {
            let nom = []
            let denom = []

            const d_units = derived_units.units
            for (let [key, exp] of d_units) {
                if (exp < 0) continue

                let u_format
                if (exp > 1) u_format = `${key}^${exp}`
                else if (exp == 1) u_format = key

                if (u_format != undefined) {
                    if (si_derived[key] != undefined) nom.unshift(u_format)
                    else nom.push(u_format)
                }

                d_units.delete(key)
            }

            for (let [key, exp] of d_units) {
                let u_format
                if (nom.length != 0) {
                    if (exp < -1) u_format = `${key}^${-exp}`
                    else if (exp == -1) u_format = key
                } else {
                    u_format = `${key}^${exp}`
                }

                if (u_format != undefined) {
                    if (si_derived[key] != undefined) denom.unshift(u_format)
                    else denom.push(u_format)
                }
            }

            unit = nom.join("*")
            if (denom.length != 0) {
                if (unit.length != 0) unit += "/"
                else exp = -exp

                if (denom.length > 1) unit += "(" + denom.join("*") + ")"
                else unit += denom.join("*")
            }
        }

        let rem = exp
        let si_prefix = ""
        if (si_prefix_no_unit || unit.length != 0) {
            let si_indx = si_exp.length - 1
            for (let i = 0; i < si_exp.length; i++) {
                if (exp >= si_exp[i]) {
                    si_indx = i;
                    break;
                }
            }
            rem -= si_exp[si_indx]
            si_prefix = si_str[si_indx]
        }
        let val_str = `${value * Math.pow(10, rem)}`

        if (unit == "") {
            return val_str + si_prefix
        } else {
            return val_str + " " + si_prefix + unit
        }
    }
}
function factorial (n: number): number {
    if (n === 0 || n === 1) {
        return 1;
    }

    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}


// Represents
// value * 10^exponent * (...nominator) / (...denominator)
// Ex. 10J = 10 * 10^3 * (g * m * m) / (s * s)
export default class Quantity {
    significand: number

    si_units: SI.Units

    // constructor(val: number, units: string)
    // constructor(val: number)
    constructor(val: number, si_units?: SI.Units) {
        this.significand = val ?? 0
        this.si_units = si_units ?? {exp: 0, units: new LuaMap}

        this.reduce();
    }

    static fromNumber(val: number): Quantity {
        console.log(`From number: ${val}`)
        return new Quantity(val)
    }

    static fromNumberWithUnit(val: number, unit: string): Quantity {
        if (unit.length == 0) return Quantity.fromNumber(val)
        console.log(`From number with unit: ${val} "${unit}"`)

        let exp
        if (unit.length > 1) {
            exp = SI.PrefixToExp(unit.charAt(0))
            if (exp != undefined) unit = unit.substring(1)
        }
        const si_units = SI.DerivedToBaseUnits(unit)
        si_units.exp += exp ?? 0
        return new Quantity(val, si_units)
    }

    static fromUnit(unit: string): Quantity {
        console.log(`From unit: "${unit}"`)
        return new Quantity(1,  SI.DerivedToBaseUnits(unit))
    }

    reduce() {
        const units = this.si_units.units
        for (let [key, exp] of units) {
            if (exp === 0) units.delete(key)
        }

        let decimals = Math.floor(Math.log10(this.significand));
        this.significand /= Math.pow(10, decimals)
        this.si_units.exp += decimals
    }

    prettyPrint(si_prefix_no_unit?: boolean): string {
        return SI.Format(this.significand, this.si_units, si_prefix_no_unit)
    }

    getValue(): number {
        return this.significand * Math.pow(10, this.si_units.exp)
    }

    add(other: Quantity): Quantity {
        console.log(`${this.prettyPrint()} + ${other.prettyPrint()}`)
        if (!SI.CompareUnits(this.si_units, other.si_units)) throw Error("Cannot add values with different units")

        return new Quantity(this.getValue() + other.getValue(), this.si_units);
    }

    sub(other: Quantity): Quantity {
        console.log(`${this.prettyPrint()} - ${other.prettyPrint()}`)
        if (!SI.CompareUnits(this.si_units, other.si_units)) throw Error("Cannot subtract values with different units")

        return new Quantity(this.getValue() - other.getValue(), this.si_units);
    }

    mul(other: Quantity | number): Quantity {
        if (typeof other == "number") {
            console.log(`${this.prettyPrint()} * ${other}`)
            return new Quantity(this.significand * other, this.si_units)
        } else {
            console.log(`${this.prettyPrint()} * ${other.prettyPrint()}`)
            return new Quantity(this.significand * other.significand, SI.mergeUnits(this.si_units, other.si_units));
        }
    }

    div(other: Quantity): Quantity {
        console.log(`${this.prettyPrint()} / ${other.prettyPrint()}`)
        return new Quantity(this.significand / other.significand, SI.mergeUnits(this.si_units, other.si_units, -1));
    }

    pow(other: Quantity): Quantity {
        console.log(`${this.prettyPrint()} ^ ${other.prettyPrint()}`)
        if (Object.keys(other.si_units.units).length !== 0) throw Error("Exponentiation with a value that has units is unsupported!")

        const other_val = other.getValue()

        const res_units: SI.UnitList = {...this.si_units.units}
        for(let [key, exp] of res_units) {
            res_units.set(key, exp * other_val)
        }

        return new Quantity(Math.pow(this.getValue(), other_val), {exp: 0, units: res_units})
    }

    mod(other: Quantity): Quantity {
        console.log(`${this.prettyPrint()} % ${other.prettyPrint()}`)
        if (Object.keys(other.si_units.units).length !== 0) throw Error("Modulo with a value that has units is unsupported!")

        return new Quantity(this.getValue() % other.getValue(), {exp: 0, units: {...this.si_units.units}})
    }

    factorial(): Quantity {
        console.log(`${this.prettyPrint()}!`)
        if (Object.keys(this.si_units.units).length !== 0) throw Error("Factorial with a value that has units is unsupported!")

        return new Quantity(factorial(this.getValue()))
    }

    toString(): string {
        return this.prettyPrint()
    }
}