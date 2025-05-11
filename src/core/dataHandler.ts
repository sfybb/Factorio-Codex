import {OnRuntimeModSettingChangedEvent, PlayerIndex} from "factorio:runtime";
import {GameEventRegistry} from "../events/eventRegistry";
import {
    getSettingValueFromName,
    GlobalSettings,
    loadGlobalSettings,
    loadPlayerSettings,
    PlayerSettings,
    removeModPrefix
} from "../settings";
import {$safe_call} from "../util/Util";
import {DictionaryData} from "./Dictionary";
import {TaskStorage} from "../events/taskScheduler";


type PlayerDataInitCallback = (this: any, playerId: PlayerIndex) => any;
type PlayerDataLoadCallback = (this: any, data: any) => void;
type DataInitCallback = (this: any) => any;
type DataLoadCallback = (this: any, data: any) => void;

const playerDataInitCallbacks: LuaMap<string, PlayerDataInitCallback> = new LuaMap()
const playerDataLoadCallbacks: LuaMap<string, PlayerDataLoadCallback> = new LuaMap()
const dataInitCallbacks: LuaMap<string, DataInitCallback> = new LuaMap()
const dataLoadCallbacks: LuaMap<string, DataLoadCallback> = new LuaMap()

export function registerPlayerDataInitializer(id: string, callback: PlayerDataInitCallback, loadCallback?: PlayerDataLoadCallback) {
    playerDataInitCallbacks.set(id, callback);
    if (loadCallback != undefined) playerDataLoadCallbacks.set(id, loadCallback);
}

export function registerDataInitializer(id: string, callback: DataInitCallback, loadCallback?: DataLoadCallback) {
    dataInitCallbacks.set(id, callback);
    if (loadCallback != undefined) dataLoadCallbacks.set(id, loadCallback);
}

interface PlayerData {
    quick_search: any,
    settings: PlayerSettings
}

interface GlobalData {
    dictionary: DictionaryData,
    task_scheduler: TaskStorage,
    settings: GlobalSettings
}

declare let storage: {
    playerData?: LuaMap<PlayerIndex, any>,
    globalData?: GlobalData
}

export function DeleteData(): void {
    storage.playerData = undefined;
    storage.globalData = undefined;
}

function initializeGlobalData(): GlobalData {
    $log_trace!(`Initializing global data with ${serpent.line(Object.keys(dataInitCallbacks))}`)
    let data: any = {}

    for (let [name, cb] of dataInitCallbacks) {
        let [status, result] = $safe_call!(cb, undefined);
        data[name] = status ? result : {}
    }

    data.settings = loadGlobalSettings()
    return data
}

export function getGlobalData() {
    if (storage.globalData == undefined) {
        storage.globalData = initializeGlobalData()
    }
    return storage.globalData
}

function initializePlayerData(pIndx: PlayerIndex): PlayerData {
    $log_trace!(`Initializing player data for ${$get_player_string!(pIndx)} with ${serpent.line(Object.keys(playerDataInitCallbacks))}}`)
    let data: any = {}

    for (let [name, cb] of playerDataInitCallbacks) {
        let [status, result] = $safe_call!(cb, undefined, pIndx);
        data[name] = status ? result : {}
    }

    data.settings = loadPlayerSettings(pIndx) ?? new LuaMap()
    return data
}

export function hasPlayerData(pIndx: PlayerIndex): boolean {
    return storage.playerData != undefined && storage.playerData.has(pIndx);
}

export function getPlayerData(pIndx: PlayerIndex): PlayerData {
    if (storage.playerData == undefined) storage.playerData = new LuaMap()

    let res = storage.playerData.get(pIndx);
    if (res == undefined) {
        res =  initializePlayerData(pIndx)
        storage.playerData.set(pIndx, res)
    }
    return res
}

// We are not allowed to modify any data here
export function LoadMetatables() {
    //$log_trace!(`Data stored: ${serpent.block(storage, {nocode: true, maxlevel: 5})}`)
    // Nothing stored? strange but nothing we can do
    if (storage == undefined) return

    if (storage.globalData != undefined) {
        $log_trace!(`Loading global data with ${serpent.line(Object.keys(dataLoadCallbacks))}}`)

        let data: any = storage.globalData
        for (let [name, cb] of dataLoadCallbacks) {
            let res = $safe_call!(cb, undefined, data[name]);
        }
    }

    if (storage.playerData != undefined) {
        $log_trace!(`Loading player data with ${serpent.line(Object.keys(playerDataLoadCallbacks))}}`)
        for (let [_, data] of storage.playerData) {
            for (let [name, cb] of playerDataLoadCallbacks) {
                let res =$safe_call!(cb, undefined, data[name]);
            }
        }
    } else {
        $log_trace!(`Player data empty ${serpent.line(storage.playerData)}}`)
    }
}

function updateCachedSettings(this: any, event: OnRuntimeModSettingChangedEvent) {
    $log_info!("Mod settigns changed! updating...")
    if (event.player_index) {
        let player = game.get_player(event.player_index)
        if (player && hasPlayerData(event.player_index)) {
            let playerSettings = getPlayerData(event.player_index).settings
            let new_val = getSettingValueFromName(player.mod_settings[event.setting], event.setting)

            let setting_id = removeModPrefix(event.setting)
            $log_debug!(`Settings change for "${$get_player_string!(event.player_index)}": ["${event.setting}"]: ${
                serpent.line(playerSettings.get(setting_id))} => ${serpent.line(new_val)}`)
            playerSettings.set(setting_id, new_val)
        }
    } else {
        let globalSettings = getGlobalData().settings
        let new_val = getSettingValueFromName(settings.global[event.setting], event.setting)

        let setting_id = removeModPrefix(event.setting);
        $log_debug!(`Settings change for <Global>: ["${event.setting}"]: ${
            serpent.line(globalSettings.get(setting_id))} => ${serpent.line(new_val)}`)
        globalSettings.set(setting_id, new_val)
    }
}

type ErrFn<F> = (fn: F, payload?: any) => void;
type InstanceFinderFn = (player_data: any) => any;

export function getEventForwardingForPlayer<E extends {player_index?: PlayerIndex}, F extends Function>(fn: F, getInstance: InstanceFinderFn, pass_payload: boolean = false, err?: ErrFn<F>): (this: any, payload?: any) => void {
    return (payload?: E)=> {
        if (!payload || !payload.player_index) {
            if (err != undefined) err(fn, payload);
            else {
                $log_warn!(`Failed to forward event: Missing payload`)
            }
            return
        }

        let instance = getInstance(getPlayerData(payload.player_index))

        if (pass_payload) fn.apply(instance, [payload])
        else fn.apply(instance)
    }
}


GameEventRegistry.register("on_load", LoadMetatables)
GameEventRegistry.register("on_runtime_mod_setting_changed", updateCachedSettings)