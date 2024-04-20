// @noSelfInFile
interface FLIBTaskIdent {
    tick: FactorioRuntime.uint,
    index: FactorioRuntime.uint
}

/** @noResolution */
declare module "__flib__.on-tick-n" {
    export function init(): void;

    export function retrieve(tick: FactorioRuntime.uint): undefined | any[];
    export function add(tick: FactorioRuntime.uint, task: any): FLIBTaskIdent;
    export function remove(task: FLIBTaskIdent): void;
}