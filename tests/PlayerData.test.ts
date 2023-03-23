// @ts-nocheck
import {describe, expect, test, jest, beforeEach} from '@jest/globals';

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

global.game = {
    get_player: jest.fn(),
}

global.$log_info = jest.fn()
global.$log_warn = jest.fn()
global.$log_crit = jest.fn()
global.$log_crit_ng = jest.fn()
global.serpent = {
    line: jest.fn()
}

import playerData from "../src/PlayerData"

describe("PlayerData module", () => {
    beforeEach(() => {
        jest.resetAllMocks()
        // @ts-ignore
        global.players = undefined
    })
    test("Can initialize global table", () => {
        playerData.Init()
        expect(global.players).toEqual({})
    })
    test("Can initialize data for a player", () => {
        const test = new LuaTable()
        test.set(1,2)

        const p: PlayerData = {
            name: "420",
            index: 69
        }
        global.game.get_player.mockImplementation((i: PlayerIndex) => i == 69 ? {...p} : undefined)

        playerData.InitPlayer(69 as PlayerIndex)
        expect(global.players).toEqual({69: {
                codex: {
                    player_index: 69,

                    categories: {
                        selected_index: -1,
                        selected_cat: undefined,

                        rebuild_gui: false,
                        refs: {
                            available_entities: {}
                        },
                        entity_lists: {},
                    },

                    visible: false,
                    keep_open: false,
                    refs: {},
                    rebuild_gui: false,
                    entity_view: undefined,

                    historyList: [],
                    historyPosition: -1
                },
                quick_search: {
                    player_index: 69,
                    visible: false,
                    refs: {},
                    rebuild_gui: false,
                    last_search_task: undefined,
                    search_results: [],
                    search_has_math: false,
                    math_result: undefined
                }
            }})
    })
})