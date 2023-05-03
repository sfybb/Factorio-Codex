import CodexCommonUI from "./CodexCommonUI";
import RecipeUI from "./RecipeUI";

/** @noResolution */
import * as FLIB_gui from "__flib__.gui";

type Modifier = {
    sprite: SpritePath,
    description: LocalisedString,
    effect: LocalisedString
}

namespace TechnologyInfo {
    export function build_gui(parent: undefined | LuaGuiElement, tech: LuaTechnologyPrototype) {
        if (parent == undefined) return

        let modifiers: Modifier[] = []
        let new_recipes: string[] = []

        for (let effect of tech.effects) {
            //$log_info!(`Effect: ${effect.type}`)
            // [ "modifier-description.${effect.type}" ]
            let mod: Modifier | undefined
            switch (effect.type) {
                case "unlock-recipe":
                    new_recipes.push(effect.recipe)
                    break
                case "nothing":
                    mod = {
                        effect: [""],
                        description: effect.effect_description,
                        sprite: "utility/nothing_modifier_icon"
                    }
                    break
                case "turret-attack":
                    mod = {
                        effect: [""],
                        description: [ `modifier-description.${effect.turret_id}-shooting-speed-bonus`, effect.modifier],
                        sprite: "utility/default_turret_attack_modifier_icon"
                    }
                    break
                case "give-item":
                    let count = effect.count ?? 1
                    let item_proto = game.item_prototypes[effect.item]
                    mod = {
                        effect: [""],
                        description: [ "factorio-codex.tech-give-item", count, item_proto.name, item_proto.localised_name ],
                        sprite: "utility/give_item_modifier_icon"
                    }
                    break
                case "ammo-damage":
                    mod = {
                        effect: [""],
                        description: [ `modifier-description.${effect.ammo_category}-damage-bonus`, effect.modifier ],
                        sprite: "utility/default_ammo_damage_modifier_icon"
                    }
                    break
                case "gun-speed":
                    mod = {
                        effect: [""],
                        description: [ `modifier-description.${effect.ammo_category}-shooting-speed-bonus`, effect.modifier ],
                        sprite: "utility/default_gun_speed_modifier_icon"
                    }
                    break
                default:
                    // No additional values
                    mod = {
                        effect: [""],
                        description: [ `modifier-description.${effect.type}`, effect.modifier ],
                        sprite: `utility/${effect.type.replaceAll("-", "_")}_modifier_icon`
                    }
            }
            if (mod != undefined) modifiers.push(mod)
        }

        let tech_gui = []

        if (new_recipes.length > 0) {
            let tmp = build_new_recipe_list(new_recipes)
            tech_gui.push(CodexCommonUI.get_collapsable_list(["factorio-codex.unlocked-recipes"], tmp))
        }

        if (modifiers.length > 0) {
            let tmp = build_modifier_list(modifiers)
            tech_gui.push(CodexCommonUI.get_collapsable_list(["factorio-codex.tech-modifiers"], tmp))
        }

        if (tech_gui.length > 0) {
            FLIB_gui.build(parent, tech_gui)
        }
    }

    function build_new_recipe_list(new_recipes: string[]): FLIBGuiBuildStructure[] {
        let res: FLIBGuiBuildStructure[] = []

        const game_recipes = game.recipe_prototypes

        for (let recipe_id of new_recipes) {
            let tmp = game_recipes[recipe_id]
            if (tmp != undefined) {
                res.push(RecipeUI.getUI(tmp, false))
            }
        }

        return res
    }

    function build_modifier_list(modifiers: Modifier[]): FLIBGuiBuildStructure[] {
        let res: FLIBGuiBuildStructure[] = []

        for (let mod of modifiers) {
            res.push({
                type: "flow",
                direction: "horizontal",
                1: {
                    type: "sprite-button",
                    style: "flib_standalone_slot_button_default",
                    enabled: false,
                    sprite: mod.sprite,
                },
                2: {
                    type: "label",
                    caption: mod.description
                }
            })
        }

        return res
    }
}

export default TechnologyInfo