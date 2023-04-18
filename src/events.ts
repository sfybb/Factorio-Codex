import "logging"
/** @noResolution */
import Features from "Features"

// https://mods.factorio.com/mod/gvv
if (Features.supports("gvv")) require("@NoResolution:__gvv__.gvv")();

import {Task, TaskExecutor} from "Task";
import Dictionary from "Dictionary";
import PlayerData from "PlayerData";
import {GuiAction} from "IGuiRoot";
import Migration from "Migration";

/** @noResolution */
import * as FLIB_gui from "__flib__.gui"
/** @noResolution */
import * as FLIB_on_tick_n from "__flib__.on-tick-n"


const errorHandler = (err: any) => {
    $log_crit_ng!(`Critical error: ${err}`)
    $log_crit!(`An unknown critical error occurred. Details are in the log file`)
}

script.on_init(() => {
    FLIB_on_tick_n.init()
    PlayerData.Init()
})

script.on_load(() => {
    PlayerData.Load()
})

script.on_configuration_changed(Migration.migrate)

script.on_event("fcodex_toggle_quick_search", (e) => {
    $log_debug!(`Shortcut key pressed! Opening Quick Search for ${game.get_player(e.player_index)?.name}`)
    PlayerData.getQuickSearch(e)?.toggle()
})

script.on_event(defines.events.on_player_created, (e: OnPlayerCreatedEvent) => {
    Dictionary.translate(e.player_index)
    PlayerData.get(e)
})

script.on_event(defines.events.on_player_joined_game, (e: OnPlayerJoinedGameEvent) => {
    Dictionary.translate(e.player_index)
})
script.on_event(defines.events.on_player_left_game, (e: OnPlayerLeftGameEvent) => {
    Dictionary.cancel_translate(e.player_index)
})

script.on_event(defines.events.on_string_translated, (e: OnStringTranslatedEvent) => {
    Dictionary.string_translated(e)
})

script.on_event(defines.events.on_tick, (e) => {
    Dictionary.check_skipped()

    let tasks = FLIB_on_tick_n.retrieve(e.tick)
    if (tasks != undefined) {
        for (let taskData of tasks) {
            if (typeof taskData != "object" || typeof taskData.type != "string" || typeof taskData.player_index != "number") {
                $log_warn!(`Unknown task type: ${typeof taskData}! Contents: ${serpent.line(taskData)}`)
                continue
            }
            let task = taskData as Task

            if (task.type == "gui") {
                let taskExecutor: undefined | TaskExecutor;
                if (task.gui == "qs") {
                    taskExecutor = PlayerData.getQuickSearch(task.player_index)
                } else if (task.gui == "codex") {
                    taskExecutor = PlayerData.getCodex(task.player_index)
                }

                if (taskExecutor != undefined) {
                    xpcall(taskExecutor.execute_task, errorHandler, taskExecutor, task)
                }
            } else if (task.type == "command") {
                if (task.command == "fc-rebuild-all") {
                    PlayerData.Rebuild()
                    Dictionary.Rebuild()
                    game.print("[color=green]Rebuild complete. Waiting for translation to finish...[/color]")
                }
            }
        }
    }
})

FLIB_gui.hook_events((e) => {
    xpcall(PlayerData.handleUIEvents, errorHandler, undefined, FLIB_gui.read_action(e), e)
})

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

    let task: Task = {
        type: "command",
        command: "fc-rebuild-all",
        player_index: e.player_index,
    }

    FLIB_on_tick_n.add(game.tick + 1, task)
})