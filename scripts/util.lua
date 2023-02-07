debug = {enabled = true}
debug_prefs = {}

local debug_log_funcs = {
    dummy = function () end,
    log_debug = function (_,m) log("[debug] " .. m) end,
    log_info  = function (_,m) log("[info]  " .. m) end,
    log_warn  = function (_,m) log("[warn]  " .. m) end,
    log_err   = function (_,m) log("[error] " .. m) end
}

local level_order = {
    "log_debug",
    "log_info",
    "log_warn",
    "log_err"
}

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

function debug:set_log_level(level)
    log("Setting log level to " .. level .. " (\"".. (level_order[level] or "unknown") .."\")")
    for i,n in ipairs(level_order) do
        if i < level then
            debug[n] = debug_log_funcs.dummy
        else
            debug[n] = debug_log_funcs[n]
        end
    end
end


math.round = round
