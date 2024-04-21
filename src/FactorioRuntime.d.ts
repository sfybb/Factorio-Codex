// @noSelfInFile

// Declaring Runtime imports for usage in ambient (global) modules
declare namespace FactorioRuntime {
    type uint = import("factorio:runtime").uint;
    type Tags = import("factorio:runtime").Tags;
    type table = import("factorio:runtime").table;
    type EventId<T extends object, F = unknown> = import("factorio:runtime").EventId<T, F>;
    type GuiAnchor = import("factorio:runtime").GuiAnchor;
    type EventData = import("factorio:runtime").EventData;
    type LuaPlayer = import("factorio:runtime").LuaPlayer;
    type SpritePath = import("factorio:runtime").SpritePath;
    type PlayerIndex = import("factorio:runtime").PlayerIndex;
    type LuaGuiElement = import("factorio:runtime").LuaGuiElement;
    type CustomEventId<T extends table> = import("factorio:runtime").CustomEventId<T>;
    type GuiElementType = import("factorio:runtime").GuiElementType;
    type FlowGuiElement = import("factorio:runtime").FlowGuiElement;
    type LuaCustomTable<K extends string | number, V> = import("factorio:runtime").LuaCustomTable<K, V>;
    type FrameGuiElement = import("factorio:runtime").FrameGuiElement;
    type OnGuiClickEvent = import("factorio:runtime").OnGuiClickEvent;
    type LocalisedString = import("factorio:runtime").LocalisedString;
    type OnGuiClosedEvent = import("factorio:runtime").OnGuiClosedEvent;
    type OnGuiOpenedEvent = import("factorio:runtime").OnGuiOpenedEvent;
    type OnGuiConfirmedEvent = import("factorio:runtime").OnGuiConfirmedEvent;
    type OnGuiTextChangedEvent = import("factorio:runtime").OnGuiTextChangedEvent;
    type OnGuiElemChangedEvent = import("factorio:runtime").OnGuiElemChangedEvent;
    type MouseButtonFlagsWrite = import("factorio:runtime").MouseButtonFlagsWrite;
    type OnGuiValueChangedEvent = import("factorio:runtime").OnGuiValueChangedEvent;
    type OnStringTranslatedEvent = import("factorio:runtime").OnStringTranslatedEvent;
    type OnPlayerJoinedGameEvent = import("factorio:runtime").OnPlayerJoinedGameEvent;
    type ConfigurationChangedData = import("factorio:runtime").ConfigurationChangedData;
    type OnGuiLocationChangedEvent = import("factorio:runtime").OnGuiLocationChangedEvent;
    type OnGuiSwitchStateChangedEvent = import("factorio:runtime").OnGuiSwitchStateChangedEvent;
    type OnGuiSelectedTabChangedEvent = import("factorio:runtime").OnGuiSelectedTabChangedEvent;
    type OnGuiCheckedStateChangedEvent = import("factorio:runtime").OnGuiCheckedStateChangedEvent;
}