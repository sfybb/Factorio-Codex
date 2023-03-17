import "logging"
/** @noResolution */
import Features from "Features"

// https://mods.factorio.com/mod/gvv
if (Features.supports("gvv")) require("@NoResolution:__gvv__.gvv")();


export type Task = {
    gui: string,
    player_index: PlayerIndex,

    [key: string]: any
}
export interface TaskExecutor {
    execute_task(task: Task): void;
}


import PlayerData from "PlayerData"
import Migration from "Migration"

/** @noResolution */
import * as FLIB_gui from "__flib__.gui"
/** @noResolution */
import * as FLIB_on_tick_n from "__flib__.on-tick-n"



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
            if (typeof taskData != "object" || typeof taskData.gui != "string" || typeof taskData.player_index != "number") {
                $log_warn!(`Unknown task type: ${typeof taskData}! Contents: ${serpent.line(taskData)}`)
                continue
            }
            let task = taskData as Task

            let taskExecutor: undefined | TaskExecutor;
            if (task.gui == "qs") {
                taskExecutor = PlayerData.getQuickSearch(task.player_index)
            } else if (task.gui == "codex") {
                taskExecutor = PlayerData.getCodex(task.player_index)
            }

            if (taskExecutor != undefined) taskExecutor.execute_task(task)
        }
    }
})

FLIB_gui.hook_events((e) => {
    let action = FLIB_gui.read_action(e)

    if ( action != undefined ) {
        if ( action.startsWith("qs_") ) {
            PlayerData.getQuickSearch(e)?.gui_action(action, e)
        } else if ( action.startsWith("cx_") ) {
            PlayerData.getCodex(e)?.gui_action(action, e)
        } else if ( action == "toggle_list_collapse" ) {
            let parent_ele = e.element?.parent?.parent
            if (parent_ele != undefined && parent_ele["list_container"] != undefined) {
                parent_ele["list_container"].visible = !parent_ele["list_container"].visible
            }
        } else {
            $log_warn!(`Unknown action "${action}" cannot assign action to gui!`)
        }
    }
})