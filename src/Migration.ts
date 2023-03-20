import PlayerData, {player_table} from "PlayerData";
import Dict from "Dictionary";

/** @noResolution */
import * as FLIB_migration from "__flib__.migration"

const migrations = {
    ["0.0.10"]: require("migrations/migrate_0_0_10"),
    ["0.0.12"]: require("migrations/migrate_0_0_12"),
    ["0.0.15"]: require("migrations/migrate_0_0_15"),
}

declare const global: {
    players?: player_table
}

class Migration {
    static migrate(this: void, e: ConfigurationChangedData): void {
        $log_info!("Checking for migration")

        if ( FLIB_migration.on_config_changed(e, migrations, undefined) ) {
            $log_info!("Migration scripts done")

            $log_info!("Running validation")
            PlayerData.LoadMetatables()
            PlayerData.validate()

            $log_info!("Invalidating and rebuilding caches")
            //global.cache.rebuild_all()
            Dict.Rebuild()

            $log_info!("Running final migration actions")
            Migration.refresh_guis()

            $log_info!("Migration done")
        } else {
            $log_info!("Nothing to do!")
        }
    }

    static refresh_guis(): void {
        if (global.players == undefined) return


        for (let [, player_data] of global.players) {
            if (player_data.quick_search != undefined) {
                player_data.quick_search.set_rebuild_gui()
            }

            /*if (player_data.codex != undefined) {
                player_data.codex.set_rebuild_gui()
            } TODO */

            let quick_search_open = player_data.quick_search?.is_open()

            /*if ( player_data.codex?.is_open() == true ) {
                player_data.codex.close()
                player_data.codex.open()

                if ( player_data.codex.entity_view != undefined ) {
                    let entity_view = player_data.codex.entity_view
                    player_data.codex.show_info(entity_view.id, entity_view.type)
                }
            } TODO */

            if ( quick_search_open == true ) {
                player_data.quick_search.close()
                player_data.quick_search.open()
            }
        }
    }
}

export default Migration