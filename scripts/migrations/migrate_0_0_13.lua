local on_tick_n = require("__flib__.on-tick-n")


return function(additional_actions)
	on_tick_n.init()

	if global.players ~= nil then
		for indx, plyr in pairs(global.players) do
			plyrdicts = nil
		end
	end
end