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
import * as EventHandler from "__core__.lualib.event_handler"
/** @noResolution */
import * as FLIB_gui from "__flib__.gui"
/** @noResolution */
import * as FLIB_on_tick_n from "__flib__.on-tick-n"
/** @noResolution */
import * as FLIB_dictionary_lite from "__flib__.dictionary-lite";
import {getDictionaryCache} from "./cache/DictionaryCache";


const errorHandler = (err: any): void => {
    $log_crit!("An unknown critical error occurred", `Thrown exception: ${serpent.line(err, {comment: false})}`)
}

function $safe_call<This, Args extends any[], R>(
    f: ((this: This, ...args: Args) => R) | ((...args: Args) => R) | undefined,
    context: This,
    ...args: Args
): LuaMultiReturn<[true, R] | [false, void]> {
    if (f != undefined) {
        return xpcall(f, errorHandler, context, ...args)
    } else {
        return $multi<[false, void]>(false)
    }
}

namespace Events {
    export function on_init() {
        FLIB_on_tick_n.init()
        $safe_call!(PlayerData.Init, undefined)
    }

    export function on_load() {
        $safe_call!(PlayerData.Load, undefined)
    }

    export function on_configuration_changed(e: ConfigurationChangedData) {
        $safe_call!(Migration.migrate, undefined, e)
    }


    export function on_player_created(e: OnPlayerCreatedEvent) {
        PlayerData.get(e)
    }

    export function on_tick(e: OnTickEvent) {
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

                    $safe_call!(taskExecutor?.execute_task, taskExecutor, task)
                } else if (task.type == "command") {
                    if (task.command == "fc-rebuild-all") {
                        PlayerData.Rebuild()
                        Dictionary.Rebuild()
                        game.print("[color=green]Rebuild complete. Waiting for translation to finish...[/color]")
                    }
                } else if (task.type == "dictionary") {
                    let dict_cache = getDictionaryCache()

                    if (dict_cache == undefined) {
                        // @ts-ignore
                        $log_crit!(`Cannot save translation for ${dictTask.language}. Is mod data corrupted?`, `Cache: 'dicts_cache' is undefined. Creation must have failed`)
                        return
                    }
                    dict_cache.execute_task(task)
                }
            }
        }
    }


    // custom events
    export function on_toggle_quick_search(e: CustomInputEvent) {
        $log_debug!(`Shortcut key pressed! Opening Quick Search for ${game.get_player(e.player_index)?.name}`)
        PlayerData.getQuickSearch(e)?.toggle()
    }
}

const FactorioCodexEvents: EventHandler.LuaLibrary = {
    on_init: Events.on_init,
    on_load: Events.on_load,
    on_configuration_changed: Events.on_configuration_changed,

    events: {
        [defines.events.on_player_created]: Events.on_player_created,

        [defines.events.on_tick]: Events.on_tick,

        [FLIB_dictionary_lite.on_player_dictionaries_ready]: Dictionary.on_player_dictionaries_ready,
        [FLIB_dictionary_lite.on_player_language_changed]: Dictionary.on_player_language_changed,

        // custom events
        "fcodex_toggle_quick_search": Events.on_toggle_quick_search,
    }
}


EventHandler.add_lib(FactorioCodexEvents)
EventHandler.add_lib({events: FLIB_dictionary_lite.events})

FLIB_gui.hook_events((e: GuiEventData) => {
    $safe_call!(PlayerData?.handleUIEvents, undefined, FLIB_gui.read_action(e), e)
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