local event = require("__flib__.event")
local migration = require("__flib__.migration")
local gui = require("__flib__.gui")


local codex = require("scripts.codex")
local quick_search = require("scripts.quick_search")
local player_data = require("scripts.player-data")
local util = require("scripts.util")

local serpent = require("scripts.serpent")



event.on_init(function()
    player_data.init()
end)

event.on_configuration_changed(function(e)
    if migration.on_config_changed(e, {}) then
        for _,player in pairs(game.players) do
            if player ~= nil then
                log(serpent.block(util.get_player_data(player)))
                codex.rebuild(player)
            end
        end
    
        player_data.migrate()
    end
end)

event.on_player_created(function(e)
    player_data.player_create(e.player_index)
end)

event.on_player_joined_game(function(e)
    player_data.player_update(e.player_index)
end)

event.on_player_left_game(function(e)
    player_data.cancel_player_update(e.player_index)
end)

event.on_tick(player_data.check_skipped)

event.on_string_translated(player_data.string_translated)

event.on_load(player_data.on_load)

--[[event.on_gui_selection_state_changed(function(e)
    local player = game.get_player(e.player_index)
    game.print("[" .. e.tick .. "] " .. e.element.selected_index)
    
    
    local id_stuff = string.match(e.element.get_item(e.element.selected_index), "(%a+%=[%a%d%-]+)")
    if id_stuff == nil then
        return
    end
    
    game.print(id_stuff)
    local id_type, id = string.match(id_stuff, "(%a*)=([%a%d%-]*)")
    codex.open(player, id, id_type)
end)

event.on_gui_text_changed(function(event)
    quick_search.update_input(event.player_index, event.text)
end)]]

script.on_event("fcodex_toggle_quick_search", function(event)
    local player = game.get_player(event.player_index)
    quick_search.toggle(player)
end)


--[[event.on_gui_closed(function(event)
    if event.element then
        if event.element.name == "fcodex_quick_search" then
            local player = game.get_player(event.player_index)
            quick_search.toggle(player)
        elseif event.element.name == "fcodex_codex" then
            local player = game.get_player(event.player_index)
            toggle_codex(player)
        end
    end
end)]]

gui.hook_events(function(e)
  local action = gui.read_action(e)
  local player = game.get_player(e.player_index)
  
  if action then
    if action:sub(1, #"qs_") == "qs_" then
        quick_search.gui_action(action, e)
    elseif action:sub(1, #"cx_") == "cx_" then
        codex.gui_action(action, e)
    else
        game.print("Unkown action \"" .. action .. "\" cannot assing action to gui!")
    end
  end
end)
