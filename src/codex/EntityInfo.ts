import {LocalisedString, LuaEntityPrototype, LuaItemPrototype, LuaTechnologyPrototype} from "factorio:runtime";

type EntityInfo = {
    id: string,
    localised_string: LocalisedString,
    value: string
}



namespace EntityInfo {
    export function getInfo(e: LuaEntityPrototype | LuaTechnologyPrototype | LuaItemPrototype) {

    }

    function getItemInfo(item: LuaItemPrototype, infoArray: EntityInfo[]) {
        switch (item.type) {
            case 'ammo':

                break
        }
    }
}

export default EntityInfo