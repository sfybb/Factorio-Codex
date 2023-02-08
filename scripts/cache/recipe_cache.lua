local RecipeCache = { global=true, id="recipe_cache", name="Recipe Cache" }
local RecipeCache_mt = {__index = RecipeCache}

local flib_table = require("__flib__.table")
local serpent = require("scripts.serpent")

function RecipeCache:Init(cache_list)
    cache_list[RecipeCache.id] = RecipeCache
end

function RecipeCache:load()
    setmetatable(self, RecipeCache_mt)
    return self
end

function RecipeCache:build()
    local r_cache = {}
    setmetatable(r_cache, RecipeCache_mt)

    r_cache:rebuild()

    return r_cache
end

function RecipeCache:rebuild()
    self.resource_recipes = {
        miners_for_category = {},
        products = {},
        ingredients = {}
    }
    self.item_recipes = {
        products = {},
        ingredients = {}
    }
    self.fluid_recipes = {
        products = {},
        ingredients = {}
    }

    self:build_resource_mining_cache()
    self:build_offshore_pump_mining_cache()
    self:build_rocket_launch_product_cache()
end

function RecipeCache:add_recipe(recipe)
    local add_recipe_to_list = function (list, id)
        list[id] = list[id] or {}
        table.insert(list[id], recipe)
    end


    for _, ingr in ipairs(recipe.ingredients) do
        local list_to_add = nil
        if ingr.type == "item" then
            list_to_add = self.item_recipes.ingredients
        elseif ingr.type == "fluid" then
            list_to_add = self.fluid_recipes.ingredients
        elseif ingr.type == "basic-fluid" or ingr.type == "basic-item" then
            list_to_add = self.resource_recipes.ingredients
        end

        if list_to_add ~= nil then
            add_recipe_to_list(list_to_add, ingr.name)
        end
    end

    for _, prod in ipairs(recipe.products) do
        local list_to_add = nil
        if prod.type == "item" then
            list_to_add = self.item_recipes.products
        elseif prod.type == "fluid" then
            list_to_add = self.fluid_recipes.products
        elseif prod.type == "basic-fluid" or prod.type == "basic-item" then
            list_to_add = self.resource_recipes.products
        end

        if list_to_add ~= nil then
            add_recipe_to_list(list_to_add, prod.name)
        end
    end
end

function RecipeCache:add_resource_recipe(recipe)
    local add_recipe_to_list = function (list, id)
        list[id] = list[id] or {}
        table.insert(list[id], recipe)
    end


    for _, ingr in ipairs(recipe.ingredients) do
        local list_to_add = self.resource_recipes.ingredients

        if list_to_add ~= nil then
            add_recipe_to_list(list_to_add, ingr.name)
        end
    end

    for _, prod in ipairs(recipe.products) do
        local list_to_add = self.resource_recipes.products

        if list_to_add ~= nil then
            add_recipe_to_list(list_to_add, prod.name)
        end
    end
end

function RecipeCache:build_rocket_launch_product_cache()
    local rocket_silo = game.entity_prototypes["rocket-silo"]
    local rocket_launch_cat = {producing_machines={["rocket-silo"]=rocket_silo}}

    local rocket_part = game.item_prototypes["rocket-part"]

    local rocket_launch_items = game.get_filtered_item_prototypes{{filter="has-rocket-launch-products"}}


    local num_rocket_launch_recipes = 0

    for item_id, rl_item in pairs(rocket_launch_items) do
        -- todo multiple rocket silo types support
        local rl_recipe = {
            ingredients= {{
                    type="item",
                    name=rocket_part.name,
                    localised_name=rocket_part.localised_name,
                    amount=rocket_silo.rocket_parts_required
                }, {
                    type="item",
                    name=item_id,
                    localised_name=rl_item.localised_name,
                    amount=1
                }
            },
            products= rl_item.rocket_launch_products,
            energy= rocket_silo.launch_wait_time or 0,
            category=rocket_launch_cat
        }
        --log("Rocket launch recipe: " .. item_id .. " - "..serpent.line(rl_recipe))
        --table.insert(self.rocket_launch.ingredients[item_id], rl_recipe)
        --table.insert(self.rocket_launch.ingredients["rocket-part"], rl_recipe)
        self:add_recipe(rl_recipe)
        num_rocket_launch_recipes = num_rocket_launch_recipes + 1
    end

    log("Added " .. num_rocket_launch_recipes .. " rocket launch recipes")
end

function RecipeCache:build_offshore_pump_mining_cache()
    -- check for offshore pump products
    local offshore_pumps = game.get_filtered_entity_prototypes({
        {filter = "type", type = "offshore-pump", mode = "and"},
    })

    local num_offshore_pump_recipes = 0

    for _,v in pairs(offshore_pumps) do
        if v.fluid ~= nil then
            self:add_recipe({
                ingredients = {},
                products = {{type="fluid", name=v.fluid.name, amount=math.round(v.pumping_speed*60, 2)}},
                energy = 1,
                category= {producing_machines={[v.name]=v}}
            })
            num_offshore_pump_recipes = num_offshore_pump_recipes + 1
        end
    end

    log("Added " .. num_offshore_pump_recipes .. " offshore pump recipes")
end

function RecipeCache:build_resource_mining_cache()
    local resource_recipes = self.resource_recipes


    -- populate self.resource_mining.recipes
    local resource_mining_raw = game.get_filtered_entity_prototypes({
        {filter = "type", type = "resource", mode = "and"},
    })

    local num_mining_recipes = 0

    for _,v in pairs(resource_mining_raw) do
        local minable_props = v.mineable_properties

        if minable_props.minable == true then
            local ingr = {
                {type=v.resource_category, -- a resource category like "basic-fluid" or "basic-item"
                 localised_name=v.localised_name,
                 sprite="entity/"..v.name,
                 name=v.name,
                 amount=1}
            }
            -- todo fluid as ingerdient

            if minable_props.required_fluid ~= nil then
                table.insert(ingr, {
                    type="fluid",
                    name=minable_props.required_fluid,
                    amount=minable_props.fluid_amount,
                })
            end

            local recipe = {
                ingredients= ingr,
                products= minable_props.products,
                energy=minable_props.mining_time,
                category=v.resource_category
            }

            self:add_resource_recipe(recipe)
            num_mining_recipes = num_mining_recipes + 1
        end
    end

    -- populate self.resource_mining.miners_for_category
    local resource_miners = game.get_filtered_entity_prototypes({{filter = "type", type = "mining-drill"}})
    for _,e in pairs(resource_miners) do
        for re_cat,mineable in pairs(e.resource_categories) do
            if mineable == true then
                if resource_recipes.miners_for_category[re_cat] == nil then
                    resource_recipes.miners_for_category[re_cat] = {}
                end

                resource_recipes.miners_for_category[re_cat][e.name] = e
            end
        end
    end

    log("Added " .. num_mining_recipes .. " mining recipes")
end

function RecipeCache:adapt_mining_to_force(res, recipes_to_adapt, force)
    if recipes_to_adapt == nil then
        return
    end
    debug:log_debug("Adapting mining recipes to force mining productivity")

    local mining_productivity = (force.mining_drill_productivity_bonus or 0) + 1

    for _, r in pairs(recipes_to_adapt) do
        local r_copy = flib_table.deep_copy(r)

        for _, pr in pairs(r_copy.products) do
            pr.amount = pr.amount * mining_productivity
        end

        table.insert(res, r_copy)
    end
end

function RecipeCache:get_additional_recipes_for_product(type, id, force)
    if type == "item" then
        local res = self.item_recipes.products[id] or {}

        local recipes_to_adapt = self.resource_recipes.products[id]
        self:adapt_mining_to_force(res, recipes_to_adapt, force)

        return res
    elseif type == "fluid" then
        return self.fluid_recipes.products[id] or {}
    else
        return {}
    end
end

function RecipeCache:get_additional_recipes_for_ingredient(type, id, force)
    if type == "item" then
        return self.item_recipes.ingredients[id] or {}
    elseif type == "fluid" then
        local res = {}
        local recipes_to_adapt = self.resource_recipes.ingredients[id]
        self:adapt_mining_to_force(res, recipes_to_adapt, force)

        return res
    else
        return {}
    end
end

function RecipeCache:get_crafting_machines(category)
    if type(category) == "table" then
        -- custom category only needed here for offshore pumps
        --log("Custom category: "..serpent.line(category.producing_machines))
        return category.producing_machines or {}
    end

    if game.resource_category_prototypes[category] ~= nil then
        return self.resource_recipes.miners_for_category[category] or {}
    elseif game.recipe_category_prototypes[category] ~= nil then
        return game.get_filtered_entity_prototypes({
            {filter= "crafting-category", crafting_category= category, mode= "and"},
        })
    end

    return {}
end

return RecipeCache