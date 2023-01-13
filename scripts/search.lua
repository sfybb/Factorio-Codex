local flib_table = require("__flib__.table")

local serpent = require("scripts.serpent")

local search = {}
local int_sort_help = {}


local function is_entity_hidden(type_name, proto)
    local hidden_switch = {
        technology = function(p) return p.hidden end,
        item = function(p) return p.has_flag("hidden") end,
        fluid = function(p) return p.hidden end,
        tile = function() return false end,
    }
    
    local func = hidden_switch[type_name]
    
    if proto == nil or func == nil then
        return true
    end
    
    return func(proto)
end

local sort_order_functions = {
    factorio = function (a,b)
        local a_order = a.prototype ~= nil and a.prototype.order or nil
        local b_order = b.prototype ~= nil and b.prototype.order or nil
        
        if a_order == nil or b_order == nil then
            return (a_order == b_order) and nil or a_order ~= nil
        end
        
        return a_order < b_order
    end,
    match_count = function (a,b) return (a.match_count == b.match_count) and nil or (a.match_count > b.match_count) end,
    tech_last = function (a,b) return (a.type == b.type) and nil or (a.type ~= "technology") end,
    hidden_last = function (a,b)
        local a_hidden = is_entity_hidden(a.type, a.prototype)
        local b_hidden = is_entity_hidden(a.type, a.prototype)
        return (a_hidden == b_hidden) and nil or (not a_hidden)
    end,
}


function split(inputstr, sep)
        if sep == nil then
                sep = "%s"
        end
        local t={}
        for str in string.gmatch(inputstr, "([^"..sep.."]+)") do
                table.insert(t, str)
        end
        return t
end

-- sorts an array with multiple orders
-- order_func_list contains these orders from most significant (1) to least significant (end)
-- source adapted from https://en.wikipedia.org/wiki/Merge_sort#Bottom-up_implementation
-- the order functions take two arguments a and b and returns one of the following:
--      true if a should come before b
--      false if b should come before a
--      nil if there is no difference
local function sort_array(A, order_func_list)
    if A == nil then
        return
    end
    
    if order_func_list == nil or 
        (type(order_func_list) ~= "function" and
         type(order_func_list) ~= "table") then
        return
    end
    
    if type(order_func_list) == "function" then
        local tmp = {}
        table.insert(tmp, order_func_list)
        order_func_list = tmp
    end
    
    local n = #A
    local B = {}
    
    -- Each 1-element run in A is already "sorted".
    -- Make successively longer sorted runs of length 2, 4, 8, 16... until the whole array is sorted.
    local width = 1
    while width <= n do
        -- Array A is full of runs of length width.
        for i = 1, n, 2 * width do
            --Merge two runs: A[i:i+width-1] and A[i+width:i+2*width-1] to B[]
            -- or copy A[i:n-1] to B[] ( if (i+width >= n) )
            int_sort_help.bottom_up_merge(A, i, math.min(i+width, n), math.min(i+2*width, n), B, order_func_list)
        end
        
        -- Now work array B is full of runs of length 2*width.
        -- Copy array B to array A for the next iteration.
        -- A more efficient implementation would swap the roles of A and B.
        int_sort_help.copy_array(B, A, n)
        -- Now array A is full of runs of length 2*width.
        
        width = 2 * width
    end
end

--  Left run is A[iLeft :iRight-1].
-- Right run is A[iRight:iEnd-1  ].
local function bottom_up_merge(A, iLeft, iRight, iEnd, B, order_func_list)
    local i = iLeft
    local j = iRight
    -- While there are elements in the left or right runs...
    for k = iLeft, iEnd do
        -- If left run head exists and is <= existing right run head.
        if i < iRight and (j >= iEnd or int_sort_help.compare_multi_order(A[i], A[j], order_func_list)) then
            B[k] = A[i]
            i = i + 1
        else
            B[k] = A[j]
            j = j + 1
        end
    end 
end

local function compare_multi_order(a, b, order_func_list)
    local order = nil
    for _,func in pairs(order_func_list) do
        order = func(a,b)
        if order ~= nil then
            break
        end
    end
    
    if type(order) ~= "boolean" then
        -- if neither a or b should come first preserve the original order
        order = true
    end
    
    return order
end

local function copy_array(B, A, n)
    for i = 1, n do
        A[i] = B[i]
    end
end


local function quote_str(str)
    local quotepattern = '(['..("%^$().[]*+-?"):gsub("(.)", "%%%1")..'])'
    return string.gsub(str, quotepattern, "%%%1")
end

local function find_in_dicts(prompt, dicts)
    prompt = string.lower(prompt)
    tokens = split(prompt)
    quoted_tokens = flib_table.map(tokens, quote_str)
    
    local result = {}
    
    for type_name,dict in pairs(dicts) do
        if dict ~= nil then
            local tmp = flib_table.filter(dict,
                function (str)
                    local lower_str = string.lower(str)
                    for _,t in pairs(tokens) do
                        if not string.find(lower_str, t, nil, true) then
                            return false
                        end
                    end
                    return true
                end)

            local prototype_field_name = type_name .. "_prototypes"
            
            for id,name in pairs(tmp) do
                local match_count = 0
                for _,qt in pairs(quoted_tokens) do
                    local _,count = string.gsub(name, qt, "")
					local _,start_of_word_count = string.gsub(name, "%s+"..qt, "")
					local _,start_of_name_count = string.gsub(name, "^"..qt, "")
                    match_count = match_count + count + start_of_word_count + start_of_name_count
                end
            
                table.insert(result, {
                    prototype = game[prototype_field_name][id],
                    type = type_name,
                    id = id,
                    name = name,
                    match_count = match_count
                })
            end
        end
    end
    
    return result
end






int_sort_help.copy_array = copy_array
int_sort_help.bottom_up_merge = bottom_up_merge
int_sort_help.compare_multi_order = compare_multi_order





search.sort_orders = sort_order_functions
search.sort = sort_array
search.find = find_in_dicts
return search
