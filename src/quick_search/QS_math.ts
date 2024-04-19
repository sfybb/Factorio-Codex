import {parse} from "./math"
import Quantity from "./Quantity";

namespace QSMath {
    export function calculateString(expression: string, expectEndParentheses?: boolean): LuaMultiReturn<[true, Quantity]> | LuaMultiReturn<[false, string]> {
        let res: Quantity | undefined = undefined
        let err: string = ""

        let [i, ..._] =  string.find(expression, "%d")
        if (i != undefined) {
            try {
                $log_info!(`Parsing "${expression}"`)
                res = parse(expression)
            } catch (err: any) {
                let stack = err?.stack ?? debug.traceback()
                if (err.message != undefined) {
                    $log_info!(`${err.message}\n${stack}`)
                } else {
                    $log_info!(`Parsing exception: ${serpent.line(err)}`)
                }
                res = undefined
                err = err.message ?? "Parsing exception"
            }
        }
        if (res != undefined) {
            $log_info!(`${res.prettyPrint()} ${serpent.line(res)}`)
            return $multi(true as true, res)
        } else {
            return $multi(false as false, err)
        }
    }
}

export default QSMath