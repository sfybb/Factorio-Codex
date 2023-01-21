local RecipeCache = { global=true, id="recipe_cache", name="Recipe Cache" }

local flib_table = require("__flib__.table")
local serpent = require("scripts.serpent")

function RecipeCache:Init(cache_list)
    cache_list[RecipeCache.id] = RecipeCache
end

function RecipeCache:load()
    setmetatable(self, {__index = RecipeCache})
    return self
end

function RecipeCache:build()
    local r_cache = {}
    setmetatable(r_cache, self)
    self.__index = self

    self.resource_mining = {
        recipes={}, -- list of all miner recipes
        recipes_for_product={}, -- maps products to recipes

        miners_for_category={} -- list of allowed miners for a category
    }
    self.offshore_pumps = {
        recipes_for_product = {}, -- maps products to recipes
    }

    self.rocket_launch = {
        products = {},
        ingredients = {}
    }

    self:build_resource_mining_cache()
    self:build_offshore_pump_mining_cache()
    self:build_rocket_launch_product_cache()

    return self
end

function RecipeCache:build_rocket_launch_product_cache()
    local rocket_silo = game.entity_prototypes["rocket-silo"]
    local rocket_launch_cat = {producing_machines={["rocket-silo"]=rocket_silo}}

    local rocket_part = game.item_prototypes["rocket-part"]

    local rocket_launch_items = game.get_filtered_item_prototypes{{filter="has-rocket-launch-products"}}

    self.rocket_launch.ingredients["rocket-part"] = {}
    for item_id, rl_item in pairs(rocket_launch_items) do
        self.rocket_launch.ingredients[item_id] = self.rocket_launch.ingredients[item_id] or {}

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
        table.insert(self.rocket_launch.ingredients[item_id], rl_recipe)
        table.insert(self.rocket_launch.ingredients["rocket-part"], rl_recipe)

        for _,pr in pairs(rl_item.rocket_launch_products) do
            self.rocket_launch.products[pr.name] = self.rocket_launch.products[pr.name] or {}
            table.insert(self.rocket_launch.products[pr.name], rl_recipe)
        end
    end
end

function RecipeCache:build_offshore_pump_mining_cache()
    -- check for offshore pump products
    local offshore_pumps = game.get_filtered_entity_prototypes({
        {filter = "type", type = "offshore-pump", mode = "and"},
    })

    local recipes_for_product = self.offshore_pumps.recipes_for_product
    for _,v in pairs(offshore_pumps) do
        if v.fluid ~= nil then
            local added = false

            if recipes_for_product[v.fluid.name] == nil then
                recipes_for_product[v.fluid.name] = {}
            else
                -- compare with existing found recipe
                for _, ex_r in pairs(recipes_for_product[v.fluid.name]) do
                    if ex_r.products.name == v.fluid.name and ex_r.products.amount == v.pumping_speed then
                        ex_r.category.producing_machines[v.name] = v
                        added = true
                        break
                    end
                end
            end

            if added == false then
                -- pumping speed units is per tick, we want per second
                table.insert(recipes_for_product[v.fluid.name], {
                    ingredients = {},
                    products = {{type="fluid", name=v.fluid.name, amount=v.pumping_speed*60}},
                    energy = 1,
                    category= {producing_machines={[v.name]=v}}
                })
            end
        end
    end
end

function RecipeCache:build_resource_mining_cache()
    local resource_mining = self.resource_mining


    -- populate self.resource_mining.recipes
    local resource_mining_raw = game.get_filtered_entity_prototypes({
        {filter = "type", type = "resource", mode = "and"},
    })
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

            if minable_props.required_fluid ~= nil then
                table.insert(ingr, {
                    type="fluid",
                    name=minable_props.required_fluid,
                    amount=minable_props.fluid_amount,
                })
            end

            table.insert(self.resource_mining.recipes, {
                ingredients= ingr,
                products= minable_props.products,
                energy=minable_props.mining_time,
                category=v.resource_category
            })
        end
    end

    -- populate self.resource_mining.recipes_for_product
    for _,r in pairs(self.resource_mining.recipes) do
        for _,prod in pairs(r.products) do
            -- TODO possible clash of prod.name with another product of different type

            if resource_mining.recipes_for_product[prod.name] ~= nil then
                table.insert(resource_mining.recipes_for_product[prod.name], r)
            else
                resource_mining.recipes_for_product[prod.name] = {r}
            end
        end
    end

    -- populate self.resource_mining.miners_for_category
    local resource_miners = game.get_filtered_entity_prototypes({{filter = "type", type = "mining-drill"}})
    for _,e in pairs(resource_miners) do
        for re_cat,mineable in pairs(e.resource_categories) do
            if mineable == true then
                if resource_mining.miners_for_category[re_cat] == nil then
                    resource_mining.miners_for_category[re_cat] = {}
                end

                resource_mining.miners_for_category[re_cat][e.name] = e
            end
        end
    end
end

function RecipeCache:adapt_mining_to_force(res, id, force)
    local recipes_to_adapt = self.resource_mining.recipes_for_product[id]
    if recipes_to_adapt == nil then
        return
    end

    local mining_productivity = force.mining_drill_productivity_bonus + 1

    for _, r in pairs(recipes_to_adapt) do
        local r_copy = flib_table.shallow_copy(r)
        r_copy.products = flib_table.shallow_copy(r.products)

        for _, pr in pairs(r_copy.products) do
            pr.amount = pr.amount * mining_productivity
        end

        table.insert(res, r_copy)
    end
end

function RecipeCache:get_additional_recipes_for_product(type, id, force)
    if type == "item" then
        local res = self.rocket_launch.products[id] or {}

        self:adapt_mining_to_force(res, id, force)

        return res
    elseif type == "fluid" then
        return self.offshore_pumps.recipes_for_product[id] or {}
    else
        return {}
    end
end

function RecipeCache:get_additional_recipes_for_ingredient(type, id, force)
    if type == "item" then
        return self.rocket_launch.ingredients[id] or {}
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
        return self.resource_mining.miners_for_category[category] or {}
    elseif game.recipe_category_prototypes[category] ~= nil then
        return game.get_filtered_entity_prototypes({
            {filter= "crafting-category", crafting_category= category, mode= "and"},
        })
    end

    return {}
end

return RecipeCache