local util = {}

local function get_player_data(player)
    local data = global.players[player.index]
    if data == nil then
        global.players[player.index] = {}  
        data = global.players[player.index]
    end

    return data
end

local function set_player_data(player, table)
    if table == nil then
        table = {}
    end
    
    global.players[player.index] = table
end

-- todo
local function block_sort()
    
end

util.stable_sort = block_sort
util.get_player_data = get_player_data
util.set_player_data = set_player_data

return util
