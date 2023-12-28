// @noSelfInFile

// Translations are identified by their internal key. If the translation failed, then it will not be present. Locale
// fallback groups can be used if every key needs a guaranteed translation.
type FLIBTranslatedDictionary = LuaTable<string, string>

// Localised strings identified by an internal key. Keys must be unique and language-agnostic.
type FLIBDictionary = LuaTable<string, LocalisedString>

/** @noResolution */
declare module "__flib__.dictionary-lite" {
    export interface OnDictionaryReadyEvent extends EventData {
        readonly player_index: PlayerIndex;
    }

    export interface OnPlayerLanguageChangedEvent extends EventData {
        readonly player_index: PlayerIndex;
        readonly language: string;
    }

    // Called when a player's dictionaries are ready to be used. Handling this event is not required.
    export const on_player_dictionaries_ready: CustomEventId<LuaTable>;

    // Called when a player's language changes. Handling this event is not required.
    export const on_player_language_changed: CustomEventId<LuaTable>;

    export const events: { [key: EventId<any>]: (e: EventData) => void };


    // Lifecycle handlers

    export function on_init(): void;

    export function on_configuration_changed(): void;

    export function on_tick(): void;

    export function on_string_translated(eventData: OnStringTranslatedEvent): void;

    export function on_player_joined_game(eventData: OnPlayerJoinedGameEvent): void;


    // Handle all non-bootstrap events with default event handlers. Will not overwrite any existing handlers. If you have
    // custom handlers for on_tick, on_string_translated, or on_player_joined_game, ensure that you call the corresponding
    // module lifecycle handler..
    export function handle_events(): void;


    // Dictionary functions

    // Create a new dictionary. The name must be unique.
    function _new(name: string, initial_strings?: FLIBDictionary): void;
    export {_new as new};

    // Add the given string to the dictionary.
    export function add(dict_name: string, key: string, localised: LocalisedString): void;

    // Get all dictionaries for the player. Will return `nil` if the player's language has not finished translating.
    export function get_all(player_index: PlayerIndex): undefined | LuaTable<string, FLIBTranslatedDictionary>;

    // Get the specified dictionary for the player. Will return `nil` if the dictionary has not finished translating.
    export function get(player_index: PlayerIndex, dict_name: string): undefined | FLIBTranslatedDictionary;
}