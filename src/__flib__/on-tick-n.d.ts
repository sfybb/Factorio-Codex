interface FLIBTaskIdent {
    tick: uint,
    index: uint
}

/** @noResolution */
declare module "__flib__.on-tick-n" {
    export function init(): void;

    export function retrieve(tick: uint): undefined | any[];
    export function add(tick: uint, task: any): FLIBTaskIdent;
    export function remove(task: FLIBTaskIdent): void;
}