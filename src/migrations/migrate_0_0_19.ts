import {player_table} from "PlayerData";

declare const global: {
    players?: player_table
}

function migration() {
    $log_info!("Applying migrations for 0.0.19")

    if (global.players == undefined) {
        global.players = new LuaTable()
    }

    for (let [pId, data] of global.players) {
        if (data.codex != undefined) {
            let codex = data.codex
            codex.historyList = []
            codex.historyPosition = -1
        }
    }
}

export = migration