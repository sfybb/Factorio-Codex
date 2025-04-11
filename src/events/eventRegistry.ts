import {LuaLibrary} from "__core__.lualib.event_handler";
import {$safe_call} from "../util/Util";

export type EventCallback = (this: any, payload?: any) => void | unknown;

export class EventRegistry {
    handlers: LuaMap<AnyEventId<any>, EventCallback> = new LuaMap();

    register(eventName: AnyEventId<any>, callback: EventCallback) {
        if (this.handlers.has(eventName)) {
            throw new Error(`Event ${eventName} already has a registered handler!`);
        }
        this.handlers.set(eventName, callback);
    }

    dispatch(eventName: AnyEventId<any>, payload?: any) {
        if (!this.handlers.has(eventName)) {
            $log_trace!(`Failed to dispatch event ${eventName}: No registered handler!`);
            return;
        }

        if (eventName != "on_tick")
            $log_trace!(`Dispatching event: ${eventName}${payload != undefined ? " with payload: " + serpent.line(payload) : ""}`);
        $safe_call!(this.handlers.get(eventName), undefined, payload);
    }
}

export class GameEventRegistry {
    static registry: EventRegistry = new EventRegistry();

    static register(eventName: AnyEventId<any>, callback: EventCallback) {
        this.registry.register(eventName, callback);
    }

    static getEvents(): LuaLibrary {
        let lib: LuaLibrary = {
            on_init: () => this.registry.dispatch("on_init"),
            on_load: () => this.registry.dispatch("on_load"),
            on_configuration_changed: (e: any) => this.registry.dispatch("on_configuration_changed", e),
        };

        let events: typeof lib.events = {}

        for (let [id, _] of this.registry.handlers) {
            if (id == "on_init" || id == "on_load" || id == "on_configuration_changed") continue

            events[id] = (e) => this.registry.dispatch(id, e);
        }

        lib.events = events;
        $log_trace!(`Registered events: ${serpent.block(lib, {nocode: true})}`)
        return lib;
    }
}