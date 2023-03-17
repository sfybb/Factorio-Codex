local TechInfo   = require("scripts.codex.technology_info")

local function convert_codex(cdx, player_index)
    -- Added "tech_info" to codex
    local player = game.get_player(player_index)
    cdx.tech_info = TechInfo:new(player.force.index)
end


return function(additional_actions)
    log("Applying migrations for 0.0.17")

    -- convert old codex + quick search structure to new one
    if global.players ~= nil then
        for indx, plyr in pairs(global.players) do
            log("Converting data for player \""..game.get_player(indx).name.."\" (index:"..indx..")")
            if plyr.codex ~= nil then
                convert_codex(plyr.codex, indx)
            end
            --[[if plyr.quick_search ~= nil then
                convert_quick_search(plyr.quick_search, indx)
            end]]
        end
    end
end