local flib_table = require("__flib__.table")
local gui = require("__flib__.gui")
local on_tick_n = require("__flib__.on-tick-n")

local search_utils = require("scripts.search")
local qs_math = require("scripts.quick_search.qs_math")


local QuickSearch = {}
local QuickSearch_mt = {__index = QuickSearch}

local min_chars_for_search = 2
local dicts_to_search = {"item", "fluid", "technology"}


function QuickSearch:new(player_index)
    local o = {}
    setmetatable(o, QuickSearch_mt)

    o.player_index = player_index

    o.visible = false
    o.refs = {}
    o.search_results = {}
    o.search_has_math = false

    o.rebuild_gui = false

    return o
end

function QuickSearch:load()
    setmetatable(self, QuickSearch_mt)
    return self
end

function QuickSearch:destroy()
    if self.refs ~= nil and self.refs.frame ~= nil and type(self.refs.frame.destroy) == "function" then
        self.refs.frame.destroy()
    end
end

function QuickSearch:build_gui()
    if self.rebuild_gui == true then
        if self.refs.frame ~= nil and self.refs.frame.valid == true then
            self.refs.frame.destroy()
            self.refs = {}
        end
    end

    local player = game.get_player(self.player_index)

    if self.refs.frame == nil or self.refs.frame.valid == false then
        self.rebuild_gui = false
        self.refs = gui.build(player.gui.screen, {
            {
                type = "flow",
                direction = "vertical",
                style = "fcodex_quick_search",
                ref = {"frame"},
                actions = {
                    on_closed = "qs_close"
                },
                {type = "label", caption="QUICK SEARCH", style= "fcodex_quick_search_label", ref = {"caption"}},
                {type ="textfield", style= "fcodex_quick_search_input", ref = {"search_field"},
                 actions = {
                     on_text_changed = "qs_update_search",
                     on_confirmed = "qs_test_debug"
                 }},
                {type = "list-box", style= "fcodex_quick_search_results", ref = {"results"},
                 actions = {
                     on_selection_state_changed = "qs_try_open_codex"
                 }}
            }
        })

        self.refs.frame.visible = self.visible
    end

    self.refs.frame.location = {
        x=(player.display_resolution.width/2)-200,
        y=(player.display_resolution.height/2)-50,
    }
    self.refs.search_field.clear_and_focus_on_right_click = true
    self.refs.results.style.maximal_height = player.display_resolution.height/2 - 100
end

function QuickSearch:open()
    if not self.visible then
        self.visible = true

        self:build_gui()
        self.refs.frame.visible = true

        game.get_player(self.player_index).opened = self.refs.frame

        self.refs.frame.bring_to_front()
        self.refs.search_field.select_all()
        self.refs.search_field.focus()
    end
end

function QuickSearch:close()
    if self.visible then
        self.visible = false

        if self.refs.frame ~= nil then
            self.refs.frame.visible = false
        end

        local player = game.get_player(self.player_index)
        if player.opened then
            player.opened = nil
        end
    end
end

function QuickSearch:toggle()
    if self.visible then
        self:close()
    else
        self:open()
    end
end

function QuickSearch:is_open()
    return self.visible
end

function QuickSearch:set_rebuild_gui()
    self.rebuild_gui = true
end

function QuickSearch:display_result_list(unfiltered_list)
    self:remove_search_results()
    self.search_results = {}

    if #unfiltered_list == 0 then
        return
    end

    for _,data in ipairs(unfiltered_list) do
        if data.prototype ~= nil then
            local icon = "["..data.type.."="..data.id.."]"
            local text = data.name

            local debug_postfix = nil

            if debug:is_enabled() then
                debug_postfix = " M: "..data.match_count .. " O: " .. data.prototype.order
            end

            if data.type == "item" and data.prototype.has_flag("hidden") then
                text = nil
            elseif data.type == "technology" then
                text = "[color=#add8e6] " .. text .. "[/color]"
            end

            if text ~= nil and data.prototype.valid then
                table.insert(self.search_results, data)
                self.refs.results.add_item(icon .. text .. (debug_postfix or ""))
            end
        end
    end
end

function QuickSearch:remove_search_results()
    local math_text = nil
    if self.search_has_math == true and #self.refs.results.items >= 1 then
        math_text = self.refs.results.get_item(1)
    end

    self.refs.results.clear_items()

    if self.search_has_math == true then
        if math_text == nil then
            self.search_has_math = false
        else
            self.refs.results.add_item(math_text)
        end
    end
end

function QuickSearch:set_math_result(result, error)
    if result ~= nil or (error ~= nil and error ~= "") then
        local math_text = result ~= nil and ("=" .. result) or "=?"

        if self.search_has_math == true and #self.refs.results.items >= 1 then
            self.refs.results.set_item(1, math_text)
        else
            self.refs.results.add_item(math_text, 1)
        end

        self.math_result = result
        self.search_has_math = true
    else
        if self.search_has_math == true and #self.refs.results.items >= 1 then
            self.refs.results.remove_item(1)
        end

        self.math_result = nil
        self.search_has_math = false
    end
end

function QuickSearch:update_input(prompt)
    if self.visible == false then
        --log("Quick search not visible for player "..self.player_index)
        return
    end
    if prompt == nil then
        prompt = self.refs.search_field.text
    else
        log("Setting quick search text: "..prompt)
        self.refs.search_field.text = prompt
    end

    --log("Update input: \"".. (prompt or "") .. "\"")

    if prompt == "" then
        self.refs.results.clear_items()
        self.math_result = nil
        self.search_has_math = false

        --log("Quick search has empty prompt for player "..self.player_index)
        return
    end

    local math_prompt = string.gsub((prompt == nil) and "" or prompt, "%s+", "")

    local math_result, math_err = qs_math.calculate_result(math_prompt)
    self:set_math_result(math_result, math_err)

    local dicts_cache = global.cache:get_player_cache(self.player_index, "dicts_cache")
    if dicts_cache:is_translated() == false then
        self:remove_search_results()
        self.refs.results.add_item({ "factorio-codex.waiting-for-translation" })
        return
    end

    if self.last_search_task ~= nil then
        on_tick_n.remove(self.last_search_task)
    end
    self.last_search_task = on_tick_n.add(game.tick + 1, {
        player_index = self.player_index,
        gui = "qs",
        name = "update_search",
        prompt = prompt
    })
end

function QuickSearch:execute_task(task)
    if task.name == "update_search" then
        local dicts_cache = global.cache:get_player_cache(self.player_index, "dicts_cache")

        if dicts_cache:is_translated() == false then
            return
        end

        local dicts = {}
        for _,dict_name in pairs(dicts_to_search) do
            local dict = dicts_cache:get_names_dict(dict_name)
            if dict ~= nil then
                dicts[dict_name] = dict
            else
                log("Dict "..dict_name.." missing")
            end
        end

        local matching_names = search_utils.find(task.prompt, dicts)

        search_utils.sort(matching_names, {
            search_utils.sort_orders.hidden_last,
            search_utils.sort_orders.tech_last,
            search_utils.sort_orders.match_count,
            search_utils.sort_orders.factorio})

        --log(serpent.block(self.refs.results.valid, {maxnum=15}))

        self:display_result_list(matching_names)


        -- informatron magic stuff
        --[[for interface, functions in pairs(remote.interfaces) do
            if functions["informatron_menu"] and functions["informatron_page_content"] then

            end
        end]]

        return
    end
end

function QuickSearch:gui_action(action, event)
    if event.player_index ~= self.player_index then
        log("Error: Event received for quick search but player indexes mismatch! (QS: "..self.player_index..", E: "..event.player_index..")")
        local rec = game.get_player(self.player_index)
        local ex_rec = game.get_player(event.player_index)
        debug:player_print(self.player_index, "[factorio-codex] Error: You received an event that was for "..ex_rec.name..
                "! (Maybe invalid player data?)")

        debug:player_print(event.player_index, "[factorio-codex] Error: Your event got mistakenly sent to "..rec.name..
                "! (Maybe invalid player data?)")
    end

    local action_list = {
        qs_close = function() self:close() end,
        qs_update_search = function (event) self:update_input() end,
        qs_try_open_codex =
            function (event)
                local selected_index = event.element.selected_index

                if self.search_has_math then
                    if selected_index == 1 then
                        -- put math result into input if it is a valid formula
                        if self.math_result ~= nil then
                            self.refs.search_field.text = "" .. self.math_result
                            self.refs.search_field.focus()
                        end

                        return
                    end
                    selected_index = selected_index - 1
                end

                if  self.search_results == nil then
                    log("Cant open codex - empty result list")
                    return
                end

                --log("Quick Search result array: " .. serpent.block(quick_search.search_results))

                local selected = self.search_results[selected_index]

                if selected == nil or selected.type == "error" then
                    return
                end

                event.element.selected_index = 0

                --game.print("Index " .. event.element.selected_index .. " with content [" .. selected.type .. "=" .. selected.id .. "] \"" .. selected.name .. "\" was selected!")
                PlayerData:get_codex(event.player_index):show_info(selected.id, selected.type)
            end,
        qs_test_debug =
            function (event)
                if event.element.text == "debug!" then
                    debug:toggle(event.player_index)
                end
            end
    }

    local action_func = action_list[action]
    if action_func ~= nil then
        action_func(event)
    else
        log("Unknown action \"" .. action .. "\" for quick search!")
    end
end

function QuickSearch:validate(expected_player_indx)
    log("Quick Search Validate: Checking quick search...")
    local valid = true
    local fixed = true

    if getmetatable(self) ~= QuickSearch_mt then
        log("Quick Search Validate: Metatable is not the Quick Search metatable!")
        setmetatable(self, QuickSearch_mt)
        valid = false
        fixed = fixed and true
    end

    if self.player_index ~= expected_player_indx then
        log("Quick Search Validate: player index is wrong! E: "..expected_player_indx.." A: " .. serpent.line(self.player_index))
        self.player_index = expected_player_indx
        valid = false
        fixed = fixed and true
    end

    local not_nil_values = {
        "refs", "search_results", "visible", "search_has_math", "player_index"
    }
    local nil_detected = false

    for _,v in pairs(not_nil_values) do
        if self[v] == nil then
            log("Quick Search Validate: Detected nil value \""..v.."\" for player "..expected_player_indx)
            nil_detected = true
        end
    end

    if nil_detected then
        log("Quick Search Validate: Contents: " .. serpent.line(self, {nocode=true}))
        valid = false
        fixed = false
    end

    if self.refs.search_results ~= nil and self.refs.search_results.valid then
        local res_gui_length = #self.refs.search_results.items
        local res_length = #self.search_results

        local mismatch = res_gui_length ~= res_length

        if mismatch == true then
            log("Quick Search Validate: Mismatch between search_results gui element [1](len: "..serpent.line(res_gui_length)..
                    ") and search_results list [2](len: "..serpent.line(res_length).."):\n[1] "..
                    serpent.line(self.refs.search_results.items, {nocode=true}).."\n[2] "..
                    serpent.line(self.search_results, {nocode=true}))
            valid = false
            fixed = false
        end
    end

    return valid,fixed
end

return QuickSearch
