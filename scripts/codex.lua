local gui = require("__flib__.gui")

local RecipeInfo = require("scripts.codex.recipe_info")
local Categories = require("scripts.codex.categories")

local serpent = require("scripts.serpent")


local Codex = {}

function Codex:Init()
    Categories:Init()
end

function Codex:new(player_index)
    local o = {}   -- create object if user does not provide one
    setmetatable(o, self)
    self.__index = self

    self.categories = Categories:new()
    self.recipe_info = RecipeInfo:new(game.players[player_index].force.index)

    self.player_index = player_index

    self.visible = false
    self.refs = {}
    self.entity_view = {}

    self.rebuild_gui = false

    return self
end

function Codex:load()
    setmetatable(self, {__index = Codex})

    self.categories = Categories.load(self.categories)
    self.recipe_info = RecipeInfo.load(self.recipe_info)

    --log("Codex load ("..self.player_index..") " .. serpent.line(self, {nocode=true}))
    return self
end

function Codex:destroy()
    if self.categories ~= nil then
        self.categories:destroy()
    end

    if self.recipe_info ~= nil then
        self.recipe_info:destroy()
    end

    if self.refs ~= nil and self.refs.window ~= nil and type(self.refs.window.destroy) == "function" then
        self.refs.window.destroy()
    end
end

function Codex:build_gui()
    if self.rebuild_gui == true then
        if self.refs.window ~= nil and self.refs.window.valid == true then
            self.refs.window.destroy()
            self.refs = {}
        end
    end

    local player = game.players[self.player_index]

    if self.refs.window == nil or self.refs.window.valid == false then
        self.rebuild_gui = false
        self.refs = gui.build(player.gui.screen, {
            {
                type = "frame",
                direction = "vertical",
                style = "fcodex_codex_main",
                ref = {"window"},
                actions = {
                    on_closed = "cx_close"
                },
                    {type = "flow", ref = {"titlebar_flow"}, children = {
                        {type ="label", style = "frame_title", caption = "Codex", ignored_by_interaction = true},
                        {type = "empty-widget", style = "flib_titlebar_drag_handle", ignored_by_interaction = true},
                        {
                            type = "sprite-button",
                            style = "frame_action_button",
                            sprite = "utility/close_white",
                            hovered_sprite = "utility/close_black",
                            clicked_sprite = "utility/close_black",
                            mouse_button_filter = {"left"},
                            actions = {
                                on_click = "cx_close"
                            }
                        }
                }},
                {type = "frame", direction = "horizontal", style= "fcodex_codex_frame_no_border",
                    {type = "flow", direction = "vertical", style= "fcodex_codex_vflow_no_border", ref = { "codex_categories" },
                        {type = "textfield",
                            enabled= false,
                            text= "Work In Progress",
                            ref = {"search_field"},
                            actions = {
                                on_text_changed = "cx_update_search"
                            }
                        },
                    },

                    {type = "flow", direction = "vertical", ref = { "entity_viewer" }, style="fcodex_codex_info_flow",
                        {type = "flow", direction = "horizontal",
                            {type = "sprite", style = "fcodex_desc_image", ref = {"entity_sprite"}},
                            {type = "flow", direction = "vertical", caption = "Entity", ref = {"entity_desc_frame"},
                                {type = "label", ref = {"entity_desc"}, style="fcodex_codex_desc"},
                                {type = "progressbar", ref = {"entity_color"}, style = "fcodex_codex_color_indicator", value=1}
                            }
                        },
                        {type = "scroll-pane", direction = "vertical", ref = { "entity_usage" }}
                    }
                }
            }
        })
    end

    self.categories:build_gui(self.refs.codex_categories)

    self.refs.titlebar_flow.drag_target = self.refs.window
    self.refs.window.force_auto_center()

    player.opened = self.refs.window
end

function Codex:item_info(item)
     local desc = {""}

     if #desc == 1 then
        desc = {"", "Empty for now. WIP"}
     end

     self.refs.entity_desc.caption = desc
     self.recipe_info:build_gui_for_item(self.refs.entity_usage, "item", item.name)
end

function Codex:technology_info(tech)
    self.refs.entity_desc.caption = tech.localised_description
end

function Codex:fluid_info(fluid)
    --self.refs.entity_desc.caption = "TODO"
    --  "[color=green]■[/color]"
    
    local color = fluid.base_color
    
    if color.r == 0 and color.g == 0 and color.b == 0 then
        -- do nothing
        self.refs.entity_color.visible = false
    else
        color_int = {
            a = math.round(color.a*255, 0),
            r = math.round(color.r*255, 0),
            g = math.round(color.g*255, 0),
            b = math.round(color.b*255, 0)
        }
    
        self.refs.entity_color.style.color = color
        self.refs.entity_color.visible = true
        self.refs.entity_color.tooltip = "Red:   " .. color_int.r .. "\n" ..
                                         "Green: " .. color_int.g .. "\n" ..
                                         "Blue:  " .. color_int.b
    end

	self.recipe_info:build_gui_for_item(self.refs.entity_usage, "fluid", fluid.name)
end

function Codex:show_info(id, id_type)
    if not self.visible then
        self:open()
    end

    --log(serpent.line(self, {nocode=true, maxnum=42}))

    --game.print("["..id_type.."="..id.."] "..id.." - "..id_type)
    local entity_prototype = game[id_type .. "_prototypes"][id]

    self.entity_view = {
        type=id_type,
        id=id
    }

    --log("Viewing ["..id_type.."="..id.."]")
    self.categories:select_by_name(id_type)
    self.categories:scroll_to_item(id)

    self.refs.entity_usage.scroll_to_top()


    self.refs.entity_sprite.sprite = id_type .. "/" .. id

    local sprite_tooltip = nil
    if entity_prototype.localised_description ~= nil then
        sprite_tooltip = entity_prototype.localised_description
    elseif id_type == "item" then
        if entity_prototype.place_result ~= nil then
            sprite_tooltip = entity_prototype.place_result.localised_description
        elseif entity_prototype.place_as_equipment_result ~= nil then
            sprite_tooltip = entity_prototype.place_as_equipment_result.localised_description
        elseif entity_prototype.place_as_tile_result ~= nil then
            sprite_tooltip = entity_prototype.place_as_tile_result.localised_description
        end
    end

    self.refs.entity_sprite.tooltip = sprite_tooltip
    --self.refs.entity_sprite.resize_to_sprite = false
    self.refs.entity_desc_frame.caption = entity_prototype.localised_name
    self.refs.entity_desc.caption = entity_prototype.localised_description
    self.refs.entity_color.visible = false

    self.refs.entity_usage.clear()

    local type_switch = {
        item=Codex.item_info,
        fluid=Codex.fluid_info,
        technology=Codex.technology_info
    }

    local func = type_switch[id_type]
    if func ~= nil then
        func(self, entity_prototype)
    end
end

function Codex:open()
    if not self.visible then
        --log("Codex opened! ("..self.player_index..")")
        self.visible = true

        self:build_gui()
        self.refs.window.visible = true

        game.players[self.player_index].opened = self.refs.window
    end
end

function Codex:close()
    if self.visible then
        --log("Codex closed! ("..self.player_index..") ")
        self.visible = false

        if self.refs.window ~= nil then
            self.refs.window.visible = false
        end

        local player = game.players[self.player_index]
        if player.opened then
            player.opened = nil
        end
    end
end

function Codex:toggle()
    if self.visible then
        self:close()
    else
        self:open()
    end
end

function Codex:gui_action(action, event)
    if event.player_index ~= self.player_index then
        log("Error: Event received for codex but player indexes mismatch! (QS: "..self.player_index..", E: "..event.player_index..")")
        local rec = game.players[self.player_index]
        local ex_rec = game.players[event.player_index]
        debug:player_print(self.player_index, "[factorio-codex] Error: You received an event that was for "..ex_rec.name..
                "! (Maybe invalid player data?)")

        debug:player_print(event.player_index, "[factorio-codex] Error: Your event got mistakenly sent to "..rec.name..
                "! (Maybe invalid player data?)")
    end

    local codex = self
    local action_list = {
        cx_close = function() codex:close() end,
        cx_change_category = function() codex.categories:select_by_index(event.element.selected_index) end,
        cx_view_entity =
            function (event)
                local selected = {
                    id= nil,
                    type= nil
                }
                local selected_index = event.element.selected_index

                -- was the entity list clicked?
                if selected_index ~= nil and selected_index > 0 then
                    selected = codex.categories:get_selected_entity_info(event)

                -- was a sprite button in the recipe view clicked?
                elseif event.element.type == "sprite-button" and  event.element.sprite ~= nil then
                    local entity_type, id = string.match(event.element.sprite, "^(%S+)[/.]([%S]+)")

                    if entity_type ~= "entity" then
                        selected.type = entity_type
                        selected.id = id
                    else
                        log("Invalid clicked type: \""..entity_type.."\" ignoring!")
                    end
                end

                if selected == nil or selected.id == nil or selected.type == nil then
                    return
                end

                if codex.visible == false then
                    game.players[codex.player_index].print("Can't view entity ["..selected.type.."="..selected.id.."]: No open codex")
                    return
                end

                codex:show_info(selected.id, selected.type)
            end,
        cx_update_search =
            function (event)
                -- do nothing for now
            end,
    }

    local player = game.get_player(event.player_index)

    local action_func = action_list[action]
    if action_func ~= nil then
        action_func(event)
    elseif self.recipe_info:handle_gui_action(action, event) then
    else
        game.print("Unknown action \"" .. action .. "\" for codex!")
    end
end

function Codex:set_rebuild_gui()
    self.rebuild_gui = true
end

function Codex:validate(expected_player_indx)
    log("Codex Validate: Checking codex...")
    local valid = true
    local fixed = true

    if self.player_index ~= expected_player_indx then
        log("Codex Validate: player index is wrong! E: "..expected_player_indx.." A: " .. serpent.line(self.player_index))
        valid = false
        fixed = fixed and true
    end

    local not_nil_values = {
        "refs", "entity_view", "visible", "rebuild_gui", "player_index", "recipe_info", "categories"
    }
    local nil_detected = false

    for _,v in pairs(not_nil_values) do
        if self[v] == nil then
            log("Codex Validate: Detected nil value \""..v.."\" for player "..expected_player_indx)
            nil_detected = true
        end
    end

    if nil_detected then
        log("Codex Validate: Contents: " .. serpent.line(self, {nocode=true}))
        valid = false
        fixed = false
    end

    if next(self.entity_view) ~= nil then
        local invalid = false
        for k,v in pairs(self.entity_view) do
            if k == "type" then
                -- todo check if type value is valid
            elseif k == "id" then
                -- todo check if id value is valid
            else
                log("Codex Validate: Found invalid key \""..k.."\" in entity_view! "..serpent.line(self.entity_view))
                invalid = true
                break
            end
        end

        if invalid then
            valid = false
            fixed = false
        end
    end

    local tmp_v, tmp_f = self.categories:validate()
    valid = valid and tmp_v
    fixed = fixed and tmp_f

    tmp_v, tmp_f = self.recipe_info:validate(game.players[self.player_index].force.index)
    valid = valid and tmp_v
    fixed = fixed and tmp_f

    return valid, fixed
end

return Codex
