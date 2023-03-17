// @ts-nocheck
import {describe, expect, afterEach, test, jest} from '@jest/globals';

import "./LuaMocks"
import "./FLIBMocks"

jest.mock('build/Cache', () => ({
    __esModule: true,
    registerCache: jest.fn(),
    getGlobalCache: jest.fn(),
    getPlayerCache: jest.fn(),
    default: class {
        load = jest.fn()
        constructor() {
        }

    }
}), {
    virtual: true
});

import quickSearch from "../src/QuickSearch"
import {validate_status} from "../src/Util";

global.$log_info = jest.fn()

global.game = {
    tick: 0,
}

describe("Quick Search module", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("New instance passes validation check", () => {
        // @ts-ignore
        const qs_inst = new quickSearch(69 as PlayerIndex)

        const pi = {
            width: 13,
            indent_step: "- -",
            current_indent: ":)"
        }
        expect(qs_inst.validate(pi, 69 as PlayerIndex)).toBe(validate_status.OK)
    });

    test("Validate prints information about every member variable", () => {
        const qs_inst = new quickSearch(69 as PlayerIndex)

        const pi = {
            width: 16,
            indent_step: "- -",
            current_indent: ":)"
        }

        qs_inst.validate(pi, 69 as PlayerIndex)

        expect(global.$log_info).toHaveBeenCalledTimes(7)
        // @ts-ignore
        expect(global.$log_info.mock.calls).toEqual([
            [":)player_index    [OK]"],
            [":)visible         [OK]"],
            [":)refs            [OK]"],
            [":)rebuild_gui     [OK]"],
            [":)search_results  [OK]"],
            [":)search_has_math [OK]"],
            [":)math_result     [OK]"]])
    })

    test("Update input fetches current prompt", () => {
        const qs_inst = new quickSearch(69 as PlayerIndex)
        qs_inst.visible = true
        qs_inst.refs = {
            search_field:  {
                text: "Custom Prompt!"
            }
        }

        qs_inst.update_input()
    })
});