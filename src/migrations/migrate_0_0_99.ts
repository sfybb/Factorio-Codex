/* I've become death destroyer of data */

/** @noResolution */
import * as FLIB_dictionary_lite from "__flib__.dictionary";
import {GameEventRegistry} from "../events/eventRegistry";

declare let storage: any

function migration() {
    $log_info!("Deleting Da... Ehm - Applying migrations for 0.1.0")

    // delete everything
    storage = {}

    // Initialize
    FLIB_dictionary_lite.on_init()
    GameEventRegistry.registry.dispatch("on_init")
}

export = migration