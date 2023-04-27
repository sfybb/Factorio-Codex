import {jest} from "@jest/globals";

// Mock logging
let savedConsoleMsgs: string[] = []
global.$log_trace = jest.fn((m) => savedConsoleMsgs.push("[TRACE] "+m))
global.$log_debug = jest.fn((m) => savedConsoleMsgs.push("[DEBUG] "+m))
global.$log_info = jest.fn((m) => savedConsoleMsgs.push("[INFO] "+m))
global.$log_warn = jest.fn((m) => savedConsoleMsgs.push("[WARN] "+m))
global.$log_err = jest.fn((m) => savedConsoleMsgs.push("[ERR] "+m))
global.$log_crit = jest.fn((m) => savedConsoleMsgs.push("[CRIT] "+m))
global.$log_crit_ng = jest.fn((m) => savedConsoleMsgs.push("[CRIT (no game)] "+m))

export function printConsoleMessages() {
    console.log("[LOG] " + savedConsoleMsgs.join("\n[LOG] "))
    clearConsoleMessages()
}

export function clearConsoleMessages() {
    savedConsoleMsgs = []
}

// Mock game
// TODO



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