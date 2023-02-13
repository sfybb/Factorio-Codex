require("tests.mocks.flib")
require("tests.mocks.game")

local codex_cats = require("scripts.codex.categories")

local cat_class = {}
local flib_gui = {}

TestCodexCats = {}

	function TestCodexCats:setUp()
		global = {}
		codex_cats:Init()
		cat_class = codex_cats:new()
        flib_gui = require("__flib__.gui")
	end

	function TestCodexCats:test_category_list()
		lu.assertItemsEquals(global.categories, {
            tree = {{
                    name="item", localised_name={"", "Items"},
                    --{name="logistics", localised_name={"item-group-name.logistics"}, order="a", parent="item"},
                    --{name="production", localised_name={"item-group-name.production"}, order="b", parent="item"},
                },
                {name="fluid", localised_name={"", "Fluids"}},
                {name="technology", localised_name={"", "Technologies"}},
                {name="tile", localised_name={"", "Tiles"}}
            },
            list={
                {name="item", localised_name={"", "Items"}},
                --{name="logistics", localised_name={"item-group-name.logistics"}, parent="item"},
                --{name="production", localised_name={"item-group-name.production"}, parent="item"},
                {name="fluid", localised_name={"", "Fluids"}},
                {name="technology", localised_name={"", "Technologies"}},
                {name="tile", localised_name={"", "Tiles"}}
            }
        })
	end

	function TestCodexCats:test_select_category_name()
        local found_indx = nil
        cat_class.select_by_index = function (self, indx) found_indx = indx end

        cat_class:select_by_name("fluid")

        lu.assertEquals(global.categories.list[found_indx].name, "fluid")
    end

    function TestCodexCats:test_select_category_indx()
        local update_gui_called_times = 0
        cat_class.update_gui = function() update_gui_called_times = update_gui_called_times + 1 end

        cat_class:select_by_index(3)

        lu.assertEquals(cat_class.selected_index, 3)
        --lu.assertEquals(cat_class.selected_cat, {name="production", localised_name={"item-group-name.production"}, parent="item"})
        lu.assertEquals(cat_class.selected_cat, {name="technology", localised_name={"", "Technologies"}})
        lu.assertEquals(update_gui_called_times, 1)
    end

    function TestCodexCats:test_update_gui()
        local entity_list =  {"gets cleared"}

        flib_gui.build = function() return {
            entities = {
                clear_items = function () entity_list = {} end,
                add_item = function (item) table.insert(entity_list, item) end
            }
        } end

        cat_class.refs = {
            available_entities = {},
		}

		cat_class.selected_cat = {name="test cat", localised_name={"", "Test Cat"}}


        local i_has_flag_true = function (f) return f == "hidden" end
        local i_has_flag_false = function (f) return false end

        local entity_list = {}
        table.insert(entity_list, {name="item_D", object_name="LuaItemPrototype", has_flag=i_has_flag_false, order="d", localised_name="LI D"})
        table.insert(entity_list, {name="item_C", object_name="LuaItemPrototype", has_flag=i_has_flag_true,  order="c", localised_name="LI C"})
        table.insert(entity_list, {name="item_B", object_name="LuaItemPrototype", has_flag=i_has_flag_false, order="b", localised_name="LI B"})
        table.insert(entity_list, {name="item_A", object_name="LuaItemPrototype", has_flag=i_has_flag_false, order="a", localised_name="LI A"})

        cat_class.get_unfiltered_entities = function() return entity_list end


        cat_class:update_gui()


        lu.assertEquals(entity_list, {
            {name="item_A", object_name="LuaItemPrototype", has_flag=i_has_flag_false, order="a", localised_name="LI A"},
            {name="item_B", object_name="LuaItemPrototype", has_flag=i_has_flag_false, order="b", localised_name="LI B"},
            {name="item_D", object_name="LuaItemPrototype", has_flag=i_has_flag_false, order="d", localised_name="LI D"},
            {name="item_C", object_name="LuaItemPrototype", has_flag=i_has_flag_true,  order="c", localised_name="LI C"},
        })
    end
