local DictsCache = { global=false, id="dicts_cache", name="Dictionary Cache" }


function DictsCache:Init(cache_list)
    cache_list[DictsCache.id] = DictsCache
end

function DictsCache:load()
    setmetatable(self, {__index = DictsCache})
    return self
end

function DictsCache:build(player_index)
    self.names_dicts = {}
    self.desc_dists  = {}
    self.translated = false
	self.player_index = player_index

    return self
end


function DictsCache:get_names_dict(type)
    return self.names_dicts[type] or {}
end

function DictsCache:get_desc_dict(type)
    return self.desc_dists[type] or {}
end

function DictsCache:is_translated()
    return self.translated
end

function DictsCache:load_language_data(language_data)
	log("Loading language data for player "..self.player_index)
    self.translated = true
	
	local names_ending = "_names"
	local desc_ending = "_descriptions"
	
	for name, dict in pairs(language_data.dictionaries) do
		if string.endswith(name, names_ending) then
			self.names_dicts[string.sub(name,1, (#name)-(#names_ending))] = dict
		elseif string.endswith(name, desc_ending) then
			self.desc_dists[string.sub(name,1, (#name)-(#desc_ending))] = dict
		end
	end
end

return DictsCache