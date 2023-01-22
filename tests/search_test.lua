require("tests.mocks.flib")

local search = require("scripts.search")

TestSearch = {}

	function TestSearch:test_sort_reverse()
		local list_to_sort = {}
		local expected_list = {}
		for i = 42, 1, -1 do
			table.insert(list_to_sort, i)
			table.insert(expected_list, i)
		end
		
		search.sort(list_to_sort, {function(a,b) return a == b and nil or a < b end})
		table.sort(expected_list)
		
		lu.assertEquals(list_to_sort, expected_list)
	end
	
	function TestSearch:test_sort_sorted()
		local list_to_sort = {}
		local expected_list = {}
		for i = 1, 42 do
			table.insert(list_to_sort, i)
			table.insert(expected_list, i)
		end
		
		search.sort(list_to_sort, {function(a,b) return a == b and nil or a < b end})
		
		lu.assertEquals(list_to_sort, expected_list)
	end
	
	function TestSearch:test_sort()
		local list_to_sort = {
			28, 33, 4, 19,
			24, 22, 2, 1,
			15, 8, 35, 20,
			9, 12, 31, 26,
			23, 13, 27, 18,
			11, 10, 21, 36,
			32, 34, 17, 5,
			7, 6, 14, 25,
			29, 30, 3, 16,
		}
		local expected_list = {}
		for i = 1, 36 do
			table.insert(expected_list, i)
		end
		
		search.sort(list_to_sort, {function(a,b) return a == b and nil or a < b end})
		
		lu.assertEquals(list_to_sort, expected_list)
	end
	
	function TestSearch:test_sort_multi()
		local list_to_sort = {
			{a=8,b=3},
			{a=2,b=2},
			{a=5,b=1},
			{a=9,b=2},
			{a=6,b=1},
			{a=7,b=1},
			{a=3,b=3},
			{a=1,b=2},
			{a=4,b=3},
		}
		local expected_list = {}
		for k,v in pairs(list_to_sort) do
			expected_list[k] = v
		end
		
		search.sort(list_to_sort, {
			function(a,b) if a.b == b.b then return nil end return a.b < b.b end,
			function(a,b) if a.a == b.a then return nil end return a.a < b.a end})
		
		table.sort(expected_list, function(a, b) 
			return (a.b == b.b and a.a < b.a) or
			(a.b ~= b.b and a.b < b.b) end)
		
		lu.assertEquals(list_to_sort, expected_list)
	end