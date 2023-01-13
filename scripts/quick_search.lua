local flib_table = require("__flib__.table")
local gui = require("__flib__.gui")

local util = require("scripts.util")
local codex = require("scripts.codex")
local search_utils = require("scripts.search")


local quick_search = {}

local min_chars_for_search = 2
local dicts_to_search = {"item", "fluid", "technology"}


local function build_quick_search(player)
    local refs = gui.build(player.gui.screen, {
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
                    on_text_changed = "qs_update_search"
            }},
            {type = "list-box", style= "fcodex_quick_search_results", ref = {"results"},
                actions = {
                    on_selection_state_changed = "qs_try_open_codex"
            }}
        }
    })
    
    local player_table = util.get_player_data(player)
    if player_table == nil then
        player_table = {}
    end
    
    player_table.quick_search = {
        refs = refs
    }
    util.set_player_data(player, player_table)


    refs.frame.location = {
        x=(player.display_resolution.width/2)-200,
        y=(player.display_resolution.height/2)-50,
    }
    refs.search_field.clear_and_focus_on_right_click = true
    refs.results.style.maximal_height = player.display_resolution.height/2 - 100
    
    
    player.opened = refs.frame
    return player_table.quick_search
end

local function toggle_quick_search(player)
    local player_table = util.get_player_data(player)
    if player_table == nil then
        player_table = {}
    end
    
    local quick_search = player_table.quick_search

    if quick_search ~= nil and quick_search.refs.frame.visible then
        quick_search.refs.frame.visible = false
        quick_search.refs.search_field.select_all()
        
        if player.opened then
            player.opened = nil
        end
    else
        if quick_search == nil then
            quick_search = build_quick_search(player)
        end
    
        quick_search.refs.frame.visible = true
        player.opened = quick_search.refs.frame
        
        quick_search.refs.frame.bring_to_front()
        quick_search.refs.search_field.focus()
    end
end



local function find_matching_prompt(lower_prompt, dicts)
    if lower_prompt == nil or string.len(lower_prompt) < min_chars_for_search then
        return {{
            type= "error",
            id= "error",
            name= "Pleas enter more characters"
        }}
    elseif dicts == nil then
        return {{
            type= "error",
            id= "error",
            name= "Waiting for translation..."
        }}
    end
    
    
    
   --[[ for id,name in paris(dicts.fluid_names) do
        game.print("[" .. id .. "] " .. name)
    end]]

    local result = {}
    
    for _,dict_name in pairs(dicts_to_search) do
        local dict = dicts[dict_name .. "_names"]
        if dict ~= nil then
            local tmp = flib_table.filter(dict, function (str)  return string.find(string.lower(str), lower_prompt, nil, true) end)

            
            local prototype_field_name = dict_name .. "_prototypes"
            
            for id,name in pairs(tmp) do
                table.insert(result, {
                    prototype = game[prototype_field_name][id],
                    type = dict_name,
                    id = id,
                    name = name
                })
            end
        end
    end

    return result
end



-- Math calculator adapted from https://gist.github.com/Noble-Mushtak/a2eb302003891c85b562
local function getNumber(str)
    local num, rem = string.match(str, "^([%d%.]+)([%s%S]*)")
    if num == nil then
        return nil, str
    end

    return tonumber(num), rem
end

local function calculateResult(expression, expectEndParentheses)
    if string.find(expression, "^[0-9%.%+%-%*%/%^%(%)%s]*$") == nil then
        return nil
    end
    
	if expectEndParentheses == nil then
		expression = string.gsub((expression == nil) and "" or expression, "%s+", "")
	end
	
    --This is true if and only if we are expecting an expression next instead of an operator.
    local expectingExpression = true
    --This is true if and only if the last expression examined was surrounded by parentheses.
    local lastExpressionWasParenthetical = false
    --These are all the operators in our parser.
    local operators = "[%+%-%/%*%^]"
    
    --This is a list of all of the parts in our expression.
    local parts = {}
    --This is true if and only if we have found an unmatched end parentheses.
    local foundEndParentheses = false
    --If expectEndParentheses is not specified, make it default to false.
    expectEndParentheses = expectEndParentheses or false
    
    
    --We want to parse the expression until we have broken it up into all of its parts and there is nothing left to parse:
    while expression ~= "" do
        --Check if there is a number at the beginning of expression.
        local nextNumber, expressionAfterNumber = getNumber(expression)
        --This is the next character:
        local nextCharacter = expression:sub(1, 1)
        --This is the next piece of the expression, used in error messages:
        local nextPiece = expression:sub(1, 5)
        --Add " [end]" if expression has 5 characters or less to signify that this piece is the end of the expression
        if #expression <= 5 then nextPiece = nextPiece.." [end]" end
        --If we expect an expression:
        if expectingExpression then
            --If there is a beginning parentheses next, parse the expression inside the parentheses:
            if nextCharacter == "(" then
                --Parse the next expression by taking the beginning parentheses off and outting the rest of the expression into calculateResult Also, make expectEndParentheses true so that the expression will only be parsed up to the next end parentheses that is not matched without this beginning parentheses.
                local nestedExpressionValue, expressionAfterParentheses = calculateResult(expression:sub(2, #expression), true)
                --If the value returned is nil, then parsing this expression must have caused an error, so return the error message.
                if nestedExpressionValue == nil then return nestedExpressionValue, expressionAfterParentheses end
                --Otherwise, insert the value into parts.
                table.insert(parts, nestedExpressionValue)
                --Also, update expression by going on to what's after the parentheses.
                expression = expressionAfterParentheses
                --Make lastExpressionWasParenthetical true.
                lastExpressionWasParenthetical = true
            --Otherwise, if there is no parentheses, parse the next number:
            else
                --If the next number is nil, then return an error message.
                if nextNumber == nil then return nil, "Expected number or '(', but found '"..nextPiece.."'" end
                --Otherwise, insert the number into parts.
                table.insert(parts, nextNumber)
                --Also, update expression by going on to what's after the number.
                expression = expressionAfterNumber
                --Make lastExpressionWasParenthetical false.
                lastExpressionWasParenthetical = false
            end
        --The following cases deal with the case that we expect an operator instead of an expression.       
        --If the next character is an operator:
        elseif string.find(nextCharacter, operators) ~= nil then
            --Insert the operator into parts.
            table.insert(parts, nextCharacter)
            --Also, update expression by taking out the operator.
            expression = expression:sub(2, #expression)
        --If the next character is a beginning parentheses or the preceding character was an end parentheses and there is a valid number after it, insert a multiplication sign.
        elseif nextCharacter == "(" or (lastExpressionWasParenthetical and nextNumber ~= nil) then table.insert(parts, "*")
        --If the next character is an end parentheses:
        elseif nextCharacter == ")" then
            --If we expect an end parentheses:
            if expectEndParentheses then
                --Take the parentheses out of the expression.
                expression = expression:sub(2, #expression)
                --Set foundEndParentheses to true and exit the while loop.
                foundEndParentheses = true
                break
            --Otherwise, if we were not expecting an end parentheses, then return an error message.
            else return nil, "')' present without matching '(' at '"..nextPiece.."'" end
        --If none of the above cases apply, then the expression must be invalid, so return an error message.
        else return nil, "Expected expression, but found '"..nextPiece.."'" end
        --If we are expecting an expression, switch to expecting an operator and vice versa.
        expectingExpression = not expectingExpression
    end
    
    --If, at the end, we are left expecting an expression or have not found an end parentheses despite being told we would, then the expression ended before it was supposed to, so return an error message.
    
    --if there is a number missing at the end add the identity for the last operator
    if expectingExpression then
        local i = #parts
        local lastOperator = parts[i]
        
        if lastOperator == '+' or lastOperator == '-' then
            table.insert(parts, 0)
        else
            table.insert(parts, 1)
        end
    end
    
    
    --Otherwise, the expression has been parsed successfully, so now we must evaulate it.
    --Loop through parts backwards and evaluate the exponentiation operations:
    --Notice that we loop through exponentiation since exponentiation is right-associative (2^3^4=2^81, not 8^4) and that we do not use a for loop since the value of #parts is going to change.
    local i = #parts
    while i >= 1 do
        --If the current part is an exponentiation operator, evaluate the operation, put the result in the slot of the former number, and remove the operator along with the latter number.
        if parts[i] == "^" then
            parts[i-1] = parts[i-1]^parts[i+1]
            table.remove(parts, i+1)
            table.remove(parts, i)
        end
        --Decrement i.
        --Notice that we decrement i regardless of if we have just encountered an exponentiation operator. This is because since we are going backwards, the operator we are on after removing the exponentiation operator must have been ahead of the exponentiation operator in the expression and thus could not have been an exponentiation operator.
        --To understand this better, examine the expression "2^3*4^5". How would this while loop deal with that expression by making sure that all of the exponentiation operations are evaluated?
        i = i-1
    end
    
    --Loop through parts forwards and evaluate the multiplication and division operators.
    --Notice that we loop forward since division is left-associative (1/2/4=0.5/4, not 1/0.5).
    i = 1
    while i <= #parts do
        --If the current part is a multiplication operator, evaluate the operation, put the result in the slot of the former number, and remove the operator along with the latter number.
        if parts[i] == "*" then
            parts[i-1] = parts[i-1]*parts[i+1]
            table.remove(parts, i+1)
            table.remove(parts, i)
        --If the current part is an division operator, evaluate the operation, put the result in the slot of the former number, and remove the operator along with the latter number.
        elseif parts[i] == "/" then
            parts[i-1] = parts[i-1]/parts[i+1]
            table.remove(parts, i+1)
            table.remove(parts, i)
        --Increment if the current part is not an operator.
        --Notice that we make this incrementation conditional. This is because since we are going backwards, incrementing after we have just processed an operator could make us skip a multiplication or division operator by hopping over it.
        --To understand this better, examine the expression "1/2/3". How does making this incrementation conditional prevent us from skipping over a division operator?
        else i = i+1 end
    end
    --Loop through parts forwards and evaluate the addition and subtraction operators.
    --Notice that we loop forward since subtraction is left-associative (1-2-3=-1-3, not 1-(-1)).
    i = 1
    while i <= #parts do
        --If the current part is an exponentiation operator, evaluate the operation, put the result in the slot of the former number, and remove the operator along with the latter number.
        if parts[i] == "+" then
            parts[i-1] = parts[i-1]+parts[i+1]
            table.remove(parts, i+1)
            table.remove(parts, i)
        --If the current part is an exponentiation operator, evaluate the operation, put the result in the slot of the former number, and remove the operator along with the latter number.
        elseif parts[i] == "-" then
            parts[i-1] = parts[i-1]-parts[i+1]
            table.remove(parts, i+1)
            table.remove(parts, i)
        --Just like with multiplication and division, increment i if the current part is not an operator.
        else i = i+1 end
    end
    --Finally, return the answer (which is in the first element of parts) along with the rest of the expression to be parsed.
    return parts[1], expression
end
-- end of math calculator

local function format_data(data)
    local id = data.id
    local name = data.name
    local type = data.type
    local prototype = data.prototype

    local switch = {
        error = function() return name end,
        item = function()
                local text = "[item=" .. id ..  "] " .. name
                if prototype.has_flag("hidden") then
                    --text = "[color=gray]" .. name .. " [hidden][/color]"
                    text = nil
                end
                return text
            end,
        fluid = function()
                local text = nil
                --if not prototype.hidden and not prototype.valid then
                    text = "[fluid=" .. id ..  "] " .. name
                --end
                return text
            end,
        technology = function()
                local text = nil
                --if not prototype.hidden and not prototype.valid then
                    text = "[technology=" .. id ..  "][color=#add8e6] " .. name .. "[/color]"
                --end
                return text
            end
    }

    local switch_res = switch[type]
    
    if switch_res == nil then
        return "[" .. id .. "] " .. name .. " (" .. type .. " )"
    else
        return switch_res()
    end
end

local function quick_search_update_input(player, prompt)
    local player_table = util.get_player_data(player)
    
    local quick_search = player_table.quick_search
    -- if quick search not shown dont do anything
    if quick_search == nil then
        return
    end
    
    
    local results_list = quick_search.refs.results
    
    if prompt == nil then
        prompt = quick_search.refs.search_field.text
    end

    local math_prompt = string.gsub((prompt == nil) and "" or prompt, "%s+", "")
    local lower_prompt = string.lower(prompt)

    results_list.clear_items()
    if prompt == "" then
        -- TODO remove results
        return
    end

    local math_result, math_err = calculateResult(math_prompt)
    quick_search.math_result = nil
    quick_search.has_math = false
    if math_result ~= nil then
        results_list.add_item("=" .. math_result)
        quick_search.math_result = math_result
        quick_search.has_math = true
    elseif math_err ~= nil and math_err ~= ""  then
        results_list.add_item("=?")
        quick_search.math_result = nil
        quick_search.has_math = true
    end
    
    
    if player_table.dicts == nil then
        --results_list.add_item("Waiting for translations...")
        results_list.add_item({"factorio-codex.waiting-for-translation"})
        
        return
    end
    
    
    local dicts = {}
    for _,dict_name in pairs(dicts_to_search) do
        local dict = player_table.dicts[dict_name .. "_names"]
        if dict ~= nil then
            dicts[dict_name] = dict
        end
    end

    local matching_names = search_utils.find(prompt, dicts)
    
    --[[local separatorCharacters = " -"
    table.sort(matching_names,
    function(a, b)
        local exact_match_a = string.find(a.name, prompt, nil, true)
        local exact_match_b = string.find(b.name, prompt, nil, true)
        local insensitive_match_a = string.find(string.lower(a.name), lower_prompt, nil, true)
        local insensitive_match_b = string.find(string.lower(b.name), lower_prompt, nil, true)
        
        local word_begin_a = insensitive_match_a == 1 or string.find(string.sub(a.name, insensitive_match_a-1,insensitive_match_a-1), separatorCharacters) ~= nil
        local word_being_b = insensitive_match_b == 1 or string.find(string.sub(b.name, insensitive_match_b-1,insensitive_match_b-1), separatorCharacters) ~= nil
        if word_begin_a ~= word_being_b then
            return word_begin_a
        end
        
        
        if exact_match_a ~= exact_match_b then
            -- the match closest to the beginning of the string should come first
            return exact_match_a ~= nil and (exact_match_b == nil or exact_match_a < exact_match_b)
        elseif exact_match_a ~= nil then
            -- both matches are at the same position and not nil
            -- factorio order
            return a.prototype.order < b.prototype.order
        end
        
        if exact_match_a ~= exact_match_b then
            return exact_match_a <= exact_match_b
        else
            -- both matches are at the same position and not nil
            -- factorio order
            return a.prototype.order < b.prototype.order
        end
    end)]]
    
    search_utils.sort(matching_names, {
        search_utils.sort_orders.hidden_last,
        search_utils.sort_orders.tech_last, 
        search_utils.sort_orders.match_count,
        search_utils.sort_orders.factorio})

    quick_search.result_list = {}
    for _,data in pairs(matching_names) do
        local tmp = format_data(data)
        if tmp ~= nil then
            results_list.add_item(tmp)
            table.insert(quick_search.result_list, data)
        end
    end
end

local function quick_search_gui_action(action, event)
    local action_list = {
        qs_close = 
            function (player)
                local player_table = util.get_player_data(player)
                local quick_search_data = player_table.quick_search
            
                quick_search.toggle(player)
            end,
        qs_update_search = 
            function (player, event)
                quick_search.update_input(player, event.text)
            end,
        qs_try_open_codex = 
            function (player, event)
                local player_table = util.get_player_data(player)
                local quick_search = player_table.quick_search
                if quick_search == nil then
                    return
                end
                
                local selected_index = event.element.selected_index
                
                if quick_search.has_math then
                    if selected_index == 1 then
                        -- put math result into input if it is a valid formula
                        if quick_search.math_result ~= nil then
                             quick_search.refs.search_field.text = "" .. quick_search.math_result
                             quick_search.refs.search_field.focus()
                        end
                       
                        return
                    end
                    selected_index = selected_index - 1
                end
                
                if  quick_search.result_list == nil then
                    return
                end
                
                --log("Quick Search result array: " .. serpent.block(quick_search.result_list))
                
                local selected = quick_search.result_list[selected_index]
                
                if selected == nil or selected.type == "error" then
                    return
                end
                
                event.element.selected_index = 0
                
                --game.print("Index " .. event.element.selected_index .. " with content [" .. selected.type .. "=" .. selected.id .. "] \"" .. selected.name .. "\" was selected!")
                codex.open(player, selected.id, selected.type)
            end,
    }
    
     local player = game.get_player(event.player_index)
     
     local action_func = action_list[action]
     if action_func ~= nil then
        action_func(player, event)
    else
        game.print("Unkown action \"" .. action .. "\" for quick search!")
    end
end

quick_search.build = build_quick_search
quick_search.toggle = toggle_quick_search
quick_search.update_input = quick_search_update_input
quick_search.gui_action = quick_search_gui_action
quick_search.calculate_result = calculateResult

return quick_search
