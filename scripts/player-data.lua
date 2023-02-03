local util = require("scripts.util")

local serpent = require("scripts.serpent")

local Cache = require("scripts.cache")
local Codex = require("scripts.codex")
local QuickSearch = require("scripts.quick_search")
local Dicitonary = require("scripts.dictionary")


-- needed in order to add back meta tables after a save / join
local metatables_missing = false

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
    Cache:Init()
	Dicitonary:load()

    metatables_missing = true
    log("Player data loaded")
end

function PlayerData:create_player(e)
	Dicitonary:translate(e.player_index)
end

function PlayerData:player_update(e)
    Dicitonary:translate(e.player_index)
end

function PlayerData:cancel_player_update(e)
    Dicitonary:cancel_translate(e.player_index)
end

function PlayerData:string_translated(e)
	PlayerData:check_metatables()
    Dicitonary:string_translated(e)
end

function PlayerData:check_skipped()
    Dicitonary:check_skipped()
end

function PlayerData:validate()
    PlayerData:check_metatables()

    log("Validating mod data...")
    --global.cache:validate()

    --Dicitonary:validate()

    log("Player Data:")
    for i,data in pairs(global.players) do
        log("========== [ ".. game.get_player(i).name .. " (" .. i ..") ] ==========")
        local qs_valid, qs_fixed = data.quick_search:validate(i)

        if qs_valid then
            log("Quick Search passed validation")
        elseif qs_fixed then
            log("Quick Search invalid but could be fixed!")
        else
            log("Quick Search validation failed! Deleting!")
            data.quick_search:destroy()
            data.quick_search = QuickSearch:new(i)
        end

        local cx_valid, cx_fixed = data.codex:validate(i)

        if cx_valid then
            log("Codex passed validation")
        elseif cx_fixed then
            log("Codex invalid but could be fixed!")
        else
            log("Codex validation failed! Deleting!")
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
end

function PlayerData:get(player)
    local indx = get_index_arg(player)

    if indx == 0 then
        return {}
    end

    log("Retrieving Player data for player with id "..indx)

    local data = nil
    if metatables_missing then
        data = PlayerData:load_metatables(indx)
    else
        data = global.players[indx]
    end

    if data == nil then
        data = PlayerData:init_player(indx)
    end

    return data
end

function PlayerData:init_player(indx)
    log("Initializing player data for player " .. indx)
    global.players[indx] = {
        codex = Codex:new(indx),
        quick_search = QuickSearch:new(indx)
    }
    return global.players[indx]
end

function PlayerData:check_metatables()
    if metatables_missing then
        PlayerData:load_metatables()
    end
end

function PlayerData:load_metatables(indx)
    local data = nil
    -- initialize all missing metatables
    Cache:Init()
    global.cache = Cache.load(global.cache)
	Dicitonary:build()


    for i,_ in pairs(global.players) do
        if indx == i then
            data = PlayerData:load_player(i)
        else
            PlayerData:load_player(i)
        end
    end

    metatables_missing = false

    --PlayerData:validate()

    return data
end

function PlayerData:load_player(indx)
    local data = global.players[indx]
    if data == nil then
        return
    end

	if data.codex == nil or next(data.codex) == nil then
        log("Warning: Codex is nil for player " .. indx .. "! creating a new instance.")
		data.codex = Codex:new(indx)
	else
		data.codex = Codex.load(data.codex)
	end

	if data.quick_search == nil or next(data.quick_search) == nil then
        log("Warning: QuickSearch is nil for player " .. indx .. " creating a new instance.")
		data.quick_search = QuickSearch:new(indx)
	else
		data.quick_search = QuickSearch.load(data.quick_search)
	end

    return data
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
		log("Invalid index: "..serpent.line(player))
        return {}
    end

    local data = PlayerData:get(indx)
	--log("Reriving data ... " .. serpent.block(data, {nocode=true, maxnum=3}))
    return data.quick_search
end

return PlayerData
