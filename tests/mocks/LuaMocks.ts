// @ts-nocheck
import "./StringMock"
class LuaTableMock {
    constructor() {
    }
    set(k: any, v: any) {
        this[k] = v
    }

    has(k: any) {
        return this[k] !== undefined
    }

    get(k: any) {
        return this[k]
    }

    *[Symbol.iterator]() {
        yield* Object.entries(this)
    }

}

global.LuaSet = Set
global.LuaTable = LuaTableMock