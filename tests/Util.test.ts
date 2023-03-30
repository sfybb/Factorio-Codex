import {describe, expect, test, jest} from '@jest/globals';

import "./mocks/StringMock"

import util, {validate_status, validate_print_info} from "../src/Util";


describe("Util module", () => {
    test("format_validate_msg prints with fixed width", () => {
        const objectName = "[object Object]"
        const print_info = {
            width: 27,
            indent_step: "- -",
            current_indent: ":)"
        }
        expect(util.format_validate_msg(print_info, objectName, validate_status.OK))
            .toBe(":)" + objectName + "            [OK]")

        expect(util.format_validate_msg(print_info, objectName+objectName, validate_status.OK))
            .toBe(":)" + objectName+objectName + "[OK]")
    });

    test("format_validate_msg prints different states", () => {
        const print_info = {
            width: 0,
            indent_step: "",
            current_indent: ""
        }
        expect(util.format_validate_msg(print_info, "", validate_status.OK)).toBe("[OK]")
        expect(util.format_validate_msg(print_info, "", validate_status.FIXABLE)).toBe("[FIXABLE]")
        expect(util.format_validate_msg(print_info, "", validate_status.FIXED)).toBe("[FIXED]")
        expect(util.format_validate_msg(print_info, "", validate_status.ERROR)).toBe("[ERROR]")
    });

    test("normalize_version", () => {
        expect(util.normalize_version("1.1.1")).toBe("00001.00001.00001")
        expect(util.normalize_version("12345.1")).toBe("12345.00001")
    });
});