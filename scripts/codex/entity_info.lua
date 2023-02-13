local flib_table = require("__flib__.table")

local EntityInfo = {}

function EntityInfo:get_info_for_entity(entity)
	if entity == nil then
		return {}
	end

	local effective_entity = entity.place_result or entity.place_as_equipment_result or entity.place_as_tile_result or entity

	local type_switch = {
		["assembling-machine"] = EntityInfo.assembling_machine
	}

	--log("Entity Info for: \""..effective_entity.type.."\"")
	local func = type_switch[effective_entity.type]
	if func == nil then
		return {}
	end

	local pre_res = func(effective_entity)

	-- remove any stats that have a nil value
	return flib_table.filter(pre_res, function(v) return v[1] ~= nil and v.stat ~= nil end)
end

function EntityInfo:assembling_machine(e)
	local entity = e or self
	if entity == nil then
		return {}
	end

	return EntityInfo:get_machine_info(entity)
end

function EntityInfo:get_machine_info(e)
	local res = {
		{stat="entity-dimensions", e.tile_width.."x"..e.tile_height},
		{stat="module-amount", e.module_inventory_size},
		{stat="crafting-speed", e.crafting_speed},
		{stat="base-productivity", e.base_productivity},
	}

	return res
end

function EntityInfo:get_health_info(e)
	local res = {
		{stat="max-health", e.max_health}
	}

	return res
end

function EntityInfo:get_electric_energy_info(e)
	local ee_source = e.electric_energy_source_prototype
	if ee_source == nil then
		return {}
	end

	local res = {
		{stat="energy-capacity", value=ee_source.buffer_capacity},
		{stat="energy-in", value=ee_source.input_flow_limit},
		{stat="energy-out", value=ee_source.output_flow_limit},
		{stat="energy-consumption", value=ee_source.drain}
	}

	if acc.energy_source.usage_priority ~= "tertiary" then
		table.insert(res, {stat="usage-priority", value=ee_source.usage_priority .. " (Note: default is tertiary)"})
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