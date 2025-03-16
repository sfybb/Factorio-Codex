local util = require("__core__.lualib.util")

local order = string.byte("0")

function createUserSetting(type, name, default_value)
    order = order + 1
    return {
        type = type .. "-setting",
        name = "fcodex_" .. name,
        setting_type = "runtime-per-user",
        default_value = default_value,
        order = string.char(order - 1)
    }
end


data:extend({
    createUserSetting("bool", "always_si_prefix", true),

    createUserSetting("bool",  "search_items", true),
    createUserSetting("color", "search_items_color", util.color("#D98E3E")),

    createUserSetting("bool",  "search_fluids", true),
    createUserSetting("color", "search_fluids_color", util.color("#5FA7A7")),

    createUserSetting("bool",  "search_technologies", true),
    createUserSetting("color", "search_technologies_color", util.color("#6BAF5F")),
    createUserSetting("bool",  "search_technologies_always_last", true),
})