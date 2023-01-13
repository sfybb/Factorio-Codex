local function filter(table, filter_func)
	local res = {}
	
	for k,v in pairs(table) do
		if filter_func(v, k) then
			res[k] = v
		end
	end
	
	return res
end

local function map(table, map_func)
	local res = {}
	
	for k,v in pairs(table) do
		res[k] = map_func(v)
	end
	
	return res
end


return {
	filter=filter
}
