local ModuleCache = { global=true, id="module_cache", name="Module Cache" }
local ModuleCache_mt = { __index = ModuleCache }

local crafting_machine_types = {"assembling-machine", "rocket-silo", "furnace"}

function ModuleCache:Init(cache_list)
    cache_list[ModuleCache.id] = ModuleCache
end

function ModuleCache:load()
    setmetatable(self, {__index = ModuleCache})
    return self
end

function ModuleCache:build()
    local m_cache = {}
    setmetatable(m_cache, ModuleCache_mt)

    m_cache.modules = {}

    for cat_name,_ in pairs(game.module_category_prototypes) do
        m_cache.modules[cat_name] = {
            tiers= {}, -- table of module tiers with their prototype

            limitations_equivalent = nil, -- Are the limitations of every module in this category equivalent?
            limitations= {}, -- table of recipe names modules in this category can be used on
            limitations_for_tier= {} -- table of module tiers in this category with their limitations
        }
    end


    -- type = module
    local module_protos = game.get_filtered_entity_prototypes({{filter= "type", type="module"}})

    for _, m_proto in pairs(module_protos) do
        local cat = m_cache.modules[m_proto.category]
        cat.tiers[m_proto.tier] = m_proto


        local limitation = {}
        if m_proto.limitation ~= nil then
            for _,recipe_name in pairs( m_proto.limitation) do
                limitation[recipe_name] = true
            end
        end


        cat.limitations_for_tier[m_proto.tier] = limitation


        -- check if limitations are equivalent with every previous module tier
        if cat.limitations_equivalent then
            if #cat.limitations > 0 then
                if #cat.limitations ~= limitation then
                    -- size is different so the limitations must have a difference
                    cat.limitations_equivalent = false
                else
                    -- we only need to check if all limitations are contained in the other array
                    for recipe_name,_ in pairs(limitation) do
                        if cat.limitations[recipe_name] ~= true then
                            cat.limitations_equivalent = false
                            break
                        end
                    end
                end
            elseif #limitation > 0 then
                -- the limitations were previously empty but we now have a non empty list - they dont match
                cat.limitations_equivalent = false
            end
        elseif cat.limitations_equivalent == nil then
            -- great we dont need to check since this is the first module inserted into this category or the limitations are empty
            cat.limitations_equivalent = true
            cat.limitations = limitation
        end
    end

    -- remove cat.limitations table if cat.limitations_equivalent is false
    for cat_name, cat in pairs(m_cache.modules) do
        if cat.limitations_equivalent ~= true then
            cat.limitations = {}
        end
    end

    return m_cache
end

function ModuleCache:rebuild()

end

function ModuleCache:get_allowed_modules_for_recipe(recipe_id)
    local allowed_modules = {
    --[[
        "module-category-name" : true or   --- true if the whole category is allowed
            {                              --- otherwise a list of allowed module tiers
                "allowed-module-tier-1",
                "allowed-module-tier-3",
                ...
            }
    ]]
    }

    for cat_name, cat in pairs(self.modules) do
        if cat.limitations_equivalent == true then
            if #cat.limitation == 0 or cat.limitations[recipe_id] == true then
                -- if all recipes are allowed or the recipe is in the allowed list
                allowed_modules[cat_name] = true
            end
        else
            local allowed_modules_in_cat = {}

            for tier, lim_list in pairs(cat.limitations_for_tier) do
                if #lim_list == 0 or lim_list[recipe_id] == true then
                    -- if all recipes are allowed or the recipe is in the allowed list
                    table.insert(allowed_modules_in_cat, tier)
                end
            end

            if #allowed_modules_in_cat > 0 then
                allowed_modules[cat_name] = allowed_modules_in_cat
            end
        end
    end

    return allowed_modules
end

return ModuleCache
