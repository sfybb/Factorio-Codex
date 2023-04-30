import Util from "Util";
interface feature {
    supported: boolean,
    check: {
        modifier?: string,
        mod_id?: string,
        comparator?: string,
        exp_version?: string,
        avail_version?: string
    }
}

const compare_versions : {
    "<":  (this: void, a: string, b: string) => boolean,
    "<=": (this: void, a: string, b: string) => boolean,
    "=":  (this: void, a: string, b: string) => boolean,
    ">=": (this: void, a: string, b: string) => boolean,
    ">":  (this: void, a: string, b: string) => boolean
} = {
    "<":  (a: string, b: string) => a <  b,
    "<=": (a: string, b: string) => a <= b,
    "=":  (a: string, b: string) => a == b,
    ">=": (a: string, b: string) => a >= b,
    ">":  (a: string, b: string) => a >  b,
}


const Feature_ids = {
    dictionary: "! flib >= 0.12.0",
    dictionary_lite: "flib >= 0.12.0",
    localised_fallback: "base >= 1.1.76",
    gvv: "gvv"
}

namespace Features {
    let feature_list: LuaTable<string, feature>;

    export function Init() {
        feature_list = new LuaTable()
        for (let [feat, check] of Object.entries(Feature_ids)) {
            let tmp = create_feature(check)
            feature_list.set(feat, tmp)
            $log_info!(`Feature "${feat}" ("${check}") is ${tmp.supported ? "" : "not " }supported (current version: ${tmp.check.avail_version})`)
        }

        $log_info!("Initialized Feature check")
    }

    export function supports(feat_id: string) {
        return feature_list.get(feat_id)?.supported == true
    }

    function create_feature(check: string): feature {
        let res: feature = {
            supported: false,
            check: {}
        }

        check.split(" ").forEach((elem: string, ind: number) => {
            if (ind == 0 && elem == "!") {
                res.check.modifier = elem
            } else if (ind <= 1 && res.check.mod_id == undefined) {
                res.check.mod_id = elem
            } else if (res.check.mod_id != undefined && res.check.comparator == undefined) {
                res.check.comparator = elem
            } else {
                res.check.exp_version = elem
            }
        })

        if (res.check.mod_id == undefined) { // error
            $log_warn!("Mod id is undefined")
            return res
        }
        if ((res.check.exp_version == undefined && res.check.comparator != undefined) ||
            (res.check.exp_version != undefined && res.check.comparator == undefined)) {// error
            $log_warn!("Either expected version or comparator is undefined")
            return res
        }

        let avail_version = script.active_mods[res.check.mod_id]
        let is_supported = false;

        res.check.avail_version = avail_version

        //$log_info!(`Check: ${serpent.line(res, {comment: false})}`)

        if (res.check.comparator != undefined) {
            // unreachable but makes typescript happy
            if (res.check.exp_version == undefined) return res

            if ( res.check.comparator in compare_versions && res.check.avail_version != undefined) {
                res.check.avail_version = Util.normalize_version(res.check.avail_version)
                res.check.exp_version   = Util.normalize_version(res.check.exp_version)

                // @ts-ignore
                let func: (this: void, a: string, b: string) => boolean = compare_versions[res.check.comparator]
                is_supported = func(res.check.avail_version, res.check.exp_version)
            } else {
                is_supported = false
            }
        } else {
            is_supported = avail_version != undefined
        }

        res.supported = is_supported != undefined && res.check.modifier == "!" ? !is_supported : is_supported

        return res
    }
}

Features.Init()

export default Features;
export {Feature_ids};