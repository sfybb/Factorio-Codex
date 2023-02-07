local util = require("scripts.util")

local serpent = require("scripts.serpent")

local Cache = require("scripts.cache")
local Codex = require("scripts.codex")
local QuickSearch = require("scripts.quick_search")
local Dicitonary = require("scripts.dictionary")

local access_loggers_added = true

PlayerData = {}
PlayerData.Cache = Cache
PlayerData.Codex = Codex
PlayerData.QuickSearch = QuickSearch
PlayerData.Dicitonary = Dicitonary

local function get_index_arg(player)
    if type(player) == "number" then
        return player
    elseif type(player) == "table" then
        local res = player.player_index or player.index
        return res or 0
    end
    return 0
end

function PlayerData:PreInit()
    global.cache = {mt={}}
    script.register_metatable("Cache", global.cache.mt)
end

function PlayerData:Init()
    global.players = {}

    Cache:Init()
    global.cache = Cache:build()

    Dicitonary:Init()

    Codex:Init()
    log("Player data init complete")
end

function PlayerData:load()
    PlayerData:print_global_data()

    Cache:Init()

    if global.cache ~= nil then
        Cache.load(global.cache)
    else
        log("Cannot load cache: Cache is a nil value!")
    end

	Dicitonary:load()
    Dicitonary:build()

    PlayerData:load_metatables()
    log("Player data loaded")
end

function PlayerData:create_player(e)
	Dicitonary:translate(e.player_index)
    PlayerData:get(e)
end

function PlayerData:player_update(e)
    Dicitonary:translate(e.player_index)
    PlayerData:print_global_data()
end

function PlayerData:cancel_player_update(e)
    Dicitonary:cancel_translate(e.player_index)
end

function PlayerData:string_translated(e)
    Dicitonary:string_translated(e)
end

function PlayerData:check_skipped()
    Dicitonary:check_skipped()
end

function PlayerData:validate()
    log("Validating mod data...")
    --global.cache:validate()

    --Dicitonary:validate()

    log("Player Data:")
    for i,data in pairs(global.players) do
        log("========== [ ".. game.get_player(i).name .. " (" .. i ..") ] ==========")
        local qs_valid, qs_fixed = QuickSearch.validate(data.quick_search, i)

        if qs_valid then
            log("Quick Search passed validation")
        elseif qs_fixed then
            log("Quick Search invalid but could be fixed!")
        else
            log("Quick Search validation failed! Deleting! ("..i..")")
            data.quick_search:destroy()
            data.quick_search = QuickSearch:new(i)
        end

        local cx_valid, cx_fixed = Codex.validate(data.codex, i)

        if cx_valid then
            log("Codex passed validation")
        elseif cx_fixed then
            log("Codex invalid but could be fixed!")
        else
            log("Codex validation failed! Deleting! ("..i..")")
            data.codex:destroy()
            data.codex = Codex:new(i)
        end

        if (not qs_valid and not qs_fixed) or (not cx_valid and not cx_fixed) then
            local affected_parts = nil

            if not qs_valid and not qs_fixed then
                affected_parts = "Quick Search"
            end

            if not cx_valid and not cx_fixed then
                if affected_parts ~= nil then
                    affected_parts = " and "
                end
                affected_parts = "Codex"
            end

            debug:player_print(i, "Validation failed! Deleted data for "..affected_parts)
        end
    end
    log("Validation concluded")
    PlayerData:install_access_logger()
end

function PlayerData:get(player)
    PlayerData:install_access_logger()

    local indx = get_index_arg(player)

    if indx == 0 then
        return {}
    end

    debug:log_debug("Retrieving Player data for player with id "..indx)

    local data =  global.players[indx]

    if data == nil then
        data = PlayerData:init_player(indx)
    end

    return data
end

function PlayerData:init_player(indx)
    debug:log_info("Initializing player data for player " .. indx)
    global.players[indx] = {
        codex = Codex:new(indx),
        quick_search = QuickSearch:new(indx)
    }

    --PlayerData:add_access_logger_to_player(indx, global.players[indx])

    return global.players[indx]
end

function PlayerData:load_metatables()
    for i,data in pairs(global.players) do
        if data == nil then
            debug:log_warn("Loading player "..i.." - NO DATA!")
            return
        end

        debug:log_debug("Loading player "..i)

        if data.codex == nil or next(data.codex) == nil then
            debug:log_warn("Warning: Codex is nil for player " .. i .. "!")
            --data.codex = Codex:new(i)
        else
            Codex.load(data.codex)
        end

        if data.quick_search == nil or next(data.quick_search) == nil then
            debug:log_warn("Warning: QuickSearch is nil for player " .. i .. "!")
            --data.quick_search = QuickSearch:new(i)
        else
            QuickSearch.load(data.quick_search)
        end
    end

    --PlayerData:validate()
end

function PlayerData:print_global_data()
    debug:log_debug("Global player table: ")

    for ind, pl in pairs(global.players) do
        debug:log_debug("Player "..ind..": " .. serpent.block(pl, {nocode = true, sortkeys = true, maxlevel = 3, keyignore = {dicts=true}}))
    end
end

function PlayerData:get_codex(player)
    local indx = get_index_arg(player)

    if indx == 0 then
        return {}
    end

    local data = PlayerData:get(indx)
    return data.codex
end

function PlayerData:get_quick_search(player)
    local indx = get_index_arg(player)

    if indx == 0 then
        return {}
    end

    local data = PlayerData:get(indx)
    --log("Reriving data ... " .. serpent.block(data, {nocode=true, maxnum=3}))
    return data.quick_search
end



function PlayerData:install_access_logger()
    if access_loggers_added == true then
        return
    end
    access_loggers_added = true

    log("Adding access loggers to tables...")
    for ind, pl in pairs(global.players) do
        PlayerData:add_access_logger_to_player(ind, pl)
    end

    global.players = add_access_logger(global.players, "Players Table")
end

function PlayerData:add_access_logger_to_player(ind, pl)
    local player_str = "Player "..ind
    if pl.quick_search ~= nil then
        pl.quick_search = add_access_logger(pl.quick_search, player_str .. " QS")
    end

    if pl.codex ~= nil then
        if pl.codex.categories ~= nil then
            pl.codex.categories = add_access_logger(pl.codex.categories, player_str .. " CAT")
        end

        if pl.codex.recipe_info ~= nil then
            pl.codex.recipe_info = add_access_logger(pl.codex.recipe_info, player_str .. " RI")
        end

        pl.codex = add_access_logger(pl.codex, player_str .. " CODEX")
    end

    global.players[ind] = add_access_logger(pl, player_str)
end

function add_access_logger(orig_table, table_id)
    -- create proxy
    local proxy_table = {}

    -- create metatable
    local mt = {
        __index = function (t,k)
            print("["..table_id.."] access to element " .. tostring(k))
            return orig_table[k]   -- access the original table
        end,

        __newindex = function (t,k,v)
            print("["..table_id.."] update of element " .. tostring(k) ..
                    " to " .. tostring(v))
            orig_table[k] = v   -- update original table
        end
    }
    setmetatable(proxy_table, mt)
    return proxy_table
end

return PlayerData
