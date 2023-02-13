local flib_dictionary = require("__flib__.dictionary")
flib_dictionary.set_use_local_storage(true)

local Dict = {}

-- unused
local dicts_table = {
	names={},
	descs={},
	build_done = false
}

function Dict:Init()
	flib_dictionary.init()

	Dict:build()
end

function Dict:load()
	flib_dictionary.load()
	--Dict:build()
end

function Dict:translate(player_index)
	local player = game.get_player(player_index)

    -- Only translate if they're connected - if they're not, then it will not work!
    if player.connected then
        flib_dictionary.translate(player)
		--player.print({"", "Kicking off translation for you (lang: ", {"locale-identifier"}, ")" })
    end
end

function Dict:cancel_translate(player_index)
	flib_dictionary.cancel_translation(player_index)
end

function Dict:check_skipped()
	flib_dictionary.check_skipped()
end

function Dict:build()
	if global.cache == nil or dicts_table.build_done then
		return
	end

	-- not needed yet?
	-- local prototypes = global.cache.global.prototype_cache.protos
	local prototypes = global.cache:get_cache("prototype_cache"):get_all()

	for type, list in pairs(prototypes) do
		local names = flib_dictionary.new(type.."_names", true)
		local desc  = flib_dictionary.new(type.."_descriptions")

		for name, proto in pairs(list) do
			if proto.valid then
				names:add(name, proto.localised_name)
				desc:add(name, proto.localised_description)
			end
		end
		dicts_table.names[type] = names
		dicts_table.descs[type] = desc
	end

	dicts_table.build_done = true
end

function Dict:rebuild()
	log("Rebuilding dictionaries...")
	dicts_table.build_done = false
	Dict:Init()

	local players_to_translate = {}
	for _, player in pairs(game.players) do
		if player.connected then
			Dict:translate(player.index)
			table.insert(players_to_translate, player)
		end
	end

	local spacer = ""
	local text = "Kicking off translation for "
	for _, p in ipairs(players_to_translate) do
		text = text .. spacer .. p.name
		spacer = ", "
		p.print({"", "Kicking off translation for you (lang: ", {"locale-identifier"}, ")" })
	end

	log(text)
end

function Dict:string_translated(e)
    local language_data = flib_dictionary.process_translation(e)

    if language_data then
        for _, player_index in pairs(language_data.players) do
            local dict_cache = global.cache:get_player_cache(player_index, "dicts_cache")
            --log(serpent.block(language_data.dictionaries, {maxnum=20}))
			local was_translated = dict_cache:is_translated()
            dict_cache:load_language_data(language_data)

			if was_translated == false then
				game.get_player(player_index).print("Factorio Codex: Quick search is now ready to be used!")
			end

			PlayerData:get_quick_search(player_index):update_input()
        end
        return language_data.players
    end
    return nil
end

return Dict