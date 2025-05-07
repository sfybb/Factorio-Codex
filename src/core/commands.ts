import {TaskBaseData, TaskScheduler} from "../events/taskScheduler";
import Dictionary from "./Dictionary";
import {DeleteData} from "./dataHandler";
import {PlayerIndex} from "factorio:runtime";

commands.add_command("fc-rebuild-all", [ "command-help.fc-rebuild-all" ], (e) => {
    if (e.player_index == undefined) {
        $log_warn!(`Unable to run command "fc-rebuild-all": Invalid command args, no player index! ${serpent.line(e, {comment: false})}`)
        return;
    }

    let player = game.get_player(e.player_index)
    if (player?.admin != true) {
        $log_info!(`Player ${e.player_index} "${player?.name}" tried to run command "fc-rebuild-all" but is not admin`)
        player?.print(["cant-run-command-not-admin", "fc-rebuild-all"])
        return
    }

    $log_info!(`Player ${e.player_index} "${player.name}" triggered a complete rebuild`)
    game.print("[color=red]Rebuilding Factorio Codex[/color]")
    fcRebuildAll();
})

export function fcRebuildAll() {
    let task: TaskBaseData = {
        handler_id: "fc-rebuild-all",
        player_index: 0 as PlayerIndex
    }

    TaskScheduler.scheduleTask(task);
}


function executeFcRebuildAll(this: any) {
    $log_info!("Executing rebuild...")
    DeleteData();
    Dictionary.Rebuild()

    //game.print("[color=green]Rebuild complete. Waiting for translation to finish...[/color]")
}

TaskScheduler.register("fc-rebuild-all", executeFcRebuildAll);