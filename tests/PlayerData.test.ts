// @ts-nocheck
import {describe, expect, test, jest, beforeEach} from '@jest/globals';

import "./mocks/LuaMocks"
import "./mocks/FLIBMocks"
import "./mocks/BaseMocks"

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
/*jest.mock("Features")
jest.mock("codex/RecipeUI")
jest.mock("codex/TechnologyInfo")
jest.mock("Codex")
jest.mock("QuickSearch")*/

global.game = {
    get_player: jest.fn(),
    recipe_category_prototypes: new Map<string, {name: string}>([[ "test", {name: "Test recipe cat. Meow!"}]]),
    resource_category_prototypes: new Map<string, {name: string}>([[ "test", {name: "Test cat. Meow!"}]]),
    players: []
}

import playerData from "../src/PlayerData"

describe("PlayerData module", () => {
    beforeEach(() => {
        jest.resetAllMocks()
        // @ts-ignore
        storage.players = undefined
    })
    test("Can initialize global table", () => {
        playerData.Init()
        expect(storage.players).toEqual({})
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
        expect(storage.players).toEqual({69: {
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