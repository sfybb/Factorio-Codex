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

const compare_versions = {
    "<":  (a:string, b:string) => a <  b,
    "<=": (a:string, b:string) => a <= b,
    "=":  (a:string, b:string) => a == b,
    ">=": (a:string, b:string) => a >= b,
    ">":  (a:string, b:string) => a >  b,
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
    $log_info!(`Mod ${res.check.mod_id} has ver ${avail_version == undefined ? "null" : avail_version}`)

    if (res.check.comparator != undefined) {
        // unreachable but makes typescript happy
        if (res.check.exp_version == undefined) return res

        if ( res.check.exp_version in compare_versions ) {
            // @ts-ignore
            is_supported = compare_versions[res.check.comparator](avail_version, res.check.exp_version)
        } else {
            is_supported = false
        }
    } else {
        is_supported = avail_version != undefined
    }

    res.supported = is_supported != undefined && res.check.modifier == "!" ? !is_supported : is_supported

    return res
}


const Feature_ids = {
    dictionary: "! flib >= 0.12.0",
    dictionary_lite: "flib >= 0.12.0",
    localised_fallback: "base >= 1.1.74",
    gvv: "gvv"
}

namespace Features {
    let feature_list: { [key: string]: feature };

    export function Init() {
        feature_list = {}
        for (let [feat, check] of Object.entries(Feature_ids)) {
            feature_list[feat] = create_feature(check)
        }

        $log_info!("Initialized Feature check")
    }

    export function supports(feat_id: string) {
        return feature_list[feat_id]?.supported == true
    }
}

Features.Init()

// @ts-ignore
global.Features = Features
export default Features;
export {Feature_ids};