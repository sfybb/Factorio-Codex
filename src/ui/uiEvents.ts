import {EventCallback, EventRegistry, GameEventRegistry} from "../events/eventRegistry";

let reverseEventIdMap: LuaMap<any, string> = new LuaMap()

export class UiEventHandler {
    static uis: LuaMap<string, EventRegistry> = new LuaMap()

    static addUi(id: string, events?: {[k: string]: EventCallback}) {
        let initial_events = (events ?? new LuaMap()) as unknown as LuaMap<string, EventCallback>

        if (this.uis.has(id)) return;
        let new_registry: EventRegistry = new EventRegistry()
        this.uis.set(id, new_registry)

        for (let [eventName, callback] of Object.entries(initial_events))  {
            new_registry.register(eventName, callback);
        }
    }

    static registerUiEvent(id: string, eventName: string, callback: EventCallback): UiEventHandler  {
        let reg = this.uis.get(id)
        if (reg) {
            reg.register(eventName, callback);
        }
        return this;
    }

    static dispatchUiEvent(id: string, eventName: string, payload: GuiEventData) {
        this.uis.get(id)?.dispatch(eventName, payload)
    }
}

function uiEventHandler(this: any, payload: GuiEventData) {
    let gui_id = payload.element?.tags["gui"] ?? null;

    if (typeof gui_id != "string") {
        //$log_trace!(`Unknown gui id ${gui_id}, ignoring event`);
        return;
    }

    let event_name = reverseEventIdMap.get(payload.name)
    if (!event_name) return;

    UiEventHandler.dispatchUiEvent(gui_id, event_name, payload)
}

Object.keys(defines.events)
    .filter(value => value.startsWith("on_gui_"))
    .forEach(event_name => {
        GameEventRegistry.register(event_name, uiEventHandler)

        // @ts-ignore
        reverseEventIdMap.set(defines.events[event_name], event_name)
    })