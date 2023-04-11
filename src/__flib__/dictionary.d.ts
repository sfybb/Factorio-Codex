// @noSelfInFile

declare class FLIBRawDictionary {
    batch_i: number
    dict_i: number
    total: number

    // internal
    ref: LocalisedString
    strings: LocalisedString
    name: string

    add(internal: string, translation: LocalisedString): void;
}

interface FLIBTranslationFinishedOutput {
    language: string,
    dictionaries: LuaTable<string, LuaTable<string, string>>,
    players: PlayerIndex[]
}



/** @noResolution */
declare module "__flib__.dictionary" {
    function _new(name: string,
                  keep_untranslated?: boolean,
                  initial_contents?: LuaTable<string, LocalisedString>): FLIBRawDictionary;
    export {_new as new};

    export function init(): void;

    export function load(): void;

    export function translate(player: LuaPlayer): void;
    export function check_skipped(): void;

    export function process_translation(event_data: OnStringTranslatedEvent): undefined | FLIBTranslationFinishedOutput;


    export function cancel_translation(player_index: PlayerIndex): void;
    export function set_use_local_storage(value: boolean): void;
}