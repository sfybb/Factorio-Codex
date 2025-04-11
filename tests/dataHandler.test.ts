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
    players: [],
}

import playerData from "../src/PlayerData"
import {
    getGlobalData,
    getPlayerData,
    registerDataInitializer,
    registerPlayerDataInitializer
} from "../src/core/dataHandler";

const globalFunctions =  {
    init: jest.fn(),
    load: jest.fn(),
}

const playerFunctions =  {
    init: jest.fn(),
    load: jest.fn(),
}

registerDataInitializer("test", globalFunctions.init, globalFunctions.load)
registerPlayerDataInitializer("test", playerFunctions.init, playerFunctions.load)

describe("dataHandler module", () => {
    beforeEach(() => {
        jest.resetAllMocks()
        // @ts-ignore
        storage.playerData = undefined
        storage.globalData = undefined
    })
    test("Can initialize global Data", () => {
        globalFunctions.init.mockReturnValueOnce({ data: "value" })

        global.settings.global = {
            fcodex_indexing_speed: {value: undefined}
        }

        expect(getGlobalData()).toEqual({ test: { data: "value" }, settings: new Map([[ "indexing_speed", 10 ]])})
        expect(storage.globalData).toEqual({ test: { data: "value" }, settings: new Map([[ "indexing_speed", 10 ]])})
    })
    test("Can initialize data for a player", () => {
        const test = new LuaTable()
        test.set(1,2)

        const empty_setting = {value: undefined}
        const default_color_settings = {r: 1, g: 1, b: 1, hex: "#FFFFFF"}

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

        playerFunctions.init.mockReturnValueOnce({ data: "value" })

        const expectedData = { test: { data: "value" }, settings: new Map([
                ["always_si_prefix", true],
                ["search_items", true],        ["search_items_color", default_color_settings],
                ["search_fluids", true],       ["search_fluids_color", default_color_settings],
                ["search_technologies", true], ["search_technologies_color", default_color_settings],
                ["search_technologies_always_last", true]
            ])}

        expect(getPlayerData(69 as PlayerIndex)).toEqual(expectedData)
        expect(storage.playerData.get(69)).toEqual(expectedData)
    })
})