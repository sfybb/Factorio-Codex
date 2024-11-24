import SI from "./SI_units"

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
        $log_trace!(`From number: ${val}`)
        return new Quantity(val)
    }

    static fromNumberWithUnit(val: number, unit: string): Quantity {
    /*
    static fromCompositeNumber(composite: string): Quantity {
        let components: Array<number | string> = []
        for(const [w,] of string.gmatch(composite, "%a+|[%d%.]+")) {
            components.push(tonumber(w) ?? w)
        }

        let val = 0, unit: string = "";
        if (components.length < 2) return Quantity.fromNumber(val)

        if (typeof components[0] === "number") val = components[0]
        if (typeof components[1] === "string") unit = components[1]
     */
        if (unit.length == 0) return Quantity.fromNumber(val)
        $log_trace!(`From number with unit: ${val} "${unit}"`)

        let exp
        /*//*/if (unit.length > 1) {
            exp = SI.PrefixToExp(unit.charAt(0))
            if (exp != undefined) unit = unit.substring(1)
        /*//*/}
        const si_units = SI.DerivedToBaseUnits(unit)
        si_units.exp += exp ?? 0
        return new Quantity(val, si_units)
    }

    static fromUnit(unit: string): Quantity {
        $log_trace!(`From unit: "${unit}"`)
        let exp
        if (unit.length >= 1) {
            exp = SI.PrefixToExp(unit.charAt(0))
            if (exp != undefined) unit = unit.substring(1)
        }
        const si_units = SI.DerivedToBaseUnits(unit)

        si_units.exp += exp ?? 0
        return new Quantity(1,  si_units)
    }

    reduce() {
        const units = this.si_units.units
        for (let [key, exp] of units) {
            if (exp === 0) units.delete(key)
        }

        let decimals = Math.floor(Math.log10(Math.abs(this.significand)));
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
        $log_debug!(`${this.prettyPrint()} + ${other.prettyPrint()}`)
        if (!SI.CompareUnits(this.si_units, other.si_units)) throw Error("Cannot add values with different units")

        let new_units: SI.Units = {
            exp: 0,
            units: this.si_units.units
        }

        return new Quantity(this.getValue() + other.getValue(), new_units);
    }

    sub(other: Quantity): Quantity {
        $log_debug!(`${this.prettyPrint()} - ${other.prettyPrint()}`)
        if (!SI.CompareUnits(this.si_units, other.si_units)) throw Error("Cannot subtract values with different units")

        let new_units: SI.Units = {
            exp: 0,
            units: this.si_units.units
        }

        return new Quantity(this.getValue() - other.getValue(), new_units);
    }

    mul(other: Quantity | number): Quantity {
        if (typeof other == "number") {
            $log_debug!(`${this.prettyPrint()} * ${other}`)
            return new Quantity(this.significand * other, this.si_units)
        } else {
            $log_debug!(`${this.prettyPrint()} * ${other.prettyPrint()}`)
            return new Quantity(this.significand * other.significand, SI.mergeUnits(this.si_units, other.si_units));
        }
    }

    div(other: Quantity): Quantity {
        $log_debug!(`${this.prettyPrint()} / ${other.prettyPrint()}`)
        return new Quantity(this.significand / other.significand, SI.mergeUnits(this.si_units, other.si_units, -1));
    }

    pow(other: Quantity): Quantity {
        $log_debug!(`${this.prettyPrint()} ^ ${other.prettyPrint()}`)
        if (table_size(other.si_units.units) !== 0) throw Error("Exponentiation with a value that has units is unsupported!")

        const other_val = other.getValue()

        const res_units: SI.UnitList = new LuaMap<string, number>()
        for(let [key, exp] of this.si_units.units) {
            res_units.set(key, exp * other_val)
        }

        return new Quantity(Math.pow(this.getValue(), other_val), {exp: 0, units: res_units})
    }

    mod(other: Quantity): Quantity {
        $log_debug!(`${this.prettyPrint()} % ${other.prettyPrint()}`)
        if (table_size(other.si_units.units) !== 0) throw Error("Modulo with a value that has units is unsupported!")

        return new Quantity(this.getValue() % other.getValue(), {exp: 0, units: {...this.si_units.units}})
    }

    factorial(): Quantity {
        $log_debug!(`${this.prettyPrint()}!`)
        if (table_size(this.si_units.units) !== 0) throw Error("Factorial with a value that has units is unsupported!")

        return new Quantity(factorial(this.getValue()))
    }

    toString(): string {
        return this.prettyPrint()
    }
}