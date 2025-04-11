// @noSelfInFile

import CustomEventId = FactorioRuntime.CustomEventId;
import table = FactorioRuntime.table;

type EventHandler<E extends FactorioRuntime.EventData> = (e: E) => void | unknown
type NthTickEventHandler = (e: NthTickEventHandler) => void | unknown
type AnyEventId<T extends table> = CustomEventId<T> | FactorioRuntime.EventId<any, T> | string

/** @noResolution */
declare module "__core__.lualib.event_handler" {
    export type LuaLibrary = {
        on_init?: () => void | unknown,
        on_load?: () => void | unknown,
        on_configuration_changed?: (this: void, e: FactorioRuntime.ConfigurationChangedData) => void | unknown,

        events?: { [key: AnyEventId<any>]: EventHandler<any> },
        on_nth_tick?: { [key: number]: NthTickEventHandler }
    };

    export function add_lib(lib: LuaLibrary): void;

    export function add_libraries(libs: LuaLibrary[]): void;
}