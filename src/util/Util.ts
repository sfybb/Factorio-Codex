interface validate_print_info {
    width: number,
    indent_step: string,
    current_indent: string
}

enum validate_status {
    OK,
    FIXED,
    FIXABLE,
    ERROR
}

const map = {
    [validate_status.OK]: "[OK]",
    [validate_status.FIXABLE]: "[FIXABLE]",
    [validate_status.FIXED]: "[FIXED]",
    [validate_status.ERROR]: "[ERROR]",
}


namespace Util {
    export function format_validate_msg(this: void, print_info: validate_print_info, object: string, status: validate_status): string {
        const rem_width = print_info.width - object.length
        const padding = rem_width <= 0 ? "" : " ".repeat(rem_width)
        return print_info.current_indent +  object + padding + map[status]
    }

    export function normalize_version(this: void, version: string): string {
        let res = []
        for (const [v] of string.gmatch(version, "%d+")) {
            res.push(string.format("%05d", v))
        }
        return res.join(".")
    }
}

export function errorHandler(this: void, err: any): void {
    $log_crit!("An unknown critical error occurred", `Thrown exception: ${serpent.line(err, {comment: false})}`)
}

export function $safe_call<This, Args extends any[], R>(
    f: ((this: This, ...args: Args) => R) | ((...args: Args) => R) | undefined,
    context: This,
    ...args: Args
): LuaMultiReturn<[true, R] | [false, void]> {
    if (f != undefined) {
        return xpcall(f, (err: any) => {
            $log_crit!("An unknown critical error occurred", `Thrown exception: ${serpent.line(err, {comment: false})}`)
        }, context, ...args)
    } else {
        return $multi<[false, void]>(false)
    }
}

export default Util;
export {validate_status, validate_print_info};