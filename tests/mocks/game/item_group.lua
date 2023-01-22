game.item_group_prototypes = {
    logistics = {
        localised_name = { "item-group-name.logistics" },
        name = "logistics",
        object_name = "LuaGroup",
        order = "a",
        order_in_recipe = "a",
        subgroups = {{
            localised_name = "",
            name = "storage",
            object_name = "LuaGroup",
            order = "a[storage]",
            type = "item-subgroup",
            valid = true
        }, {
            localised_name = "",
            name = "belt",
            object_name = "LuaGroup",
            order = "b",
            type = "item-subgroup",
            valid = true
        }, {
            localised_name = "",
            name = "inserter",
            object_name = "LuaGroup",
            order = "c",
            type = "item-subgroup",
            valid = true
        }, {
            localised_name = "",
            name = "energy-pipe-distribution",
            object_name = "LuaGroup",
            order = "d",
            type = "item-subgroup",
            valid = true
        }, {
            localised_name = "",
            name = "train-transport",
            object_name = "LuaGroup",
            order = "e",
            type = "item-subgroup",
            valid = true
        }, {
            localised_name = "",
            name = "transport",
            object_name = "LuaGroup",
            order = "f",
            type = "item-subgroup",
            valid = true
        }, {
            localised_name = "",
            name = "logistic-network",
            object_name = "LuaGroup",
            order = "g",
            type = "item-subgroup",
            valid = true
        }, {
            localised_name = "",
            name = "circuit-network",
            object_name = "LuaGroup",
            order = "h",
            type = "item-subgroup",
            valid = true
        }, {
            localised_name = "",
            name = "terrain",
            object_name = "LuaGroup",
            order = "i",
            type = "item-subgroup",
            valid = true
        },
        },
        type = "item-group",
        valid = true
    },
    production = {
        localised_name = { "item-group-name.production" },
        name = "production",
        object_name = "LuaGroup",
        order = "b",
        order_in_recipe = "b",
        subgroups = {{
            localised_name = "",
            name = "energy",
            object_name = "LuaGroup",
            order = "b",
            type = "item-subgroup",
            valid = true
        }, {
            localised_name = "",
            name = "extraction-machine",
            object_name = "LuaGroup",
            order = "c",
            type = "item-subgroup",
            valid = true
        }, {
            localised_name = "",
            name = "smelting-machine",
            object_name = "LuaGroup",
            order = "d",
            type = "item-subgroup",
            valid = true
        }, {
            localised_name = "",
            name = "production-machine",
            object_name = "LuaGroup",
            order = "e",
            type = "item-subgroup",
            valid = true
        }, {
            localised_name = "",
            name = "module",
            object_name = "LuaGroup",
            order = "f",
            type = "item-subgroup",
            valid = true
        }, {
            localised_name = "",
            name = "space-related",
            object_name = "LuaGroup",
            order = "g",
            type = "item-subgroup",
            valid = true
        }
        },
        type = "item-group",
        valid = true
    },
}
