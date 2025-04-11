// @ts-nocheck
import {describe, expect, afterEach, test, jest} from '@jest/globals';

import "./mocks/BaseMocks"
import "./mocks/LuaMocks"
import "./mocks/FLIBMocks"

import "events"

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

global.$log_info = jest.fn()

global.game.tick = 0;
global.serpent = {
    line: jest.fn()
}

import quickSearch from "../src/core/QuickSearch"

describe("Quick Search module", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Update input fetches current prompt", () => {
        const empty_setting = {value: undefined}
        const default_color_settings = {r: 1, g: 1, b: 1, hex: "#FFFFFF"}

        global.settings.global = {
            fcodex_indexing_speed: empty_setting
        }

        const p: PlayerData = {
            name: "420",
            index: 69,
            mod_settings: {
                fcodex_always_si_prefix: empty_setting,
                fcodex_search_items: empty_setting,
                fcodex_search_items_color: empty_setting,
                fcodex_search_fluids: empty_setting,
                fcodex_search_fluids_color: empty_setting,
                fcodex_search_technologies: empty_setting,
                fcodex_search_technologies_color: empty_setting,
                fcodex_search_technologies_always_last: empty_setting
            }
        }
        global.game.get_player.mockImplementation((i: PlayerIndex) => i == 69 ? {...p} : undefined)


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