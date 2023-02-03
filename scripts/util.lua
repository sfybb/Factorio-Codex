debug = {enabled = true}

local debug_prefs = {}

function round(num, decimals)
    local num_shift = 10^decimals
    local shifted_num = num * num_shift
    local shifted_num_decimal = shifted_num - math.floor(shifted_num)

    if (shifted_num > 0) == (shifted_num_decimal >= 0.5) then
        return math.ceil(shifted_num) / num_shift
    else
        return math.floor(shifted_num) / num_shift
    end
end

function debug:get_profiler(name)
    if debug_prefs[name] == nil then
        debug_prefs[name] = game.create_profiler(true)
    end

    return debug_prefs[name]
end

function string:endswith(ending)
    return ending == "" or self:sub(-#ending) == ending
end

function debug:player_print(players, msg)
    if type(players) == "number" then
        players = {players}
    end
    if type(players) ~= "table" then
        log("[factorio-codex] Unable to send following message to player(s) \""..serpent.line(players).."\": \""..msg.."\"")
        return
    end

    log("Players: "..serpent.line(players).. " - [factorio-codex] " .. msg)

    for _,p in pairs(players) do
        local player = game.get_player(p)
        if player ~= nil  and player.connected then
            player.print("[factorio-codex] " .. msg)
        end
    end
end

function debug:toggle(player_index)
    debug.enabled = not debug.enabled

    game.get_player(player_index).print("[factorio-codex] debug " .. (debug.enabled and "enabled" or "disabled"))
end

function debug:print(msg)
    if debug.enabled then
        log("codex-debug: " .. msg)
    end
end

math.round = round
