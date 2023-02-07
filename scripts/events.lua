local event = require("__flib__.event")
local gui = require("__flib__.gui")
local on_tick_n = require("__flib__.on-tick-n")


require("scripts.player-data")
local migration = require("scripts.migration")

local serpent = require("scripts.serpent")

-- delimiter if needed "❖" U+2756

event.on_init(function(e)
    on_tick_n.init()
    PlayerData:Init()
end )

event.on_configuration_changed(migration.migrate)

event.on_player_created(function(e) PlayerData:create_player(e) end)

event.on_player_joined_game(function(e) PlayerData:player_update(e) end)

event.on_player_left_game(function(e) PlayerData:cancel_player_update(e) end)

event.on_tick(function(e)
    PlayerData:check_skipped(e)

    for _, task in pairs(on_tick_n.retrieve(e.tick) or {}) do
        if type(task) == "table" then
            if task.player_index == nil or task.gui == nil then
                debug:log_warn("Incomplete task: "..serpent.line(task))
            else
                local elem = nil
                if task.gui == "qs" then
                    elem = PlayerData:get_quick_search(task.player_index)
                elseif task.gui == "codex" then
                    elem = PlayerData:get_codex(task.player_index)
                end

                if elem ~= nil then
                    elem:execute_task(task)
                end
            end
        else
            debug:log_warn("Unknown task type: "..type(task)..", data: "..serpent.line(task))
        end
    end
end)

event.on_string_translated(function(e) PlayerData:string_translated(e) end)

event.on_load(function(e) PlayerData:load(e) end)

script.on_event("fcodex_toggle_quick_search", function(e)
    debug:log_debug("Player used shortcut key to open quick search: "..serpent.line(e))
    local qs = PlayerData:get_quick_search(e)
    debug:log_debug("Player data: "..serpent.line(qs,{nocode=true}))
    qs:toggle()
end)

gui.hook_events(function(e)
    local action = gui.read_action(e)

    if action then
        --log("Event Hook: Action \""..action.."\" for player "..e.player_index)
        if action:sub(1, #"qs_") == "qs_" then
            PlayerData:get_quick_search(e):gui_action(action, e)
        elseif action:sub(1, #"cx_") == "cx_" then
            PlayerData:get_codex(e):gui_action(action, e)
        else
            debug:log_warn("Unknown action \"" .. action .. "\" cannot assing action to gui!")
            --game.print("Unknown action \"" .. action .. "\" cannot assing action to gui!")
        end
    end
end)
