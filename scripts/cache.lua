local Cache = {prototypes={per_player={}}}

local serpent = require("scripts.serpent")
local ModuleCache = require("scripts.cache.module_cache")
local RecipeCache = require("scripts.cache.recipe_cache")

function Cache:load()
    setmetatable(self, {__index = RecipeInfo})

    log("Loading saved caches...")
    for id,gc in pairs(self.global) do
        local cache_proto = Cache.prototypes[id]
        if cache_proto ~= nil then
            self.global[id] = Cache.prototypes[id]:load(gc)
        else
            log("   Error: cant load cache. Unknown cache id \""..id.."\". Did Cache:Init() get called?")
        end
    end

    for _,p_caches in pairs(self.per_player) do
        for id,pc in pairs(p_caches) do
            local cache_proto = Cache.prototypes[id]
            if cache_proto ~= nil then
                p_caches[id] = cache_proto:load(pc)
                log("   "..cache_proto.name.."   Done")
            else
                log("   Error: cant load cache. Unknown cache id \""..id.."\". Did Cache:Init() get called?")
            end
        end
    end

    return self
end

function Cache:Init()
    ModuleCache:Init(Cache.prototypes)
    RecipeCache:Init(Cache.prototypes)

    Cache.prototypes.per_player = {}
    for n,proto_cache in pairs(Cache.prototypes) do
        if n ~= "per_player" and proto_cache.global ~= true then
            table.insert(Cache.prototypes.per_player, proto_cache)
        end
    end
end

function Cache:build()
    local c = {}
    setmetatable(c, self)
    self.__index = self

    self.valid = true

    self.global = {}
    self.per_player = {}

    log("Initializing global caches...")
    for _,gc in pairs(Cache.prototypes) do
        if type(gc) == "table" and gc.global == true then
            self.global[gc.id] = gc:build()
            log("   "..gc.name.."   Done")
        end
    end

    return self
end

function Cache:initPlayer(player_index)
    local player_c = {}
    self.per_player[player_index] = player_c

    log("Initializing caches for player \""..game.players[player_index].name.."\"...")
    for _,pc in pairs(Cache.prototypes.per_player) do
        log("   "..pc.name)
        player_c[pc.id] = pc:build(player_index)
    end
end

function Cache:invalidate_all()
    for _, c in pairs(self.global) do
        c:invalidate()
    end

    for _, p_c in pairs(self.per_player) do
        for _, c in pairs(p_c) do
            c:invalidate()
        end
    end
end

function Cache:invalidate_cache_id(cache_id)
    for c_id, c in pairs(self.global) do
        if c_id == cache_id then
            c:invalidate()
            return
        end
    end


    for _, p_c in pairs(self.per_player) do
        for c_id, c in pairs(p_c) do
            if c_id == cache_id then
                c:invalidate()
                return
            end
        end
    end
end

function Cache:get_cache(cache_id)
    return self.global[cache_id]
end

function Cache:get_cache_for_player(player, cache_id)
    local player_id = nil
    if type(player) == "number" then
        player_id = player
    elseif type(player) == "table" then
        player_id = player.index
    end

    if player_id == nil or type(player) ~= "number"  then
        log("cannot retive cahce for non player: Invalid type: " .. type(player) .. " - Type contents: " .. serpent.block(player))
        error("Cannot retrive cache for player!")
    end


    if self.per_player[player_id] == nil then
        self:initialize_caches_for_player(player_id)
    end

    return self.per_player[player_id][cache_id]
end

return Cache