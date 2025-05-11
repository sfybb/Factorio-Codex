import {PlayerIndex} from "factorio:runtime";
import {evaluateExpression} from "./mathParser";
import Quantity from "./Quantity";
import {QSModule, QSResult, QSResultBase} from "./QuickSearch";


export interface QSMathResultSuccess extends Omit<QSResultBase, 'value'> {
    readonly type: "math";

    formula: string;
    error: false;
    result: Quantity;

    value: string;
}

export interface QSMathResultFailure extends Omit<QSResultBase, 'value'> {
    readonly type: "math";

    formula: string;
    error: true;
    execption: string;

    value: string;
}

export type QSMathResult = QSMathResultSuccess | QSMathResultFailure;

class QSMath implements QSModule {
    readonly id = "math";
    readonly order = "a";
    readonly async = false;

    apply_prompt(prompt: string, player: PlayerIndex): QSResult[] {
        let res: Quantity | undefined = undefined
        let err: string = ""

        let [i, ..._] =  string.find(prompt, "%d")
        if (i != undefined) {
            try {
                res = evaluateExpression(prompt)
            } catch (exception: any) {
                let stack = exception?.stack ?? debug.traceback()
                if (exception.message != undefined) {
                    $log_debug!(`${exception.message}\n${stack}`)
                } else {
                    $log_debug!(`Parsing exception: ${serpent.line(exception)}`)
                }
                res = undefined
                err = stack != undefined ? `Error: ${exception.message ?? "Parsing exception"}\n${stack}` : exception.message ?? "Parsing exception"
            }

            $log_debug!(`${err}`)
            if (res != undefined) {
                $log_debug!(`${res.prettyPrint()} ${serpent.line(res)}`)

                return [{
                    type: "math",
                    formula: prompt,
                    error: false,
                    result: res,
                    text: res.toString()
                } as QSMathResult];
            } else {
                return [{
                    type: "math",
                    formula: prompt,
                    error: true,
                    execption: err,
                    text: "=?"
                } as QSMathResult];
            }
        } else {
            return [];
        }
    }

    on_selected(item: QSResult, player: PlayerIndex): string | undefined {
        if (item.type != "math") return undefined;

        const res = item as QSMathResult;
        if (res.error) return undefined;
        else return res.text as string;
    }
}

export default QSMath