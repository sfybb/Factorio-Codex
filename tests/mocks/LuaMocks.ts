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

function rangeMock(start: number, limit: number, step?: number): Iterable<number> {
    step = step == undefined ? 1 : step
    return {
        *[Symbol.iterator]() {
            for (let i = start; i != limit; i += step) yield i;
            yield limit;
        }
    }
}

global.$range = rangeMock
global.LuaSet = Set
global.LuaTable = LuaTableMock
global.setmetatable = () => {}