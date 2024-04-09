import {default as Util, validate_print_info, validate_status} from "Util";

interface VerifyinfoBase {
    readonly type: "string" | "number" | "object" | "boolean" | "function" | "array"| "Verifiable",
    readonly field: string,

    optional?: boolean
}

interface VerifyinfoArray extends VerifyinfoBase {
    type: "array",

    content?: Verifyinfo,
    value?: never
}

interface VerifyinfoObject extends VerifyinfoBase {
    type: "object",

    content?: Verifyinfo[],
    value?: never
}

interface VerifyinfoString extends VerifyinfoBase {
    readonly type: "string",
    readonly field: string,

    value?: string
    content?: never,
}

interface VerifyinfoNumber extends VerifyinfoBase {
    readonly type: "number",
    readonly field: string,

    value?: number
    content?: never,
}

interface VerifyinfoBoolean extends VerifyinfoBase {
    readonly type: "boolean",
    readonly field: string,

    value?: boolean
    content?: never,
}

interface VerifyinfoFunction extends VerifyinfoBase {
    readonly type: "function",
    readonly field: string,

    value?: Function
    content?: never,
}

interface VerifyinfoVerifiable extends VerifyinfoBase {
    readonly type: "Verifiable",
    readonly field: string,

    value?: object,
    content?: never,
}


export type Verifyinfo =
    | VerifyinfoArray
    | VerifyinfoObject
    | VerifyinfoString
    | VerifyinfoNumber
    | VerifyinfoBoolean
    | VerifyinfoFunction
    | VerifyinfoVerifiable


export interface Verifiable {
    get_verify_info(args?: any): Verifyinfo[];
}

function verify<T extends Verifiable>(obj: T, print_info?: validate_print_info, args?: any): validate_status {
    let infoList = obj.get_verify_info(args)

    if (print_info == undefined) {
        print_info = {
            width: 40,
            indent_step: "    ", // 4 spaces
            current_indent: "", // start - no ident
        }
    }

    return verify_internal(obj, infoList, print_info, args)
}

export function verifyObject(obj: any, infoList: Verifyinfo[], args?: any): validate_status {
    const print_info: validate_print_info = {
        width: 40,
        indent_step: "    ", // 4 spaces
        current_indent: "", // start - no ident
    }

    return verify_internal(obj, infoList, print_info, args)
}

function do_verify(element: any | undefined, info: Verifyinfo, pi_next: validate_print_info, args: any): validate_status {
    let type = typeof element
    let status: validate_status

    //$log_debug!(`${info.field}: ${info.type};; ${serpent.line(element, {maxlevel: 1, comment: false})}`)

    if (info.type == "Verifiable") {
        let verifiableObj = element as Verifiable
        if (type == "object" && !Array.isArray(element) && typeof verifiableObj.get_verify_info == "function") {
            status = verify_internal(verifiableObj, verifiableObj.get_verify_info(args), pi_next, args)
        } else {
            status = validate_status.ERROR
        }
    } else if (info.type == "object") {
        if (type == "object" /*&& !Array.isArray(element)*/) {
            if (info.content != undefined) {
                status = verify_internal(element, info.content, pi_next, args)
            } else {
                status = validate_status.OK
            }
        } else {
            status = validate_status.ERROR
        }
    } else if (info.type == "array") {
        if (Array.isArray(element)) {
            if (info.content != undefined) {
                status = verify_internal_array(element as any[], info.content, pi_next, args)
            } else {
                status = validate_status.OK
            }
        } else {
            status = validate_status.ERROR
        }
    } else if (info.type == type && (info.value == undefined || info.value == element)) {
        status = validate_status.OK
    } else {
        status = validate_status.ERROR
    }

    if (type == "undefined" && info.optional == true) {
        status = validate_status.OK
    }

    if (status != validate_status.OK) {
        $log_debug!(`${info.field}: ${info.type};; ${serpent.line(element, {maxlevel: 1, comment: false})}`)
    }

    return status
}

function verify_internal<T extends Verifiable>(obj: T, infoList: Verifyinfo[], pi: validate_print_info, args: any): validate_status {
    let overallStatus: validate_status = validate_status.OK

    let pi_next: validate_print_info = {
        ...pi,
        current_indent: pi.current_indent + pi.indent_step,
    }

    for (let info of infoList) {
        // @ts-ignore
        let field_value = obj[info.field]

        let status = do_verify(field_value, info, pi_next, args)

        if (status != validate_status.OK && info.value != undefined && info.value != field_value) {
            // @ts-ignore
            obj[info.field] = info.value
            status = validate_status.FIXED
        }

        $log_debug!(Util.format_validate_msg(pi, info.field, status))
        if (status > overallStatus) overallStatus = status

        // $log_err!(`Expected field ${info.field} to have type ${info.type}${info.optional ? " (optional)" : ""
        //                 } but has type ${type}`)
    }

    return overallStatus
}

function verify_internal_array(arr: any[], info: Verifyinfo, pi: validate_print_info, args: any): validate_status {
    let overallStatus: validate_status = validate_status.OK

    let pi_next: validate_print_info = {
        ...pi,
        current_indent: pi.current_indent + pi.indent_step,
    }

    for (let [i, arrEle] of arr.entries()) {
        let type = typeof arrEle

        let status = do_verify(arrEle, info, pi_next, args)

        if (status != validate_status.OK && info.value != undefined && info.value != arrEle) {
            arr[i] = info.value
            status = validate_status.FIXED
        }

        $log_debug!(Util.format_validate_msg(pi, `[${i}]`, status))
        if (status > overallStatus) overallStatus = status
    }

    return overallStatus
}


export default verify