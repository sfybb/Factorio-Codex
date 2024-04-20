// @noSelfInFile

type EventHandler<E extends FactorioRuntime.EventData> = (e: E) => void
type NthTickEventHandler = (e: NthTickEventHandler) => void

/** @noResolution */
declare module "__core__.lualib.event_handler" {
    export type LuaLibrary = {
        on_init?: () => void | undefined,
        on_load?: () => void | undefined,
        on_configuration_changed?: (e: FactorioRuntime.ConfigurationChangedData) => void | undefined,

        events?: { [key: FactorioRuntime.EventId<any, FactorioRuntime.table> | string]: EventHandler<any> },
        on_nth_tick?: { [key: number]: NthTickEventHandler }
    };

    export function add_lib(lib: LuaLibrary): void;

    export function add_libraries(libs: LuaLibrary[]): void;
}