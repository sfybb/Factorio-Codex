local function convert_codex(cdx, player_index)
    --[[input structure: codex = {
            -- optional if codex hasnt been build
            refs = {
                window, -- keep
                titlebar_flow, -- keep
                search_field, -> move to Categories
                category_picker, -> move to Categories
                available_entities, -> move to Categories
                entity_viewer, -- keep
                entity_sprite, -- keep
                entity_desc_frame, -- keep
                entity_desc, -- keep
                entity_color, -- keep
                entity_usage, -- keep

                -- optional
                collapse_produced_by, -> move to RecipeInfo
                produced_by_items, -> move to RecipeInfo
                collapse_ingredient_in, -> move to RecipeInfo
                ingredient_in_items, -> move to RecipeInfo
            },
            entity_list, -> delete - has to be rebuild
            category, -> delete - has to be rebuild
            entity_view, -- keep
            produced_by_collapsed, -> move to RecipeInfo
            ingredient_in_collapsed -> move to RecipeInfo
        }]]
    --[[output structure: codex ={
        categories = {
            refs = {
                cat_gui, -- unavailable
                category_picker,
                available_entities,
            },
            entity_list,
            selected_index,
            selected_cat,
            rebuild_gui = true
        },
        recipe_info = {
            refs = {
                collapse_produced_by,
                produced_by_items,
                collapse_ingredient_in,
                ingredient_in_items
            },
            produced_by_collapsed,
            ingredient_in_collapsed,
            force_index,
        },
        refs = {
            window,
            titlebar_flow,
            codex_categories,
            search_field,
            entity_viewer,
            entity_sprite,
            entity_desc_frame,
            entity_desc,
            entity_color,
            entity_usage
        },
        visible, -- unavailable: compute from refs.window.visible
        entity_view,
        player_index,
        rebuild_gui = true
    }]]
    cdx.refs = cdx.refs or {}
    cdx.entity_view = cdx.entity_view or {}

    cdx.player_index = player_index

    if cdx.refs.window ~= nil then
        cdx.visible = cdx.refs.window.visible
    else
        cdx.visible = false
    end
    cdx.rebuild_gui = true

    cdx.categories = {
        refs = {
            cat_gui = nil, -- unavailable
            category_picker = cdx.refs.category_picker,
            available_entities = cdx.refs.available_entities,
        },
        entity_list = {},
        selected_index = 0,
        selected_cat = {},
        rebuild_gui = true
    }

    cdx.recipe_info = {
        refs = {
            collapse_produced_by = cdx.refs.collapse_produced_by,
            produced_by_items = cdx.refs.produced_by_items,
            collapse_ingredient_in = cdx.refs.collapse_ingredient_in,
            ingredient_in_items = cdx.refs.ingredient_in_items
        },
        produced_by_collapsed = cdx.produced_by_collapsed or false,
        ingredient_in_collapsed = cdx.ingredient_in_collapsed or false,
        force_index = game.get_player(player_index).force.index
    }

    cdx.refs.search_field = nil
    cdx.refs.category_picker = nil
    cdx.refs.available_entities = nil

    cdx.refs.collapse_produced_by = nil
    cdx.refs.produced_by_items = nil
    cdx.refs.collapse_ingredient_in = nil
    cdx.refs.ingredient_in_items = nil

    cdx.entity_list = nil
    cdx.category = nil
    cdx.produced_by_collapsed = nil
    cdx.ingredient_in_collapsed = nil

    if cdx.categories.refs.category_picker ~= nil then
        cdx.categories.refs.category_picker.clear_items()
        cdx.categories.refs.category_picker.add_item("Migration failed!")
        cdx.categories.refs.category_picker.add_item("Click here to crash!")
    end

    if cdx.categories.refs.available_entities ~= nil then
        cdx.categories.refs.available_entities.clear_items()
        cdx.categories.refs.available_entities.add_item("Migration failed!")
        cdx.categories.refs.available_entities.add_item("Click here to crash!")
    end
end

local function  convert_quick_search(qs, player_index)
    --[[input structure: quick_search = {
        refs = { -- keep all
            frame,
            caption,
            search_field,
            results
        },
        result_list, -- rename to search_results
        has_math, -- rename to search_has_math
    }]]
    --[[output structure: quick_search = {
        refs = {
            frame,
            caption,
            search_field,
            results
        },
        search_results,
        search_has_math,
        visible, -- compute
        player_index, -- create
        rebuild_gui
    }]]

    if qs.refs.window ~= nil then
        qs.visible = qs.refs.window.visible
    else
        qs.visible = false
    end
    qs.rebuild_gui = true

    qs.player_index = player_index

    qs.search_results = qs.result_list
    qs.search_has_math = qs.has_math

    qs.result_list = nil
    qs.has_math = nil
end

return function(additional_actions)
    log("Applying migrations for 0.0.10")

    -- init and build cache
    PlayerData.Cache:Init()
    global.cache = PlayerData.Cache:build()

    global.dicts = nil
	PlayerData.Dicitonary:Init()

    -- init codex
    PlayerData.Codex:Init()

    -- convert old codex + quick search structure to new one
    if global.players ~= nil then
        for indx, plyr in pairs(global.players) do
            log("Converting data for player \""..game.get_player(indx).name.."\" (index:"..indx..")")
            if plyr.codex ~= nil then
                --log("Codex Before: "..serpent.block(plyr.codex))
                convert_codex(plyr.codex, indx)
                --log("Codex After: "..serpent.block(plyr.codex))

                additional_actions[indx] = additional_actions[indx] or {}
                additional_actions[indx].codex = function()
                    local was_codex_open = plyr.codex.visible
                    plyr.codex:close()
                    if plyr.codex.entity_view.type ~= nil and plyr.codex.entity_view.id ~= nil then
                        plyr.codex:show_info(plyr.codex.entity_view.id, plyr.codex.entity_view.type)
                    end

                    if was_codex_open ~= plyr.codex.visible then
                        if was_codex_open == false then
                            plyr.codex:close()
                        end
                        -- why open codex at undefined position?
                    end
                end
            end
            if plyr.quick_search ~= nil then
                --log("QS Before: "..serpent.block(plyr.quick_search))
                convert_quick_search(plyr.quick_search, indx)
                --log("QS After: "..serpent.block(plyr.quick_search))

                additional_actions[indx] = additional_actions[indx] or {}
                additional_actions[indx].quick_search = function()
                    plyr.quick_search:build_gui()
                end
            end
        end
    end
end