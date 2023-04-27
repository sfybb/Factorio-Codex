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
})