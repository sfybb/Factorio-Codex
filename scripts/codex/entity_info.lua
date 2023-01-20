local flib_table = require("__flib__.table")

EntityInfo = {}

function EntityInfo:get_info_for_entity(entity)
	if entity == nil then
		return {}
	end

	local type_switch = {
		
	}
	
	local func = type_switch[entity.type]
	if func == nil then
		return {}
	end
	
	local pre_res = func(entity)
	
	-- remove any stats that have a nil value
	return flib_table(pre_res, function(v) return v.value ~= nil end)
end

function EntityInfo:get_footprint(e)
	return {
		{stat="entity-dimensions", e.tile_width.."x"..e.tile_height}
	}
end

function EntityInfo:get_energy_info(e)
	local res = {
		{stat="energy-capacity", value=e.energy_source.buffer_capacity},
		{stat="energy-in", value=e.energy_source.input_flow_limit},
		{stat="energy-out", value=e.energy_source.output_flow_limit},
		{stat="energy-consumption", value=e.energy_source.drain}
	}
	
	if acc.energy_source.usage_priority ~= "tertiary" then
		res:insert({stat="usage-priority", value=acc.energy_source.usage_priority .. " (Note: default is tertiary)"})
	end

	return res
end

function EntityInfo:get_info_beacon(beacon)
	local res = {
		{stat="distrib-efficency", value=beacon.distribution_effectivity},
		{stat="energy-usage", value=beacon.energy_usage},
		{stat="module-slots", value=beacon.distribution_effectivity},
	}

	return res
end

--[[
function EntityInfo:get_info_( )
	local res = {
		{stat="", value=},
	}
	
	if acc.energy_source.drain ~= nil then
		res:insert({stat="", value=})
	end

	return res
end
]]

return EntityInfo