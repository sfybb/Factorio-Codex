local Cache = {prototypes={per_player={}},init_done=false}
local Cache_mt = {__index = Cache}

local serpent = require("scripts.serpent")
local ModuleCache = require("scripts.cache.module_cache")
local RecipeCache = require("scripts.cache.recipe_cache")
local PrototypeCache = require("scripts.cache.prototype_cache")
local DictsCache = require("scripts.cache.dicts_cache")

function Cache:load()
    setmetatable(self, Cache_mt)

    log("Loading saved caches...")
    for id,gc in pairs(self.global) do
        local cache_proto = Cache.prototypes[id]
        if cache_proto ~= nil then
            --[[self.global[id] =]] Cache.prototypes[id].load(gc)
            log("   "..cache_proto.name.."   Done")
        else
            log("   Error: cant load cache. Unknown cache id \""..id.."\". Did Cache:Init() get called?")
        end
    end

    for p_id,p_caches in pairs(self.per_player) do
        log("Loading caches for player "..p_id.."...")
        for id,pc in pairs(p_caches) do
            local cache_proto = Cache.prototypes[id]
            if cache_proto ~= nil then
                --[[p_caches[id] =]] cache_proto.load(pc)
                log("   "..cache_proto.name.."   Done")
            else
                log("   Error: cant load cache. Unknown cache id \""..id.."\". Did Cache:Init() get called?")
            end
        end
    end

    return self
end

function Cache:Init()
    if Cache.init_done then
        return
    end

    ModuleCache:Init(Cache.prototypes)
    RecipeCache:Init(Cache.prototypes)
    PrototypeCache:Init(Cache.prototypes)
    DictsCache:Init(Cache.prototypes)

    Cache.prototypes.per_player = {}
    for n,proto_cache in pairs(Cache.prototypes) do
        if n ~= "per_player" and proto_cache.global ~= true then
            table.insert(Cache.prototypes.per_player, proto_cache)
        end
    end

    Cache.init_done = true
end

function Cache:build()
    local c = {}
    setmetatable(c, Cache_mt)

    c.valid = true

    c.global = {}
    c.per_player = {}

    log("Initializing global caches...")
    for _,gc in pairs(Cache.prototypes) do
        if type(gc) == "table" and gc.global == true then
            c.global[gc.id] = gc:build()
            log("   "..gc.name.."   Done")
        end
    end

    return c
end

function Cache:initPlayer(player_index)
    local player_c = {}
    self.per_player[player_index] = player_c

    log("Initializing caches for player \""..game.get_player(player_index).name.."\"...")
    for _,pc in pairs(Cache.prototypes.per_player) do
        log("   "..pc.name)
        player_c[pc.id] = pc:build(player_index)
    end
end

function Cache:rebuild_all()
    log("Rebuilding global caches...")
    for _, c in pairs(self.global) do
        log("   "..c.name)
        c:rebuild()
    end

    for _, p_c in pairs(self.per_player) do
        log("Rebuilding caches for player \""..game.get_player(_).name.."\"...")
        for _, c in pairs(p_c) do
            log("   "..c.name)
            c:rebuild()
        end
    end
end

function Cache:rebuild_cache_id(cache_id)
    log("Rebuilding caches with id "..cache_id)
    for c_id, c in pairs(self.global) do
        if c_id == cache_id then
            c:rebuild()
            return
        end
    end


    for _, p_c in pairs(self.per_player) do
        for c_id, c in pairs(p_c) do
            if c_id == cache_id then
                c:rebuild()
                return
            end
        end
    end
end

function Cache:get_cache(cache_id)
    local res = self.global[cache_id]
    if res == nil then
        log("Unable to fetch global cache with id \""..cache_id.."\"")
    end

    return res
end

function Cache:get_player_cache(player, cache_id)
    local player_id = nil
    if type(player) == "number" then
        player_id = player
    elseif type(player) == "table" then
        player_id = player.index
    end

    if player_id == nil or type(player) ~= "number"  then
        log("cannot retrieve cache for non player: Invalid type: " .. type(player) .. " - Type contents: " .. serpent.block(player))
        error("Cannot retrieve cache for player!")
    end

    --log("Retrieving cache \""..cache_id.."\" for player "..player_id)

    if self.per_player[player_id] == nil then
        self:initPlayer(player_id)
    end

    return self.per_player[player_id][cache_id]
end

return Cache