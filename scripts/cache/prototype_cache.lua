local PrototypeCache = { global=true, id="prototype_cache", name="Prototype Cache" }
local PrototypeCache_mt = { __index = PrototypeCache }

local searchable_types = {fluid = true, item = true, technology = true, tile = true}

local flib_table = require("__flib__.table")

function PrototypeCache:Init(cache_list)
    cache_list[PrototypeCache.id] = PrototypeCache
end

function PrototypeCache:load()
    setmetatable(self, {__index = PrototypeCache})
    return self
end

function PrototypeCache:build()
    local p_cache = {}
    setmetatable(p_cache, PrototypeCache_mt)

    p_cache.protos = {}

    p_cache:rebuild()

    return p_cache
end

function PrototypeCache:rebuild()
    for type,_ in pairs(searchable_types) do
        self.protos[type] = flib_table.shallow_copy(game[type .. "_prototypes"])
    end
end

function PrototypeCache:get(type)
    if searchable_types[type] == nil then
        return {}
    end

    return self.protos[type]
end

function PrototypeCache:get_all()
    return self.protos
end

return PrototypeCache