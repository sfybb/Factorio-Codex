local event = require("__flib__.event")
local gui = require("__flib__.gui")


require("scripts.player-data")
local migration = require("scripts.migration")

local serpent = require("scripts.serpent")


event.on_init(PlayerData.Init)

event.on_configuration_changed(migration.migrate)

event.on_player_created(function(e) PlayerData:create_player(e) end)

event.on_player_joined_game(function(e) PlayerData:player_update(e) end)

event.on_player_left_game(function(e) PlayerData:cancel_player_update(e) end)

event.on_tick(function(e) PlayerData:check_skipped(e) end)

event.on_string_translated(function(e) PlayerData:string_translated(e) end)

event.on_load(function(e) PlayerData:load(e) end)

script.on_event("fcodex_toggle_quick_search", function(e)
    PlayerData:get_quick_search(e):toggle()
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
            game.print("Unknown action \"" .. action .. "\" cannot assing action to gui!")
        end
    end
end)
