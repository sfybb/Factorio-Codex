local flib_migration = require("__flib__.migration")
local serpent = require("scripts.serpent")
local on_tick_n = require("__flib__.on-tick-n")
local Dict = require("scripts.dictionary")

local migrations = {
    ["0.0.10"] = require("scripts.migrations.migrate_0_0_10"),
	["0.0.12"] = require("scripts.migrations.migrate_0_0_13"),
    ["0.0.15"] = require("scripts.migrations.migrate_0_0_15"),
}

local migration = {}
migration.migrate = function (e)
    local additional_actions = {}
    log("Checking for migration")
    if flib_migration.on_config_changed(e, migrations, nil,  additional_actions) then
        -- todo Reset dictionary stuff
        on_tick_n.init()
        log("Migration scripts done")


        log("Running validation")
        PlayerData:load_metatables()
        PlayerData:validate()

        log("Invalidating and rebuilding caches")
        global.cache:rebuild_all()
        Dict:rebuild()

        log("Running final migration actions")


        --[[for i,actions in pairs(additional_actions) do
            -- actions is a table containing additional functions to run
            --log(serpent.line(global.players[i].codex, {nocode=true}))
            for action_name, migration_action in pairs(actions) do
                if type(migration_action) == "function" then
                    --log("Running additional migration action (\""..action_name
                    --        .."\") for \""..game.get_player(i).name.."\" (index:"..i..")")
                    migration_action()
                end
            end
        end]]



        --log(serpent.dump(global, {sparse=true, nocode=true, maxnum=42}))
        --log(serpent.line(global, {nocode=true}))
        --log(debug.traceback())




        migration.refresh_guis()
        -- reload prototypes in util

        log("Migration done")
        PlayerData:print_global_data()
    end
end

migration.refresh_guis = function ()
    -- todo
    for indx,_ in pairs(global.players) do
        local qs = PlayerData:get_quick_search(indx)
        qs:set_rebuild_gui()

        local qs_open = qs:is_open()

        local cdx = PlayerData:get_codex(indx)
        cdx:set_rebuild_gui()

        local cdx_open = cdx:is_open()

        qs:close()
        qs:open()
        qs:close()

        cdx:close()
        cdx:open()
        cdx:close()

        if qs_open then
            qs:open()
        end

        if cdx_open and cdx.entity_view ~= nil then
            cdx:show_info(cdx.entity_view.id, cdx.entity_view.type)
        end
    end
end

return migration