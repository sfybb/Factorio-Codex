local flib_table = require("__flib__.table")
local flib_gui = require("__flib__.gui")

local search = require("scripts.search")
local serpent = require("scripts.serpent")

local Categories = {}

function Categories:Init()
	local cat_item = {}
    --[[for n,g in pairs(game.item_group_prototypes) do
		table.insert(cat_item, {
			name=g.name,
			localised_name=g.localised_name,
			parent="item",
			order=g.order,
		})
    end

    table.sort(cat_item, function (a,b)
        return a.order <= b.order
    end)]]

    cat_item.name="item"
    cat_item.localised_name = {"", "Items"}

    local cat_tree = {
            cat_item,
            {name="fluid", localised_name = {"", "Fluids"}},
            {name="technology", localised_name = {"", "Technologies"}},
            {name="tile", localised_name = {"", "Tiles"}}
    }

    local cat_list = {}

    for _,cat in ipairs(cat_tree) do
        table.insert(cat_list, {
            name=cat.name,
            localised_name=cat.localised_name
        })

        for _,subcats in ipairs(cat) do
            if type(subcats) == "table" then
                table.insert(cat_list, {
                    name= subcats.name,
                    localised_name= subcats.localised_name,
                    parent= subcats.parent
                })
            end
        end
    end


    global.categories = {
        tree = cat_tree,
		list = cat_list
	}
end

function Categories:new()
    local o = {}   -- create object
    setmetatable(o, self)
    self.__index = self


    self.selected_index = 0 -- 0 when nothing is selected
    self.selected_cat = {}

    self.refs = {}
    self.entity_list = {}

    return o
end

function Categories:load()
    setmetatable(self, {__index = Categories})
    return self
end

function Categories:destroy()
    if self.refs ~= nil and self.refs.cat_gui ~= nil and type(self.refs.cat_gui.destroy) == "function" then
        self.refs.cat_gui.destroy()
    end
end

function Categories:select_by_name(cat_name)
    local indx = 0
    for i,cat in ipairs(global.categories.list) do
        if cat.name == cat_name then
            indx = i
            break
        end
    end

    self:select_by_index(indx)
end

function Categories:select_by_index(indx)
    local new_cat = global.categories.list[indx]

    if new_cat == nil or (self.selected_cat ~= nil and self.selected_cat.name == new_cat.name) then
        return
    end

    if self.refs.category_picker ~= nil and self.refs.category_picker.valid then
        self.refs.category_picker.selected_index = indx
    end

    self.selected_index = indx
    self.selected_cat = new_cat
    self:update_gui()
end

function Categories:get_unfiltered_entities()
	if self.selected_cat == nil then
		return {}
	end

	local res = {}

	local is_group = (self.selected_cat.parent ~= nil)
	local cat_type = (self.selected_cat.parent == nil) and self.selected_cat.name or self.selected_cat.parent.name

	if not is_group then
        res = game[cat_type.."_prototypes"]
	else
        local group_filter = {}

        for _,sub_g in pairs(game.item_group_prototypes[cat_type].subgroups) do
            table.insert(group_filter, {type="subgroup", subgroup=sub_g.name, mode="or"})
        end

        res = game.get_filtered_item_prototypes(group_filter)
	end

	local tmp = {}
    for n,proto in pairs(res) do
        table.insert(tmp, proto)
    end

    return tmp
end

function Categories:build_gui(parent_gui)
    if self.refs == nil then
        self.refs = {}
    end

    local gui_valid = self.refs.cat_gui ~= nil and self.refs.cat_gui.valid == true

    if self.rebuild_gui == true then
        gui_valid = false
        self.rebuild_gui = false
        if gui_valid then
            self.refs.cat_gui.destroy()
            self.refs = {}
        end
    end

    if gui_valid == true then
        return
    end

    local gui = {{
        type = "flow", direction = "horizontal", ref = { "cat_gui" },
        {type = "list-box",
            ref = {"category_picker"},
            style="fcodex_codex_type_section",
            actions = {
                on_selection_state_changed = "cx_change_category"
            }
        },
        --[[{type = "list-box",
            ref = {"category_picker_filtered"},
            style="fcodex_codex_type_section",
            visible = false,
            actions = {
                on_selection_state_changed = "cx_change_category"
            }
        },]]
        {type = "list-box",
            ref = {"available_entities"},
            style="fcodex_codex_entity_list",
            actions = {
                on_selection_state_changed = "cx_view_entity"
            }
        },
    }}

    --log("Build categories gui!")
    self.refs = flib_gui.build(parent_gui, gui)

    self.refs.category_picker.clear_items()
    for _,cat in ipairs(global.categories.list) do
        self.refs.category_picker.add_item(cat.localised_name)
    end

    if not (self.selected_index > 0) then
        self:select_by_index(1)
    else
        self:update_gui()
    end
end

function Categories:update_gui()
	if self.selected_cat == nil then
		return
	end

    --log("Update categories gui!")
    --log("Update gui Categories: " .. serpent.line(self.refs))

	self.entity_list = self:get_unfiltered_entities()

--	log(serpent.line(entity_list))
	self.refs.available_entities.clear_items()
	search.sort(self.entity_list, {
		search.sort_orders_codex.hidden_last,
		search.sort_orders_codex.factorio,
	})

--log(serpent.line(entity_list))
	for _,e in ipairs(self.entity_list) do
		local entity_text = {"", "[".. self.selected_cat.name .. "=" .. e.name .. "] ",e.localised_name }

        if self.selected_cat.name == "item" and e.has_flag("hidden") then
            entity_text = { "", "[color=gray]", entity_text, " [hidden][/color]"}
        end

        self.refs.available_entities.add_item(entity_text)
	end
end

function Categories:get_selected_entity_info(event)
    if self.entity_list == nil or event.element ~= self.refs.available_entities then
        return {}
    end

    return {
        type=self.selected_cat.name,
        id=self.entity_list[event.element.selected_index].name
    }
end

function Categories:scroll_to_item(e_id)
    if self.entity_list == nil or self.refs.available_entities == nil or self.refs.available_entities.valid == false then
        log("Can't scroll to entity id \""..e_id.."\": Empty list or gui non existent!")
        return
    end

    local scrolled = false
    for i,e in pairs(self.entity_list) do
        if e ~= nil and e.name == e_id then
            --log("Scrolling to index "..i.." (\""..serpent.line(self.refs.available_entities.get_item(i)).."\")")
            self.refs.available_entities.scroll_to_item(i)
            self.refs.available_entities.selected_index = i

            scrolled = true
            break
        end
    end

    if not scrolled and #self.entity_list > 0 then
        log("Id "..e_id.." not found!")
        self.refs.available_entities.scroll_to_top()
        self.refs.available_entities.selected_index = 0
    end
end

function Categories:validate()
    log("   Categories Validate: Checking categories...")
    local valid = true
    local fixed = true

    local not_nil_values = {
        "refs", "entity_list", "selected_cat", "selected_index"
    }
    local nil_detected = false

    for _,v in pairs(not_nil_values) do
        if self[v] == nil then
            log("   Categories Validate: Detected nil value \""..v.."\"")
            nil_detected = true
        end
    end

    if nil_detected then
        log("   Categories Validate: Contents: " .. serpent.line(self, {nocode=true}))
        valid = false
        fixed = false
    end

    return valid, fixed
end

return Categories
