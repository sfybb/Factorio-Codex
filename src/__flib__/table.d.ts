type FLIBArray<T> = T[] | LuaCustomTable<number, T>
type FLIBObject = object | LuaCustomTable<number, any> | LuaCustomTable<string, any>

/** @noResolution */
declare module "__flib__.table" {
    export function array_copy(arr: FLIBArray<any>): any[];

    export function array_merge(arrays: FLIBArray<FLIBArray<any>>): any[];
    export function deep_compare(tbl1: FLIBObject, tbl2: FLIBObject): boolean;

    export function deep_copy(tbl: FLIBObject): FLIBObject;

    export function deep_merge(tables: FLIBObject[]): FLIBObject;

    // ....

    export function shallow_copy(tbl: FLIBObject, use_rawset?: boolean): FLIBObject;
}