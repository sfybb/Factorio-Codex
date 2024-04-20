// @noSelfInFile

declare class FLIBRawDictionary {
    batch_i: number
    dict_i: number
    total: number

    // internal
    ref: FactorioRuntime.LocalisedString
    strings: FactorioRuntime.LocalisedString
    name: string

    add(internal: string, translation: FactorioRuntime.LocalisedString): void;
}

interface FLIBTranslationFinishedOutput {
    language: string,
    dictionaries: LuaTable<string, LuaTable<string, string>>,
    players: FactorioRuntime.PlayerIndex[]
}



/** @noResolution */
declare module "__flib__.dictionary" {
    function _new(name: string,
                  keep_untranslated?: boolean,
                  initial_contents?: LuaTable<string, FactorioRuntime.LocalisedString>): FLIBRawDictionary;
    export {_new as new};

    export function init(): void;

    export function load(): void;

    export function translate(player: FactorioRuntime.LuaPlayer): void;
    export function check_skipped(): void;

    export function process_translation(event_data: FactorioRuntime.OnStringTranslatedEvent): undefined | FLIBTranslationFinishedOutput;


    export function cancel_translation(player_index: FactorioRuntime.PlayerIndex): void;
    export function set_use_local_storage(value: boolean): void;
}