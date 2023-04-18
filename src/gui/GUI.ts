import "gui/UIBuildStructure"

namespace GUI {
    let uielements: {
        vanilla: {
            "choose-elem-button": true,
            "drop-down": true,
            "empty-widget": true,
            "entity-preview": true,
            "list-box": true,
            "scroll-pane": true,
            "sprite-button": true,
            "tabbed-pane": true,
            "text-box": true,
            "button": true,
            "camera": true,
            "checkbox": true,
            "flow": true,
            "frame": true,
            "label": true,
            "line": true,
            "minimap": true,
            "progressbar": true,
            "radiobutton": true,
            "slider": true,
            "sprite": true,
            "switch": true,
            "tab": true,
            "table": true,
            "textfield": true
        },
        others: { [keys: string]: UIElement }
    }

    export function registerElements(elems: UIElement[]): void {
        for( let elem of elems ) {
            let type_id = elem.elementInfo.type_id
            if ( type_id in uielements.vanilla ) {
                $log_warn!(`LuaGuiElement with id "${type_id}" already exists! It cannot be overwritten!`)
                continue
            }
            if ( uielements.others[type_id] != undefined ) {
                $log_warn!(`Ui Element with id "${type_id}" already exists!`)
                continue
            }

            uielements.others[type_id] = elem
        }
    }

    function addGuiElement(parent: LuaGuiElement, structure: UIBuildStructure, slots: UISlots) {
        
    }

    export function build(parent: LuaGuiElement, structure: UIBuildStructure): UIRefs {
        // @ts-ignore
        addGuiElement()
        return {}
    }

    export function add(parent: LuaGuiElement, structure: UIBuildStructure) {

    }
}