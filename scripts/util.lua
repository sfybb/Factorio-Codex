local util = {}
local Codex = require("scripts.codex")

-- needed in order to add back meta tables after a save / join
local metatables_missing = false

local function get_player_data(player)
    local indx = 0
    if type(player) == "number" then
        indx = player
    elseif type(player) == "table" then
        indx = player.index
    end

    if indx == 0 then
        return {}
    end

    local data = nil

    if metatables_missing then
        util.load_metatables(indx)
    else
        data = global.players[indx]
    end

    if data == nil then
        data = util.init_player_data(indx)
    end

    return data
end

local function init_player_data(indx)
    global.players[indx] = {
        codex = Codex:new(indx),
        quick_search = {}
    }
    return global.players[indx]
end

local function load_player_data(player)
    local indx = 0
    if type(player) == "number" then
        indx = player
    elseif type(player) == "table" then
        indx = player.index
    end

    if indx == 0 then
        return
    end

    local data = global.players[indx]
    if data == nil then
        return
    end

    data.codex = Codex.load(data.codex)
    --data.quick_search = QuickSearch.load(data.quick_search)
    return data
end

local function load_metatables(indx)
    local data
    -- initialize all missing metatables
    for i,_ in pairs(global.players) do
        if indx == i then
            data = util.load_player_data(i)
        else
            util.load_player_data(i)
        end
    end

    metatables_missing = false
    return data
end

local function set_missing_metatable()
    metatables_missing = true
end

local function set_player_data(player, table)
    if table == nil then
        table = {}
    end

    global.players[player.index] = table
end

local function round(num, decimals)
    local num_shift = 10^decimals
    local shifted_num = num * num_shift
    local shifted_num_decimal = shifted_num - math.floor(shifted_num)

    if (shifted_num > 0) == (shifted_num_decimal >= 0.5) then
        return math.ceil(shifted_num) / num_shift
    else
        return math.floor(shifted_num) / num_shift
    end
end

math.round = round
util.get_player_data = get_player_data
util.set_player_data = set_player_data
util.load_player_data = load_player_data
util.set_missing_metatable = set_missing_metatable
util.load_metatables = load_metatables
util.init_player_data = init_player_data

return util
