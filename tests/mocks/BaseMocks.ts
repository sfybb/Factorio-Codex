import {jest} from "@jest/globals";
import {EventId} from "factorio:runtime";

// Mock logging
let savedConsoleMsgs: string[] = []
global.$log_trace = jest.fn((m) => savedConsoleMsgs.push("[TRACE] "+m))
global.$log_debug = jest.fn((m) => savedConsoleMsgs.push("[DEBUG] "+m))
global.$log_info = jest.fn((m) => savedConsoleMsgs.push("[INFO] "+m))
global.$log_warn = jest.fn((m) => savedConsoleMsgs.push("[WARN] "+m))
global.$log_err = jest.fn((m) => savedConsoleMsgs.push("[ERR] "+m))
global.$log_crit = jest.fn((m) => savedConsoleMsgs.push("[CRIT] "+m))
global.$log_crit_raw = jest.fn((m) => savedConsoleMsgs.push("[CRIT (raw)] "+m))
global.$get_player_string = jest.fn((m) => `[test player ${m}]`)

export function printConsoleMessages() {
    console.log("[LOG] " + savedConsoleMsgs.join("\n[LOG] "))
    clearConsoleMessages()
}

export function clearConsoleMessages() {
    savedConsoleMsgs = []
}


let event_id_counter = 0
// Mock game
// TODO
// @ts-ignore
global.script = {
    active_mods: {},
    generate_event_name: jest.fn(() => event_id_counter++),
}

// @ts-ignore
global.game = {
    get_player: jest.fn(),

    players: []
}

// @ts-ignore
global.settings = {
    global: {}
}

// @ts-ignore
global.prototypes = {
    item: [],
    fluid: [],
    technology: [],

    get_player: jest.fn(),

    players: []
}

// @ts-ignore
global.storage = {

}

//@ts-ignore
global.defines = {
    //@ts-ignore
    events: {
        [0 as EventId<any>]: "on_gui_closed"
    }
}



function serpentPrint(tbl: unknown, options?: Partial<serpent.Options>): string {
    const replacer = (key: any, value: any) => {
        if (value instanceof Map) {
            let res: object = {}
            for(let [k, v] of value.entries()) { // @ts-ignore
                res[k] = v
            }
            return res
        } else {
            return value
        }
    }

    return JSON.stringify(tbl, replacer)
}

global.serpent = {
    dump: serpentPrint,
    line: serpentPrint,
    block: serpentPrint,

    // @ts-ignore
    load: (str: string, options?: { safe?: boolean }) => $multi([false, "Mock Load"])
}

jest.mock('__core__.lualib.mod-gui', () => ({
    __esModule: true,
    get_frame_flow: jest.fn(),
    get_button_flow: jest.fn()
}), {
    virtual: true
});

jest.mock('__core__.lualib.util', () => ({
    __esModule: true,
    color: jest.fn(x => { return {r: 1, g: 1, b: 1} }),
}), {
    virtual: true
});

jest.mock('__core__.lualib.event_handler', () => ({
    __esModule: true,
    add_lib: jest.fn(),
}), {
    virtual: true
});
