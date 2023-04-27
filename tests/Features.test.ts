import {describe, expect, test, jest} from '@jest/globals';

import "./mocks/BaseMocks";
// @ts-ignore
global.script.active_mods = {
    "gvv": "0"
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