import {parse} from "./math"
import Quantity from "./Quantity";

// Math calculator adapted from https://gist.github.com/Noble-Mushtak/a2eb302003891c85b562
namespace QSMath {
    function getNumber(str: string): LuaMultiReturn<[undefined | number, string]> {
        let [num, rem] = string.match(str, "^([%d%.]+)([%s%S]*)")
        if ( num == undefined ) return $multi(undefined, rem)
        return $multi(Number(num), rem)
    }

    export function calculateString(expression: string, expectEndParentheses?: boolean): LuaMultiReturn<[undefined | Quantity, string]> {
        try {
            $log_info!(`Parsing "${expression}"`)
            let res = parse(expression)
            $log_info!(`${serpent.line(res)}`)
           return $multi(parse(expression), "")
        } catch (err: any) {
            let stack = err?.stack ?? debug.traceback()
            if (err.message != undefined) {
                $log_info!(`${err.message}\n${stack}`)
            } else {
                $log_info!(`Parsing exception: ${serpent.line(err)}`)
            }
            return $multi(undefined, "")
        }
    }
}

export default QSMath