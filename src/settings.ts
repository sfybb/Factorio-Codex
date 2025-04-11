import {SettingsPrototypeMap, BaseSettingDefinition} from "factorio:settings"
import {SettingsData} from "factorio:common";

/** @noResolution */
import * as util from "__core__.lualib.util";
import {Color, ModSetting, double, int, PlayerIndex} from "factorio:runtime";

export interface SettingsColor extends Color {
    hex: string;
}

type SettingDefinition =  SettingsPrototypeMap[keyof SettingsPrototypeMap];
declare let data: SettingsData

let order = "0".charCodeAt(0)

const SETTINGS_PREFIX = "fcodex_"

const settingDefinitions: SettingDefinition[] = [
    {
        type: "int-setting",
        name: `${SETTINGS_PREFIX}indexing_speed`,
        setting_type: "runtime-global",
        default_value: 10,
        minimum_value: 1,
    },
    createUserSetting("bool", "always_si_prefix", true),

    createUserSetting("bool",  "search_items", true),
    createUserSetting("color", "search_items_color", util.color("#D98E3E")),

    createUserSetting("bool",  "search_fluids", true),
    createUserSetting("color", "search_fluids_color", util.color("#5FA7A7")),

    createUserSetting("bool",  "search_technologies", true),
    createUserSetting("color", "search_technologies_color", util.color("#6BAF5F")),
    createUserSetting("bool",  "search_technologies_always_last", true),
]

export type PlayerSettings = LuaMap<string, int | double | boolean | SettingsColor | string>
export type GlobalSettings = LuaMap<string, int | double | boolean | SettingsColor | string>

export function loadPlayerSettings(pIndx: PlayerIndex): PlayerSettings | undefined {
    let player = game.get_player(pIndx);
    if (!player) return undefined;

    let result: LuaMap<string, int | double | boolean | string | Color> = new LuaMap();

    for (let i = 0; i < settingDefinitions.length; i++) {
        let def = settingDefinitions[i];
        if (def.setting_type != "runtime-per-user") continue;

        let name = def.name;
        result.set(removeModPrefix(name), getSettingValue(player.mod_settings[name], def));
    }

    // @ts-ignore
    return result as PlayerSettings;
}

export function loadGlobalSettings(): GlobalSettings {
    let result: LuaMap<string, int | double | boolean | string | Color> = new LuaMap();

    for (let i = 0; i < settingDefinitions.length; i++) {
        let def = settingDefinitions[i];
        if (def.setting_type == "runtime-per-user") continue;

        let name = def.name;
        result.set(removeModPrefix(name), getSettingValue(settings.global[name], def));
    }

    // @ts-ignore
    return result as GlobalSettings;
}

function getSettingValue(raw_val: ModSetting, def: SettingDefinition) {
    let val: any = raw_val.value ?? def.default_value;

    if (def.type == "color-setting") {
        val = {
            ...(val as Color),
        };
        val.hex = colorToHex(val as Color)
    }
    return val;
}

export function removeModPrefix(name: string): string {
    return name.substring(SETTINGS_PREFIX.length)
}

export function getSettingValueFromName(raw_val: ModSetting, setting_name: string) {
    for (let i = 0; i < settingDefinitions.length; i++) {
        if (settingDefinitions[i]["name"] == setting_name) {
            return getSettingValue(raw_val, settingDefinitions[i]);
        }
    }
    return undefined;
}

function createUserSetting(type: "bool" | "int" | "double" | "string" | "color", name: string, default_value: any): SettingDefinition {
    order = order + 1
    return {
        type: `${type}-setting`,
        name: `${SETTINGS_PREFIX}${name}`,
        setting_type: "runtime-per-user",
        default_value: default_value,
        order: string.char(order - 1)
    }
}

function colorToHex(c: Color | undefined): string {
    return typeof c != "undefined" && c ? string.format("#%02X%02X%02X", (c.r ?? 0) * 255, (c.g ?? 0) * 255, (c.b ?? 0) * 255) : "#FFFFFF"
}

if (typeof data != "undefined") {
    data.extend(settingDefinitions)
}

