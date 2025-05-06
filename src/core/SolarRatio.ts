import {QSModule, QSResult, QSResultBase} from "./QuickSearch";
import {LuaSurface, PlayerIndex} from "factorio:runtime";

export interface QSSolarResult extends QSResultBase {
    readonly type: "solar-ratio";

    value: string;
}

export class SolarRatio implements QSModule {
    readonly id = "solar-ratio";
    readonly order = "b"
    readonly async = false;

    readonly magic_words = ["solar", "ratio"];

    apply_prompt(prompt: string, player: PlayerIndex): QSResult[] {
        prompt = prompt.toLowerCase()
        let tokens = prompt.split(" ")

        let matches = this.magic_words.filter(word => {
            for (let t of tokens) {
                if (t.length >= 3 && word.includes(t)) return true
            }
            return false
        })

        let surface: LuaSurface | undefined = game.get_player(player)?.surface;

        if (surface == undefined || matches.length === 0) return []

        if (surface.always_day) return []


        const day_length = surface.ticks_per_day
        const power_multiplier = surface.solar_power_multiplier // TODO compute correct multiplier
        const day = (1 - surface.dawn + surface.dusk) * day_length
        const dusk = (surface.evening - surface.dusk) * day_length
        const night = (surface.morning - surface.evening) * day_length
        const dawn = (surface.dawn - surface.morning) * day_length

        // Total power produced: (day_length) ∫ power_output = (day_length - night) ∫ power_output =
        // (day) ∫ power_output + (dusk) ∫ power_output + (dawn) ∫ power_output
        const power_produced = power_multiplier * day + ( power_multiplier * (dusk + dawn)) / 2;

        // power_produced / day_length
        const effective_power = power_produced / day_length

        // The amount of ticks where a surplus of energy is generated during dusk / dawn
        const dusk_surplus = effective_power / (power_produced * dusk)
        const dawn_surplus = effective_power / (power_produced * dawn)

        const max_surplus = power_multiplier - effective_power

        const stored_power = max_surplus * day + (max_surplus * (dusk_surplus + dawn_surplus)) / 2

        $log_trace!(`Day length: ${day_length} (day ${day}; dusk ${dusk}; night ${night}; dawn ${dawn})`)
        $log_trace!(`Production ${power_produced}; eff. ${effective_power}`);
        $log_trace!(`Surplus: Day ${max_surplus * day}; Dusk ${dusk_surplus}; Dawn ${dawn_surplus}`);
        $log_trace!(`⟹ ${stored_power} storage necessary`);

        return [
            {
                type: 'solar-ratio',
                text: `Power per Day: ${power_produced}%; eff. ${effective_power}`
            },
            {
                type: 'solar-ratio',
                value: `${stored_power} MJ`,
                text: `1 MW : ${stored_power} MJ on ${surface.name}`
            } as QSSolarResult,
            {
                type: 'solar-ratio',
                value: `${effective_power} MW`,
                text: `1 MW ⟹ Effective generation ${effective_power} MW on ${surface.name}`
            } as QSSolarResult
        ]
    }

    on_selected(item: QSResult, player: PlayerIndex): string | undefined {
        if (item.type != "solar-ratio") return undefined

        return (item as QSSolarResult).value
    }
}