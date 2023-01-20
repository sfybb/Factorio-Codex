local serpent = require("scripts.serpent")

local sort = {}
local sort_help = {}

local function is_entity_hidden(proto)
    local hidden_switch = {
        LuaTechnologyPrototype = function(p) return p.hidden end,
        LuaItemPrototype = function(p) return p.has_flag("hidden") end,
        LuaFluidPrototype = function(p) return p.hidden end,
        LuaTilePrototype = function() return false end,
    }
    if proto == nil then
        return true
    end
    
    local func = hidden_switch[proto.object_name]
    
    if  func == nil then
        return true
    end
    
    return func(proto)
end

local sort_order_functions_codex = {
    factorio = function (a,b)
        if a.order == nil or b.order == nil then
			if a.order == b.order then
				return nil
			end
            return a.order ~= nil
        end
        return a.order < b.order
    end,
    tech_last = function (a,b) return (a.type == b.type) and nil or (a.type ~= "technology") end,
    hidden_last = function (a,b)
        local a_hidden = is_entity_hidden(a)
        local b_hidden = is_entity_hidden(b)
		if a_hidden == b_hidden then
			return nil
		end
        return not a_hidden
    end,
}

local sort_order_functions = {
    factorio = function (a,b)
        return sort_order_functions_codex.factorio(a.prototype, b.prototype)
    end,
    match_count = function (a,b) return (a.match_count == b.match_count) and nil or (a.match_count > b.match_count) end,
    tech_last = sort_order_functions_codex.tech_last,
    hidden_last = function (a,b)
        return sort_order_functions_codex.hidden_last(a.prototype, b.prototype)
    end,
}

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
        for i = 0, n, 2 * width do
            --Merge two runs: A[i:i+width-1] and A[i+width:i+2*width-1] to B[]
            -- or copy A[i:n-1] to B[] ( if (i+width >= n) )
            sort_help.bottom_up_merge(A, i, math.min(i+width, n), math.min(i+2*width, n), B, order_func_list)
        end
        
        -- Now work array B is full of runs of length 2*width.
        -- Copy array B to array A for the next iteration.
        -- A more efficient implementation would swap the roles of A and B.
        sort_help.copy_array(B, A, n)
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
		
        if i < iRight and (j >= iEnd or sort_help.compare_multi_order(A[i+1], A[j+1], order_func_list)) then
            B[k+1] = A[i+1]
            i = i + 1
        else
            B[k+1] = A[j+1]
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

sort_help.copy_array = copy_array
sort_help.compare_multi_order = compare_multi_order
sort_help.bottom_up_merge = bottom_up_merge

sort.order = sort_order_functions_codex
sort.order_quick_search = sort_order_functions
sort.array = sort_array

return sort
