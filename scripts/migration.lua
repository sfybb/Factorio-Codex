local flib_migration = require("__flib__.migration")
local serpent = require("scripts.serpent")

local migration_0_0_10 = require("scripts.migrations.migrate_0_0_10")

local migrations = {
    ["0.0.10"] = migration_0_0_10,
}

local migration = {}
migration.migrate = function (e)
    local additional_actions = {}
    log("Checking for migration")
    if flib_migration.on_config_changed(e, migrations, nil,  additional_actions) then
        -- todo Reset dictionary stuff
        log("Migration scripts done")

        log("Running final migration actions")
        PlayerData:load_metatables()

        for i,actions in pairs(additional_actions) do
            -- actions is a table containing additional functions to run
            --log(serpent.line(global.players[i].codex, {nocode=true}))
            for action_name, migration_action in pairs(actions) do
                if type(migration_action) == "function" then
                    --log("Running additional migration action (\""..action_name
                    --        .."\") for \""..game.players[i].name.."\" (index:"..i..")")
                    migration_action()
                end
            end
        end



        --log(serpent.dump(global, {sparse=true, nocode=true, maxnum=42}))
        --log(serpent.line(global, {nocode=true}))
        --log(debug.traceback())

        migration.refresh_guis()

        log("Running validation")
        PlayerData:validate()
        -- reload prototypes in util


        --[[
        for _,player in pairs(game.players) do
            if player ~= nil then
                local player_data = util.get_player_data(player)

                log("Loading possibly old data for player \""..player.name.."\"")
                log(serpent.block(player_data))
                player_data.codex:set_rebuild_gui()
            end
        end

        player_data.migrate()
        ]]
        log("Migration done")
    end
end

migration.refresh_guis = function ()
    -- todo
end

return migration