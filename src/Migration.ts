import { ConfigurationChangedData } from "factorio:runtime";
import {default as PlayerData, player_table} from "PlayerData";
import CacheManager from "Cache";
import Dict from "Dictionary";

/** @noResolution */
import * as FLIB_migration from "__flib__.migration"
import Features from "Features";

const migrations = {
    ["0.0.21"]: require("migrations/migrate_0_0_21")
}

declare const storage: {
    players?: player_table
    cache?: CacheManager
}

class Migration {
    static migrate(this: any, e: ConfigurationChangedData): void {
        $log_info!("Checking for migration")

        if ( FLIB_migration.on_config_changed(e, migrations, undefined) ) {
            $log_info!("Migration scripts done")

            $log_info!("Running validation")
            PlayerData.LoadMetatables()
            PlayerData.validate()

            $log_info!("Invalidating and rebuilding caches")
            storage.cache?.RebuildAll()
            Dict.Rebuild()

            Migration.modCompatCheck()

            $log_info!("Running final migration actions")
            Migration.refresh_guis()

            $log_info!("Migration done")
        }
    }

    static refresh_guis(): void {
        if (storage.players == undefined) return


        for (let [, player_data] of storage.players) {
            if (player_data.quick_search != undefined) {
                player_data.quick_search.set_rebuild_gui()
            }

            let quick_search_open = player_data.quick_search?.is_open()

            if ( quick_search_open == true ) {
                player_data.quick_search.close()
                player_data.quick_search.open()
            }
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

export default Migration