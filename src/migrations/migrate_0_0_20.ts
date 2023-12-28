/** @noResolution */
import * as FLIB_dictionary_lite from "__flib__.dictionary-lite";

function migration() {
    $log_info!("Applying migrations for 0.0.20")

    FLIB_dictionary_lite.on_init()
}

export = migration