
type Verifyinfo = {
    field: string,
    type: "string" | "number" | "object" | "boolean" | "function" | Verifiable,
    value?: any
    optional?: boolean
}

export interface Verifiable {
    get_verify_info(): Verifyinfo[];
}

function verify<T extends Verifiable>(obj: T) {
    let infoList = obj.get_verify_info()

    for (let info of infoList) {
        // @ts-ignore
        let type = typeof obj[info.field]
        if (typeof info.type == "string") {
            if (type != info.type && ( type != "undefined" || info.optional == true )) {
                $log_err!(`Expected field ${info.field} to have type ${info.type}${info.optional ? " (optional)" : ""
                } but has type ${type}`)
            }
        }
    }
}