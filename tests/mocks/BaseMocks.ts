import {jest} from "@jest/globals";

// Mock logging
let savedConsoleMsgs: string[] = []
global.$log_trace = jest.fn((m) => savedConsoleMsgs.push("[TRACE] "+m))
global.$log_debug = jest.fn((m) => savedConsoleMsgs.push("[DEBUG] "+m))
global.$log_info = jest.fn((m) => savedConsoleMsgs.push("[INFO] "+m))
global.$log_warn = jest.fn((m) => savedConsoleMsgs.push("[WARN] "+m))
global.$log_err = jest.fn((m) => savedConsoleMsgs.push("[ERR] "+m))
global.$log_crit = jest.fn((m) => savedConsoleMsgs.push("[CRIT] "+m))
global.$log_crit_raw = jest.fn((m) => savedConsoleMsgs.push("[CRIT (raw)] "+m))

export function printConsoleMessages() {
    console.log("[LOG] " + savedConsoleMsgs.join("\n[LOG] "))
    clearConsoleMessages()
}

export function clearConsoleMessages() {
    savedConsoleMsgs = []
}

// Mock game
// TODO
// @ts-ignore
global.script = {
    active_mods: {}
}

// @ts-ignore
global.game = {
    item_prototypes: {},
    fluid_prototypes: {},
    technology_prototypes: {},

    get_player: jest.fn(),

    players: []
}



function serpentPrint(tbl: unknown, options?: Partial<SerpentOptions>): string {
    return JSON.stringify(tbl)
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
