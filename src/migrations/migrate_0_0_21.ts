/* I've become death destroyer of data */
import PlayerData from "../PlayerData";

function migration() {
    $log_info!("Deleting Da... Ehm - Applying migrations for 0.1.0")

    // delete everything
    PlayerData.Init()
}

export = migration