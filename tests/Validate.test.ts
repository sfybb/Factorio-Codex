import {describe, expect, test, jest} from '@jest/globals';

import verify, {Verifiable, Verifyinfo} from "../src/Validate";
import {validate_status} from "../src/Util";

global.$log_debug = jest.fn()

// @ts-ignore
global.serpent = { line: jest.fn() }

type testVerifiable = {
    get_verify_info(): Verifyinfo[],
    [key: string]: any
};
describe("Validate module", () => {
    test("verify", () => {
        let testObj: testVerifiable = {
            get_verify_info(): Verifyinfo[] {
                return [
                    {field: "test1", type: "number"},
                    {field: "test2", type: "number", value: 5},
                    {field: "test3", type: "object", content: [
                            {field: "a", type: "boolean", value: true}
                        ]},
                ];
            },
            test3: {}
        }
        let s = verify(testObj)
        expect(s).toEqual(validate_status.ERROR)
        expect(testObj).toEqual({
            get_verify_info: testObj.get_verify_info,
            test2: 5,
            test3: {
                a: true
            }
        })
    })
})