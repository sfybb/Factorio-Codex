--[[serpent = require("serpent")

local events = require("scripts.events")

debug:set_log_level(2)]]

--[[local requireActual = require
local loaded_modules = {}]]

-- http://www.lua.org/manual/5.1/manual.html#pdf-package.loaders

require("build/events")

--require("scripts.events")
--debug:set_log_level(2)

--log("Factorio Codex package information: " .. serpent.line(package, {nocode =true}))

--[[PlayerData:PreInit()

if global.players ~= nil then
    for indx, plyr in pairs(global.players) do
        --script.register_metatable("Cache", getmetatable(global.cache))
    end
end]]