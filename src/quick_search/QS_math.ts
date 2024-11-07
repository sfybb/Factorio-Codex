import {evaluateExpression} from "./parser";
import Quantity from "./Quantity";

namespace QSMath {
    export function calculateString(expression: string): LuaMultiReturn<[true, Quantity]> | LuaMultiReturn<[false, string]> {
        let res: Quantity | undefined = undefined
        let err: string = ""

        let [i, ..._] =  string.find(expression, "%d")
        if (i != undefined) {
            try {
                res = evaluateExpression(expression)
            } catch (exception: any) {
                let stack = exception?.stack ?? debug.traceback()
                if (exception.message != undefined) {
                    $log_info!(`${exception.message}\n${stack}`)
                } else {
                    $log_info!(`Parsing exception: ${serpent.line(exception)}`)
                }
                res = undefined
                err = stack != undefined ? `Error: ${exception.message ?? "Parsing exception"}\n${stack}` : exception.message ?? "Parsing exception"
            }
        }
        $log_info!(`${err}`)
        if (res != undefined) {
            $log_info!(`${res.prettyPrint()} ${serpent.line(res)}`)
            return $multi(true as true, res)
        } else {
            return $multi(false as false, err)
        }
    }
}

export default QSMath