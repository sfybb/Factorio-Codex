import "ui/uiEvents"
import "events/startupEvents"
import "core/QuickSearch"
import "core/commands"
import "core/Dictionary"
import "./Migration"
import {GameEventRegistry} from "./events/eventRegistry";

/** @noResolution */
import Features from "Features"
/** @noResolution */
import * as EventHandler from "__core__.lualib.event_handler";

declare let storage: any

// https://mods.factorio.com/mod/gvv
if (Features.supports("gvv")) {
    require("@NoResolution:__gvv__.gvv")();
    $log_debug!("Registered gvv hook")
}

EventHandler.add_lib(GameEventRegistry.getEvents())

$log_debug!("Registered events")
$log_trace!(`Data stored: ${serpent.block(storage, {nocode: true})}`)