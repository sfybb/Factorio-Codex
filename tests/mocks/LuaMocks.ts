// @ts-nocheck
import "./StringMock"
import {jest} from "@jest/globals";
import {table} from "factorio:runtime";
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
            if (step == 0 || (step > 0 && start > limit) || (step < 0 && start < limit)) return

            for (let i = start; i != limit; i += step) yield i;
            yield limit;
        }
    }
}

function table_size(t: table): number {
    if (t instanceof Map) {
        return t.size
    } else if (t instanceof Set) {
        return t.size
    }
    return Object.keys(t).length
}

global.$range = rangeMock
global.LuaSet = Set
global.LuaMap = Map
global.LuaTable = LuaTableMock
global.setmetatable = jest.fn()
global.table_size = table_size
global.table = {
    concat(list: (string | number)[], sep?: string, i?: number, j?: number): string {
        // TODO invalid implementation
        return list.join(sep)
    },

    insert<T>(list: T[], value: T): void {
        list.push(value)
    },

    insert<T>(list: T[], pos: number, value: T): void {
        list.splice(pos - 1, 0 , value)
    },

    remove<T>(list: T[], pos?: number): T | undefined {
        return list.splice(pos - 1, 1)[0]
    },

    sort<T>(list: T[], comp?: (a: T, b: T) => boolean): void {
        list.sort((a: T, b: T) => comp(a,b) ? -1 : 1)
    }
}