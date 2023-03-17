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


class Util {
    static format_validate_msg(print_info: validate_print_info, object: string, status: validate_status): string {
        const rem_width = print_info.width - object.length
        const padding = rem_width <= 0 ? "" : " ".repeat(rem_width)
        return print_info.current_indent +  object + padding + map[status]
    }

    static normalize_version(version: string): string {
        let res = []
        for (const [v] of string.gmatch(version, "%d+")) {
            res.push(string.format("%05d", v))
        }
        return res.join(".")
    }
}

export default Util;
export {validate_status, validate_print_info};