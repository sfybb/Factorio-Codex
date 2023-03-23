import {describe, expect, test, jest} from '@jest/globals';

global.log = console.log
// @ts-ignore
global.$log_info = jest.fn()
// @ts-ignore
global.$log_warn = jest.fn()

// @ts-ignore
global.script = {
    active_mods: {
        "gvv": "0"
    }
}

import Features, {Feature_ids} from "../src/Features";

describe("Feature module", () => {
    test("Support check", () => {
        expect(Features.supports(Feature_ids.gvv)).toBeTruthy()
    })

    test("Doesnt support  check", () => {
        expect(Features.supports(Feature_ids.dictionary)).toBeFalsy()
        expect(Features.supports(Feature_ids.dictionary_lite)).toBeFalsy()
    })
})