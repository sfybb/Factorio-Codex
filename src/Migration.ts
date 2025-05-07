import { ConfigurationChangedData } from "factorio:runtime";

/** @noResolution */
import * as FLIB_migration from "__flib__.migration"
import Features from "Features";
import {GameEventRegistry} from "./events/eventRegistry";
import {fcRebuildAll} from "./core/commands";

const migrations = {
    ["0.0.99"]: require("migrations/migrate_0_0_99")
}

class Migration {
    static migrate(this: any, e: ConfigurationChangedData): void {
        $log_info!("Checking for migration")

        if ( FLIB_migration.on_config_changed(e, migrations, undefined) ) {
            $log_info!("Migration scripts done")

            $log_info!("Invalidating and rebuilding caches")
            fcRebuildAll();

            Migration.modCompatCheck()

            $log_info!("Migration done")
        }
    }

    static modCompatCheck(): void {
        $log_info!("Checking for incompatible mod combinations...")
        if (Features.supports("localised_fallback") && Features.supports("dictionary")) {
            $log_crit_raw!(`FLib version ${game.active_mods["flib"]
            } does not support Factorio versions above 1.1.74! Please update FLib to at least version 0.12.0!`)
        }
    }
}

GameEventRegistry.register("on_configuration_changed", Migration.migrate)

export default Migration