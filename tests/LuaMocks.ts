// @ts-nocheck
import "./StringMock"
class LuaTableMock {
    constructor() {
    }
    set(i: any, v: any) {
        this[i] = v
    }
}

global.LuaTable = LuaTableMock