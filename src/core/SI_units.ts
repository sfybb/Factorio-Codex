import FibonacciHeap from "./FibonacciHeap";

namespace SI {
    type Vector = number[];
    type Matrix = Vector[];

    export type UnitList = LuaMap<string, number>

    export type Units = {
        exp: number,
        units: UnitList
    }

    function makeUnit(exp: number, units?: {[unit: string]: number}): Units {
        let res = new LuaMap<string, number>()
        if (units) {
            for (const [key, val] of Object.entries(units)) {
                res.set(key, val)
            }
        }
        return {exp, units: res}
    }

    export const superscript_num = ["\u{2070}", "\u{B9}", "\u{B2}", "\u{B3}", "\u{2074}", "\u{2075}", "\u{2076}", "\u{2077}", "\u{2078}", "\u{2079}"]

    const si_prefixes: { [prefix: string]: number } = {
        T: 12,
        G: 9,
        M: 6,
        k: 3
    }

    // List of derived SI-units and their representation in SI base units
    // Some multi-letter unit SI base units may also appear in that list
    export const si_derived: { [dunit: string]: Units } = {
        //Hz: makeUnit( 0, {s: -1}),                       // Hertz	 s^−1
        N:  makeUnit( 3, {g:  1, m:  1, s: -2}),         // Newton  kg⋅m⋅s^−2
        Pa: makeUnit( 3, {g:  1, m: -1, s: -2}),         // Pascal  kg⋅m^−1⋅s^−2
        J:  makeUnit( 3, {g:  1, m:  2, s: -2}),         // Joule   kg⋅m^2⋅s^−2
        W:  makeUnit( 3, {g:  1, m:  2, s: -3}),         // Watt    kg⋅m^2⋅s^−3
        C:  makeUnit( 0, {              s:  1, A:  1}),  // Coulomb s⋅A
        V:  makeUnit( 3, {g:  1, m:  2, s: -3, A: -1}),  // Volt    kg⋅m^2⋅s^−3⋅A^−1
        F:  makeUnit(-3, {g: -1, m: -2, s:  4, A:  2}),  // Farad   kg^−1⋅m^−2⋅s^4⋅A^2
        "Ω": makeUnit( 3, {g:  1, m:  2, s: -3, A: -2}),  // Ohm     kg⋅m^2⋅s^−3⋅A^−2
        S:  makeUnit(-3, {g: -1, m: -2, s: -3, A:  2}),  // Siemens kg^−1⋅m^−2⋅s^3⋅A^2
        Wb: makeUnit( 3, {g:  1, m:  2, s: -2, A: -1}),  // Weber   kg⋅m^2⋅s^−2⋅A^−1
        T:  makeUnit( 3, {g:  1,        s: -2, A: -1}),  // Tesla   kg⋅s−2⋅A−1
        H:  makeUnit( 3, {g:  1, m:  2, s: -2, A: -2}),  // Henry   kg⋅m^2⋅s^−2⋅A^−2
        /*        lm: makeUnit( 0, {cd: 1}),                       // Lumen   cd
                lx: makeUnit( 0, {cd: 1, m: -2}),                // Lux     cd⋅m^−2

                // Not derived but for since it's a multi-letter unit
                cd: makeUnit( 0, {cd: 1}),*/
    }
    const si_derived_keys_largest_first = Object.keys(si_derived).sort((a, b) => b.length - a.length)

    export function PrefixToExp(si: string): number | undefined {
        return si_prefixes[si]
    }

    export function ParseUnits(units: string): Units[] {
        let result: Units[] = []

        while(units.length > 0) {
            let found_unit = false
            for (let i = 0; i < si_derived_keys_largest_first.length; i++) {
                const key = si_derived_keys_largest_first[i]
                const derived_unit = si_derived[key]

                if (units.startsWith(key)) {
                    result.push(derived_unit)
                    units = units.substring(key.length)
                    found_unit = true
                    break
                }
            }

            if (!found_unit) {
                let prefix = si_prefixes[units[0]]
                if (prefix != undefined) result.push(makeUnit(prefix))
                else result.push(makeUnit(0, {[units[0]]: 1}))
            }
        }

        return result
    }

    export function DerivedToBaseUnits(units: string): Units {
        let result: Units = makeUnit(0)
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
        for (const [key, a_val] of a) {
            const b_val = b.get(key)
            if (b_val != undefined && a_val != undefined) res += a_val * b_val
        }
        return res
    }

    function SubtractVectors(a: UnitList, b: UnitList, scale: number = 1): UnitList {
        let result: UnitList = new LuaMap<string, number>();
        let tmp: number = 0
        for (const [unit, exp] of b) {
            tmp = (a.get(unit) || 0) - exp * scale
            if (tmp != 0) result.set(unit, tmp);
        }
        return result;
    }

    function VectorLengthSq(v: UnitList, exp: number = 2): number {
        let res: number = 0
        for (const [_, val] of v) {
            res += Math.pow(Math.abs(val), exp)
        }
        return res
    }

    export function BaseUnitsToDerived(target: Units, beam_width: number = 5): Units {
        type State = { units: UnitList, exp: number, steps: LuaMap<string, number>, lengthSq: number}
        const distance_exp: number = 0.5

        let target_units: UnitList = new LuaMap<string, number>()
        for (const [k,v] of target.units) target_units.set(k, v)

        $log_debug!(`Running beam search. width: ${beam_width} target: ${serpent.line(target)}`)
        let pq = new FibonacciHeap<State>();
        let initialState: State = { units: target_units, exp: target.exp, steps: new LuaMap<string, number>(), lengthSq: VectorLengthSq(target.units, distance_exp) };
        pq.insert(initialState.lengthSq, initialState);

        let best_solution: State = initialState;
        let visited = new LuaSet<string>();

        // Loop variables
        let queue: State[] = [], stateKey: string = "", dot: number = 0, scale: number = 0;
        let new_units: UnitList = new LuaMap<string, number>(), new_steps: LuaMap<string, number> = new LuaMap();
        let new_lengthSq: number = Infinity, new_state: State = initialState;

        while (!pq.isEmpty()) {
            $log_debug!(`Keeping ${Math.min(beam_width, pq.size())}/${pq.size()} states`)
            queue = [];
            for (let i = 0; i < beam_width && !pq.isEmpty(); i++) {
                let top = pq.deleteMin()
                if (top != undefined) queue.push(top.value);
            }
            pq.clear()

            for (const state of queue) {
                stateKey = serpent.line(state.units);
                if (visited.has(stateKey)) continue;
                visited.add(stateKey);

                for (const [name, derived] of Object.entries(si_derived)) {
                    dot = DotProdUnits(state.units, derived.units);
                    if (dot === 0) continue;

                    scale = Math.round(dot / DotProdUnits(derived.units, derived.units));
					if (scale === 0) continue;
					
                    new_units = SubtractVectors(state.units, derived.units, scale);

                    new_steps = new LuaMap();
                    for (const [k, v] of state.steps) new_steps.set(k, v);
                    new_steps.set(name, (new_steps.get(name) || 0) + scale);

                    new_lengthSq = VectorLengthSq(new_units, distance_exp) + VectorLengthSq(new_steps, distance_exp);
                    new_state = { units: new_units, exp: state.exp - derived.exp * scale, steps: new_steps, lengthSq: new_lengthSq };

                    if (new_lengthSq < best_solution.lengthSq) {
                        $log_debug!(`New global optimum found ${serpent.line(new_state)}`)
                        best_solution = new_state;
                    }

                    pq.insert(new_state.lengthSq, new_state);
                }
            }
        }

        let best_unit_solution: Units = {
            exp: best_solution.exp,
            units: best_solution.units
        }

        let sum: number
        for (const [k,v] of best_solution.steps) {
            sum = (best_unit_solution.units.get(k) ?? 0) + v
            if (sum == 0) best_unit_solution.units.delete(k)
            else  best_unit_solution.units.set(k, sum);
        }
        return best_unit_solution;
    }

    export function mergeUnits(a: Units, b: Units, sig?: 1 | -1): Units {
        sig = sig ?? 1
        let result: Units = {exp: a.exp, units: new LuaMap<string, number>()}
        for (let [key, val] of a.units) {
            result.units.set(key, val)
        }

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
        if (table_size(a.units) != table_size(b.units)) return false

        for (let key of Object.keys(a.units)) {
            if (a.units.get(key) != b.units.get(key)) return false
        }
        return true
    }

    // format the unit in "W days + X hours + Y min + Z s"
    function FormatTime(value: number, si_units: Units) {
        // Only 's' unit is present
        let seconds = value * Math.pow(10, si_units.exp)
        let days = Math.floor(seconds / 86400)
        let hours = Math.floor((seconds & 86400) / 3600)
        let minutes = Math.floor((seconds % 3600) / 60)
        seconds = seconds % 60

        let res: string[] = []
        if (days != 0) res.push(`${days} days`)
        if (hours != 0) res.push(`${hours} hours`)
        if (minutes != 0) res.push(`${minutes} min`)
        if (seconds != 0) res.push(`${seconds} s`)

        return res.join(" + ")
    }

    function FormatUnits(valueUnits: Units): LuaMultiReturn<[string, boolean]> {
        let nom = []
        let denom = []

        const v_units = valueUnits.units
        for (let [key, exp] of v_units) {
            if (exp < 0) continue

            let u_format
            if (exp > 9) u_format = `${key}^${exp}`
            else if (exp > 1) u_format = key + superscript_num[exp]
            else if (exp == 1) u_format = key

            if (u_format != undefined) {
                if (si_derived[key] != undefined) nom.unshift(u_format)
                else nom.push(u_format)
            }

            v_units.delete(key)
        }

        for (let [key, exp] of v_units) {
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

        let negateExp = false
        let unit = nom.join("*")
        if (denom.length != 0) {
            if (unit.length != 0) unit += "/"
            else negateExp = true

            if (denom.length > 1) unit += "(" + denom.join("*") + ")"
            else unit += denom.join("*")
        }
        return $multi(unit, negateExp)
    }

    export function Format(value: number, si_units: Units, si_prefix_no_unit?: boolean) {
        si_prefix_no_unit = si_prefix_no_unit ?? true

        // If this is a pure time based unit (only seconds) and its exponent is 1 format it in "X hours + Y min + Z s"
        if (si_units.units.get('s') == 1 && table_size(si_units.units)) {
            $log_debug!(`Using time formatting for "${serpent.line(value)}"`)
            return FormatTime(value, si_units)
        }
        let valueUnits = BaseUnitsToDerived(si_units)
        $log_debug!(`Using default formatting for improved representation "${serpent.line(valueUnits)}" (original ${serpent.line(si_units)})`)

        let unit = ""
        let exp = valueUnits.exp
        // may negate the exp variable
        let num_derived_units = table_size(valueUnits.units)


        if (num_derived_units != 0) {
            let [u, negateExp] = FormatUnits(valueUnits)
            if (negateExp) exp = -exp
            unit = u
        }

        // Normalize value
        let decimals = Math.floor(Math.log10(Math.abs(value)))
        value = value / Math.pow(10, decimals)
        exp += decimals

        let rem = exp
        let si_prefix = ""
        // if there are no units respect `si_prefix_no_unit` otherwise don't add si prefix for time (seconds)
        if (si_prefix_no_unit || unit.length != 0) {
            const sorted_prefixes = Object.entries(si_prefixes).sort((a, b) => b[1] - a[1])
            for (let [si_str, si_exp] of sorted_prefixes) {
                if (exp >= si_exp) {
                    rem -= si_exp
                    si_prefix = si_str
                    break;
                }
            }
        }
        let val_str = `${value * Math.pow(10, rem)}`

        if (unit == "") {
            return val_str + si_prefix
        } else {
            return val_str + " " + si_prefix + unit
        }
    }
}

export default SI