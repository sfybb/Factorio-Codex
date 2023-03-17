local function convert_codex(cdx, player_index)
    -- Added "keep_open" to codex
    cdx.keep_open = false


    if cdx.categories ~= nil then
        if cdx.categories.refs ~= nil then
            if cdx.categories.refs.available_entities ~= nil then
                cdx.categories.refs.available_entities.destroy()
            end
            cdx.categories.refs.available_entities = {}
        end
        cdx.categories.entity_lists = {}
    end
end


return function(additional_actions)
    log("Applying migrations for 0.0.15")

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