game = {
    get_filtered_item_prototypes,
	item_group_prototypes = {},
	item_prototypes,
	fluid_prototypes,
	technology_prototypes,
	tile_prototypes,
}

log = print
game.print = function(str) print("  [game chat] " .. str) end

require("tests.mocks.game.item_group")



