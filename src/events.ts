import "logging"
/** @noResolution */
import Features from "Features"

// https://mods.factorio.com/mod/gvv
if (Features.supports("gvv")) require("@NoResolution:__gvv__.gvv")();

import {Task, TaskExecutor} from "Task";
import PlayerData from "PlayerData"
import Migration from "Migration"

/** @noResolution */
import * as FLIB_gui from "__flib__.gui"
/** @noResolution */
import * as FLIB_on_tick_n from "__flib__.on-tick-n"
import Dictionary from "Dictionary";
import {GuiAction} from "IGuiRoot";


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

script.on_event(defines.events.on_player_created, PlayerData.create_player)
script.on_event(defines.events.on_player_joined_game, PlayerData.player_update)
script.on_event(defines.events.on_player_left_game, PlayerData.cancel_player_update)

script.on_event(defines.events.on_string_translated, PlayerData.string_translated)

script.on_event(defines.events.on_tick, (e) => {
    PlayerData.check_skipped()

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
    let action = FLIB_gui.read_action(e)

    if ( action != undefined ) {
        // @ts-ignore
        let trypart = (this: any, action: FLIBGuiAction) => {
            let guiAction: GuiAction

            if ( typeof action == "object" && typeof action.gui == "string" && typeof action.action == "string") {
                guiAction = action as GuiAction

                switch (guiAction.gui) {
                    case "quick_search":
                        PlayerData.getQuickSearch(e)?.gui_action(guiAction, e)
                        break
                    case "codex":
                        PlayerData.getCodex(e)?.gui_action(guiAction, e)
                        break
                    default:
                        $log_warn!(`Unknown gui identifier "${guiAction.gui}" cannot assign action "${guiAction.action}" to gui!`)
                }
            } else if (action == "toggle_list_collapse") {
                let parent_ele = e.element?.parent?.parent
                if (parent_ele != undefined && parent_ele["list_container"] != undefined) {
                    parent_ele["list_container"].visible = !parent_ele["list_container"].visible
                }
            } else {
                $log_warn!(`Unknown action "${action}" cannot assign action to gui!`)
            }
        }

        xpcall(trypart, errorHandler, undefined, action)
    }
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