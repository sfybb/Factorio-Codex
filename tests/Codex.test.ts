import {afterEach, describe, expect, jest, test} from "@jest/globals";

jest.mock("Cache")
jest.mock("codex/RecipeUI")
jest.mock("codex/TechnologyInfo")
jest.mock("codex/RecipeInfo")
jest.mock("codex/Categories")
import "./mocks/FLIBMocks"
import "./mocks/LuaMocks"
import {printConsoleMessages, clearConsoleMessages} from "./mocks/BaseMocks";


import Codex from "Codex"
import verify, {Verifyinfo} from "../src/Validate";
import {validate_status} from "../src/Util";
import Categories from "../src/codex/Categories";
import RecipeInfo from "../src/codex/RecipeInfo";
import TechnologyInfo from "../src/codex/TechnologyInfo";
import {
    FlowGuiElement,
    LuaFluidPrototype, LuaItemPrototype, LuaTechnologyPrototype,
    PlayerIndex,
    ProgressBarGuiElement, ScrollPaneGuiElement,
    SpriteGuiElement
} from "factorio:runtime";

describe("Codex module", () => {
    afterEach(() => {
        jest.clearAllMocks();
        clearConsoleMessages()
    });

    test("New instance passes validation check", () => {
        let cdx = new Codex(1 as PlayerIndex)
        cdx.categories.get_verify_info = jest.fn(() => [])

        let status = verify(cdx, undefined, 1)
        if (status != validate_status.OK) printConsoleMessages()
        expect(status).toBe(validate_status.OK)
    })

    test("load calls setmetatable correctly", () => {
        let obj = {tes: 1, categories: undefined}
        Codex.load(obj as unknown as Codex)

        expect(global.setmetatable).toHaveBeenCalledTimes(1)
        expect(global.setmetatable).toBeCalledWith(obj, Codex.prototype)
        expect(Categories.load).toHaveBeenCalledTimes(0)

        // @ts-ignore
        obj.categories = {test: 2}
        Codex.load(obj as unknown as Codex)
        expect(global.setmetatable).toHaveBeenCalledTimes(2)
        expect(Categories.load).toHaveBeenCalledTimes(1)
        expect(Categories.load).toBeCalledWith(obj.categories)
    })

    test("Destroy deletes the UI and removes invalid prototypes from history", () => {
        let cdx = new Codex(1 as PlayerIndex)

        // @ts-ignore
        let validProto : LuaItemPrototype = { name: "valid-prototype", valid: true }

        let protoObserver = {
            set: jest.fn(() => false),
            get: jest.fn((target: {valid: false}, p: string | symbol, receiver: any): any => {
                let name = p.toString()
                if (name == "valid") return target.valid
                return undefined
            })
        }
        let invalidProto : {valid: false} = new Proxy({valid: false}, protoObserver)

        cdx.historyList = [
            {type: "", id: "0", proto: validProto}, // 0
            {type: "", id: "1", proto: invalidProto},
            {type: "", id: "2", proto: invalidProto}, // 2
            {type: "", id: "3", proto: validProto},
            {type: "", id: "4", proto: invalidProto}, // 4 <---
            {type: "", id: "5", proto: validProto},
            {type: "", id: "6", proto: validProto},
            {type: "", id: "7", proto: invalidProto},
            {type: "", id: "8", proto: invalidProto},
            {type: "", id: "9", proto: invalidProto},
            {type: "", id: "10", proto: validProto},
        ]

        cdx.historyPosition = 4

        let windowDestroy = jest.fn()
        // @ts-ignore
        cdx.refs.window = {
            destroy: windowDestroy
        }

        cdx.destroy()

        expect(windowDestroy).toHaveBeenCalledTimes(1)
        expect(cdx.categories.destroy).toHaveBeenCalledTimes(1)
        expect(cdx.refs).toEqual({})

        expect(cdx.historyPosition).toBe(1)
        expect(cdx.historyList).toEqual([
            {type: "", id: "0", proto: validProto},
            {type: "", id: "3", proto: validProto},
            {type: "", id: "5", proto: validProto},
            {type: "", id: "6", proto: validProto},
            {type: "", id: "10", proto: validProto},
        ])
        expect(protoObserver.set).not.toHaveBeenCalled()
        expect(protoObserver.get).toHaveBeenCalledTimes(6)
        for (let i = 1; i <= 6; i++) {
            expect(protoObserver.get).toHaveBeenNthCalledWith(i, {valid: false}, "valid", {valid: false})
        }
    })

    test("show_info delegates entity information and performs additional tasks", () => {
        let cdx = new Codex(1 as PlayerIndex)

        let genericProto : unknown = {
            localised_description: ["", "generic description"],
            localised_name: ["", "generic name"]
        }

        game.fluid_prototypes["id"] = genericProto as LuaFluidPrototype

        cdx.open = jest.fn()
        cdx.addToHistory = jest.fn()
        cdx.item_info = jest.fn()
        cdx.fluid_info = jest.fn()
        cdx.tech_info = jest.fn()

        cdx.refs = {
            entity_sprite: {} as SpriteGuiElement,
            entity_desc_frame: {} as FlowGuiElement,
            entity_color: {visible: true} as ProgressBarGuiElement,
            entity_usage: {scroll_to_top: jest.fn(), clear: jest.fn()} as unknown as ScrollPaneGuiElement,
        }

        cdx.show_info("id", "fluid")

        expect(cdx.open).toHaveBeenCalledTimes(1)
        expect(cdx.addToHistory).toHaveBeenCalledTimes(1)
        expect(cdx.addToHistory).toHaveBeenLastCalledWith(genericProto)
        // @ts-ignore
        expect(cdx.refs.entity_sprite).toEqual({sprite: "fluid/id", tooltip: genericProto.localised_description})
        // @ts-ignore
        expect(cdx.refs.entity_desc_frame).toEqual({caption: genericProto.localised_name})
        expect(cdx.refs.entity_color).toEqual({visible: false})
        expect(cdx.refs.entity_usage?.scroll_to_top).toHaveBeenCalledTimes(1)
        expect(cdx.refs.entity_usage?.clear).toHaveBeenCalledTimes(1)
        expect(cdx.fluid_info).toHaveBeenCalledTimes(1)
        expect(cdx.fluid_info).toHaveBeenLastCalledWith(genericProto)
        expect(cdx.entity_view).toEqual({id: "id", type: "fluid"})

        delete game.fluid_prototypes["id"]
        game.technology_prototypes["id"] = genericProto as LuaTechnologyPrototype
        cdx.refs.entity_sprite = {} as SpriteGuiElement
        cdx.refs.entity_desc_frame = {} as FlowGuiElement
        cdx.refs.entity_color = {visible: true} as ProgressBarGuiElement

        cdx.show_info("id", "technology")

        expect(cdx.open).toHaveBeenCalledTimes(2)
        expect(cdx.addToHistory).toHaveBeenCalledTimes(2)
        expect(cdx.addToHistory).toHaveBeenLastCalledWith(genericProto)
        // @ts-ignore
        expect(cdx.refs.entity_sprite).toEqual({sprite: "technology/id", tooltip: genericProto.localised_description})
        // @ts-ignore
        expect(cdx.refs.entity_desc_frame).toEqual({caption: genericProto.localised_name})
        expect(cdx.refs.entity_color).toEqual({visible: false})
        expect(cdx.refs.entity_usage?.scroll_to_top).toHaveBeenCalledTimes(2)
        expect(cdx.refs.entity_usage?.clear).toHaveBeenCalledTimes(2)
        expect(cdx.tech_info).toHaveBeenCalledTimes(1)
        expect(cdx.tech_info).toHaveBeenLastCalledWith(genericProto)
        expect(cdx.entity_view).toEqual({id: "id", type: "technology"})

        delete game.technology_prototypes["id"]
        game.item_prototypes["id"] = genericProto as LuaItemPrototype
        cdx.refs.entity_sprite = {} as SpriteGuiElement
        cdx.refs.entity_desc_frame = {} as FlowGuiElement
        cdx.refs.entity_color = {visible: true} as ProgressBarGuiElement

        cdx.show_info("id", "item")

        expect(cdx.open).toHaveBeenCalledTimes(3)
        expect(cdx.addToHistory).toHaveBeenCalledTimes(3)
        expect(cdx.addToHistory).toHaveBeenLastCalledWith(genericProto)
        // @ts-ignore
        expect(cdx.refs.entity_sprite).toEqual({sprite: "item/id", tooltip: genericProto.localised_description})
        // @ts-ignore
        expect(cdx.refs.entity_desc_frame).toEqual({caption: genericProto.localised_name})
        expect(cdx.refs.entity_color).toEqual({visible: false})
        expect(cdx.refs.entity_usage?.scroll_to_top).toHaveBeenCalledTimes(3)
        expect(cdx.refs.entity_usage?.clear).toHaveBeenCalledTimes(3)
        expect(cdx.item_info).toHaveBeenCalledTimes(1)
        expect(cdx.item_info).toHaveBeenLastCalledWith(genericProto)
        expect(cdx.entity_view).toEqual({id: "id", type: "item"})
    })

    test("item_info forwards to recipeInfo", () => {
        let cdx = new Codex(1 as PlayerIndex)

        let player = {
            force: "testforce"
        }
        // @ts-ignore
        game.get_player.mockReturnValue(player)

        cdx.refs = {
            entity_usage: "entityUsage" as unknown as ScrollPaneGuiElement
        }

        cdx.item_info("itemProto" as unknown as LuaItemPrototype)

        expect(game.get_player).toHaveBeenCalledTimes(1)
        expect(game.get_player).toBeCalledWith(1)
        expect(RecipeInfo.build_gui).toHaveBeenCalledTimes(1)
        expect(RecipeInfo.build_gui).toBeCalledWith("entityUsage", "itemProto", "testforce")
    })

    test("tech_info forwards to techInfo", () => {
        let cdx = new Codex(1 as PlayerIndex)

        cdx.refs = {
            entity_usage: "entityUsage" as unknown as ScrollPaneGuiElement
        }

        cdx.tech_info("techProto" as unknown as LuaTechnologyPrototype)

        expect(TechnologyInfo.build_gui).toHaveBeenCalledTimes(1)
        expect(TechnologyInfo.build_gui).toBeCalledWith("entityUsage", "techProto")
    })

    test("fluid_info forwards to recipeInfo", () => {
        let cdx = new Codex(1 as PlayerIndex)

        let player = {
            force: "testforce"
        }
        // @ts-ignore
        game.get_player.mockReturnValue(player)

        cdx.refs = {
            entity_usage: "entityUsage" as unknown as ScrollPaneGuiElement,
            entity_color: {style: {}} as ProgressBarGuiElement
        }

        let fluidProto = {base_color: {a: 0.5, r: 1, b: 0.1960784313725490}}
        cdx.fluid_info(fluidProto as unknown as LuaFluidPrototype)

        expect(game.get_player).toHaveBeenCalledTimes(1)
        expect(game.get_player).toBeCalledWith(1)
        expect(cdx.refs.entity_color).toEqual({
            style: {color: fluidProto.base_color},
            tooltip: "Red:   255\nGreen: 0\nBlue:  50",
            visible: true
        })
        expect(RecipeInfo.build_gui).toHaveBeenCalledTimes(1)
        expect(RecipeInfo.build_gui).toBeCalledWith("entityUsage", fluidProto, "testforce")
    })
})