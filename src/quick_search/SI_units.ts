namespace SI {
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
        Hz: makeUnit( 0, {s: -1}),                       // Hertz	 s^−1
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
        for (const [key, _] of a) {
            const a_val = a.get(key)
            const b_val = b.get(key)
            if (b_val != undefined && a_val != undefined) res += a_val * b_val
        }
        return res
    }

    function BaseUnitsToDerived(si_units: Units, blacklisted_units?: LuaSet<string>): Units {
        blacklisted_units = blacklisted_units ?? new LuaSet<string>()
        let best_match = undefined
        let best_dot = 0
        let best_dot_abs = 0
        const len_si_sq = DotProdUnits(si_units.units, si_units.units)
        const len_si = Math.sqrt(len_si_sq)

        let unit_copy = {exp: si_units.exp, units: new LuaMap<string, number>()}
        for (let [key, val] of si_units.units) {
            unit_copy.units.set(key, val)
        }

        if (len_si_sq == 0) return unit_copy

        for (let [key, derived_unit] of Object.entries(si_derived)) {
            if (blacklisted_units.has(key)) continue
            const len_derived = Math.sqrt(DotProdUnits(derived_unit.units, derived_unit.units))

            const dot = DotProdUnits(derived_unit.units, si_units.units) / (len_derived * len_si)

            if (Math.abs(dot) > best_dot_abs) {
                best_match = key
                best_dot = dot
                best_dot_abs = Math.abs(dot)

                if (dot == 1) break;
            }
        }

        let res_units: Units = unit_copy
        let num_units = table_size(si_units.units)

        if (best_match == undefined || (best_dot == -1.0 && num_units == 1)) return res_units
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
        blacklisted_units.add(best_match)

        // Only allow one base unit to be present in the result
        // because "1m^100*s^100" produces an abomination of derived units
        return res_units
        /*
        let num_base_units = 0
        for (let [key, derived_unit] of Object.entries(res_units.units)) {
            if (derived_unit != 0 && (key == "cd" || si_derived[key] == undefined)) num_base_units++;
        }

        return num_base_units > 0 ? BaseUnitsToDerived(res_units, blacklisted_units) : res_units*/
    }

    function OptimalBaseUnitsToDerived(si_units: Units): Units {
        const maxOptions = 200 // If more than 200 optons can be explored stop at 200
        let numExploredOptions = 0
        const len_si_sq = DotProdUnits(si_units.units, si_units.units);
        const len_si = Math.sqrt(len_si_sq);

        let unit_copy = {exp: si_units.exp, units: new LuaMap<string, number>()}
        for (let [key, val] of si_units.units) {
            unit_copy.units.set(key, val)
        }

        if (len_si_sq === 0) return unit_copy;

        // Helper to calculate min_length based on unit exponents
        const calculateMinLength = (units: Units) => {
            let length = 0;

            let negative_exp_penalty = 0
            let has_positive_unit = false
            for (let [, exp] of units.units) {
                if (!(Math.abs(exp) > 0)) continue

                let exp_len = Math.ceil(Math.log10(Math.abs(exp)))

                if (exp < 0) negative_exp_penalty++
                else has_positive_unit = true

                length += 1 + exp_len;
            }
            return length + table_size(units.units) - 1 + (has_positive_unit ? 0 : negative_exp_penalty);
        };

        let best_match: Units = unit_copy;
        let min_length = calculateMinLength(best_match);

        // Queue for BFS
        let queue: Array<{ units: Units, derived: LuaSet<string>, length: number }> = [
            { units: best_match, derived: new LuaSet<string>(), length: min_length }
        ];

        const addStateToQueue = (derivedKey: string, newLength: number, mergedUnits: Units, derived: LuaSet<string>, sign: any, dot: any) => {
            $log_trace!(`Candidate ${derivedKey}^${mergedUnits.units.get(derivedKey)} has sign ${sign} (${dot}) length ${newLength} ${serpent.line(mergedUnits)}`)
            numExploredOptions++

            // Skip this state if its length is already too large
            if (newLength > min_length) return

            // Something went wrong dot is nan
            if (dot != dot) return;

            // Update best match if this state has a smaller length or best_match is still in the initial state
            if (newLength < min_length || best_match == unit_copy) {
                best_match = mergedUnits;
                min_length = newLength;
                // Remove states with bigger min length
                queue = queue.filter(s => s.length <= min_length);

                $log_trace!(`Found new result candidate "${derivedKey}" with min_len ${newLength} and units ${serpent.line(mergedUnits)} (num open candidates: ${queue.length})`)
            }

            // Add the new state to the queue for further exploration
            const newDerived = new LuaSet<string>();
            for (const key of derived) {
                newDerived.add(key)
            }

            newDerived.add(derivedKey);
            queue.push({ units: mergedUnits, derived: newDerived, length: newLength });
        }

        const visited = new LuaSet<UnitList>(); // Track visited states to avoid loops

        $log_trace!(`Starting BFS search with min_len ${min_length} and units ${serpent.line(best_match)}`)
        while (queue.length > 0) {
            if (numExploredOptions > maxOptions) {
                $log_info!(`Aborting search for optimal derived unit composition; state at exit: Open ${queue.length}; best match: ${serpent.line(best_match)}; min length: ${min_length}`)
                break
            }

            const { units, derived, } = queue.shift()!;

            // Convert the units map to a string representation for unique state tracking
            const stateKey = units.units;
            if (visited.has(stateKey)) continue;
            visited.add(stateKey);

            for (let [derivedKey, derivedUnit] of Object.entries(si_derived)) {
                // Calculate state where derived unit is used once
                const len_derived = Math.sqrt(DotProdUnits(derivedUnit.units, derivedUnit.units));
                const dot = DotProdUnits(derivedUnit.units, units.units) / (len_derived * len_si);
                const sign: 1 | -1 = dot > 0 ? -1 : 1

                // this derived unit is completely unrelated (no units in common with si_units)
                if (dot == 0) continue

                if (units.units.get(derivedKey) == undefined || Math.sign(units.units.get(derivedKey) ?? 0) == sign) {
                    let mergedUnits = mergeUnits(units, derivedUnit, sign);
                    mergedUnits.units.set(derivedKey, -sign + (mergedUnits.units.get(derivedKey) ?? 0))

                    addStateToQueue(derivedKey, calculateMinLength(mergedUnits), mergedUnits, derived, sign, dot)
                }

                // Calculate state where derived unit is used as much as possible
                if (units.units.get(derivedKey) == undefined) {
                    let tmp: Units = mergeUnits(units, derivedUnit, sign)
                    let cur_len_sq: number = DotProdUnits(tmp.units, tmp.units)
                    let last_len_sq: number = len_si_sq
                    let max_unit_usage: Units = tmp
                    let num_iter: number = 0
                    while (cur_len_sq < last_len_sq) {
                        num_iter -= sign
                        max_unit_usage = tmp
                        last_len_sq = cur_len_sq

                        tmp = mergeUnits(tmp, derivedUnit, sign)
                        cur_len_sq = DotProdUnits(tmp.units, tmp.units)
                    }
                    if (Math.abs(num_iter) > 1) {
                        max_unit_usage.units.set(derivedKey, num_iter)
                        addStateToQueue(derivedKey, calculateMinLength(max_unit_usage), max_unit_usage, derived, sign, dot)
                    }
                }
            }
        }

        return best_match;
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

    export function Format(value: number, si_units: Units, si_prefix_no_unit?: boolean) {
        si_prefix_no_unit = si_prefix_no_unit ?? true
        let derived_units = /*BaseUnitsToDerived(si_units)*/OptimalBaseUnitsToDerived(si_units)

        let unit = ""
        let exp = derived_units.exp

        // may negate the exp variable
        let num_derived_units = table_size(derived_units.units)
        if (num_derived_units != 0) {
            let nom = []
            let denom = []

            const d_units = derived_units.units
            for (let [key, exp] of d_units) {
                if (exp < 0) continue

                let u_format
                if (exp > 9) u_format = `${key}^${exp}`
                else if (exp > 1) u_format = key + superscript_num[exp]
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
        // if there are no units respect `si_prefix_no_unit` otherwise don't add si prefix for time (seconds)
        if ((si_prefix_no_unit || unit.length != 0) && (num_derived_units > 1 || derived_units.units.get('s') == undefined)) {
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