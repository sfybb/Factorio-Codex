local dictionary = require("__flib__.dictionary")
dictionary.set_use_local_storage(true)

local quick_search = require("scripts.quick_search")
local util = require("scripts.util")
local serpent = require("scripts.serpent")
local table = require("__flib__.table")


local player_data = {}
local dicts_array = {}
local searchable_types = {"fluid", "item", "technology", "tile"}

local function build_dicts()
    for _, type in pairs(searchable_types) do
        -- If the object's name doesn't have a translation, use its internal name as the translation
        local names = dictionary.new(type.."_names", true)
        -- If a description doesn't exist, it won't exist in the resulting dictionary either
        local desc = dictionary.new(type.."_descriptions")
        
        
        for name, prototype in pairs(global.prototypes[type]) do
            names:add(name, prototype.localised_name)
            desc:add(name, prototype.localised_description)
        end
        
        dicts_array[type.."_names"] = names
        dicts_array[type.."_descriptions"] = desc
    end
end

local function global_init()
    global.players = {}
    global.prototypes = {}
    
    for _, type in pairs(searchable_types) do
        global.prototypes[type] = table.shallow_copy(game[type .. "_prototypes"])
    end
end

local function init()
    -- Initialize the module
    dictionary.init()

    global_init()
    build_dicts()
end

local function migrate()
    -- Reset the module to effectively cancel all ongoing translations and wipe all dictionaries
    init()

    -- Request translations for all connected players
    for _, player in pairs(game.players) do
        if player.connected then
            --dictionary.translate(player)
        end
    end
end

local function check_should_build()
    if global.prototypes then
        for _, prototypes in pairs(global.prototypes) do
            for _, prototype in pairs(prototypes) do
                if not prototype.valid then
                    return false
                end
            end
        end
        return true
    end

  return false
end

local function on_load()
    dictionary.load()
    
    build_dicts()
end

local function player_create(player_index)
    local player = game.get_player(player_index)

    if player.connected then
        dictionary.translate(player)
    end
end

local function player_update(player_index)
    local player = game.get_player(player_index)
    
    -- Only translate if they're connected - if they're not, then it will not work!
    if player.connected then
        dictionary.translate(player)
    end
end

local function cancel_player_update(player_index)
    -- If the player was actively translating, cancel it and hand it off to another player (if any).
    dictionary.cancel_translation(player_index)
end

local function string_translated(e)
    --game.print("String translated! " .. serpent.line(e))
    local language_data = dictionary.process_translation(e)
    if language_data then
        for _, player_index in pairs(language_data.players) do
            local player = game.get_player(player_index)
            local player_table = util.get_player_data(player)
            
            player_table.dicts = language_data.dictionaries
        
            util.set_player_data(player, player_table)
            
            
            game.print(player.name .." now has dictionaries for their language! ")
            quick_search.update_input(player)
        end
    end
end


player_data.init = init
player_data.migrate = migrate
player_data.player_update = player_update
player_data.player_create = player_create
player_data.cancel_player_update = cancel_player_update
player_data.check_skipped = dictionary.check_skipped
player_data.string_translated = string_translated
player_data.on_load = on_load

return player_data
