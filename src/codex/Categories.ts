import {
    FlowGuiElement,
    ListBoxGuiElement, LocalisedString,
    LuaEntityPrototype, LuaGuiElement,
    LuaItemPrototype,
    LuaTechnologyPrototype,
    uint
} from "factorio:runtime";
import {Category_type, getPrototypeCache} from "cache/PrototypeCache";
import {default as SearchUtils, SortOrderDefault} from "SearchUtils";
import {Verifiable, Verifyinfo} from "Validate";

/** @noResolution */
import * as FLIB_gui from "__flib__.gui";
import MigratablePrototype from "PrototypeHelper";

type anyPrototype = LuaEntityPrototype | LuaTechnologyPrototype | LuaItemPrototype
const gui_name = "codex"

class Categories implements Verifiable {

    selected_index: uint;
    selected_cat: undefined | Category_type;
    rebuild_gui: boolean

    refs: {
        cat_gui?: FlowGuiElement,
        category_picker?: ListBoxGuiElement,
        available_entities: LuaTable<string, ListBoxGuiElement>
    }

    entity_lists: LuaTable<string, MigratablePrototype<anyPrototype>[]>

    constructor() {
        this.selected_index = -1
        this.selected_cat = undefined
        this.rebuild_gui = false

        this.refs = {
            available_entities: new LuaTable()
        }
        this.entity_lists = new LuaTable()
    }

    static load(this: void, c: Categories): void {
        // @ts-ignore
        setmetatable(c, Categories.prototype)
    }

    destroy(): void {
        this.refs?.cat_gui?.destroy()

        this.refs = {
            available_entities: new LuaTable()
        }
        this.entity_lists = new LuaTable()
    }

    set_rebuild_gui() {
        this.rebuild_gui = true
    }

    build_gui(parent: LuaGuiElement) {
        if (this.rebuild_gui) {
            this.destroy()
        }

        if (this.refs?.cat_gui?.valid != true) {
            this.rebuild_gui = false

            this.refs = {
                ...FLIB_gui.build(parent, [{
                    type: "flow", direction: "horizontal", ref: ["cat_gui"],
                    1: {
                        type: "list-box", ref: ["category_picker"], style: "fcodex_codex_type_section",
                        actions: {
                            on_selection_state_changed: { gui: gui_name, action: "change_category" }
                        }
                    }
                }]),
                available_entities: new LuaTable()
            }
        }

        if (this.refs.category_picker != undefined) {
            let cat_picker = this.refs.category_picker
            cat_picker.clear_items()

            let categoriesList = getPrototypeCache()?.getCategories()
            if (categoriesList != undefined) {
                for (let cat of categoriesList) {
                    cat_picker.add_item(cat.localised_name)
                }
            }
        }

        if (this.selected_index >= 0) {
            this.select_by_index(0)
        } else {
            this.update_gui()
        }
    }

    update_gui(catOld?: Category_type) {
        if (this.selected_index < 0 || this.selected_cat == undefined || this.refs.cat_gui == undefined) {
            return
        }

        let cat_name = this.selected_cat.name
        let entities = this.entity_lists.get(cat_name)

        if (entities == undefined) {
            entities = this.get_unfiltered_entities()
            $log_info!(`Gathered entity list for '${cat_name}': Size: ${entities.length}`)
            this.entity_lists.set(cat_name, entities)
        }

        if (catOld?.name != undefined) {
            let oldCatUI = this.refs.available_entities.get(catOld.name)
            if (oldCatUI != undefined) {
                oldCatUI.visible = false
                oldCatUI.selected_index = 0
            }
        }

        let entitiesUI = this.refs.available_entities.get(cat_name)
        if (entitiesUI == undefined) {
            entitiesUI = FLIB_gui.build(this.refs.cat_gui, [{
                type: "list-box",
                style: "fcodex_codex_entity_list",
                ref: ["entities"],
                actions: {
                    on_selection_state_changed: { gui: gui_name, action: "view_entity" }
                }
            }]).entities as ListBoxGuiElement

            this.refs.available_entities.set(cat_name, entitiesUI)

            for (let e of entities) {
                if (!e.valid) continue

                let text:LocalisedString = ["", `[${cat_name}=${e.name}]`, e.localised_name]

                if (SearchUtils.isPrototypeHidden(e)) {
                    text = ["", "[color=gray]", text, " [hidden][/color]"]
                }

                entitiesUI.add_item(text)
            }
        }

        entitiesUI.visible = true
    }

    get_unfiltered_entities(): anyPrototype[] {
        if (this.selected_index < 0 || this.selected_cat == undefined) {
            return []
        }

        let res: anyPrototype[] = []
        let res_table:LuaTable<string, anyPrototype> = new LuaTable()

        let is_group = this.selected_cat.parent != undefined
        let cat_type = this.selected_cat.parent == undefined ? this.selected_cat.name : this.selected_cat.parent.name

        if (!is_group) {
            let protoCache = getPrototypeCache()

            let allProtos = protoCache?.getAll()
            if (allProtos == undefined) return []
            // @ts-ignore
            res_table = allProtos[cat_type]

            if (res_table == undefined) return []
        } else {
            $log_crit!(`Invalid entity category: '${this.selected_cat.name}'`, `Cannot retrieve Entity list for a subgroup '${cat_type}.${this.selected_cat.name}' (yet)!`)
        }

        for (let [, v] of res_table) {
            if (!v.valid) continue
            res.push(v)
        }

        SearchUtils.sort(res, [
            SortOrderDefault.hidden_last,
            SortOrderDefault.factorio
        ])

        return res
    }

    select_by_name(name: string): void {
        let categoriesList = getPrototypeCache()?.getCategories()
        let catIndx = categoriesList?.findIndex((c) => c.name  == name)
        catIndx = catIndx ?? -1

        this.select_by_index(catIndx)
    }

    select_by_index(index: uint): void {
        let categoriesList = getPrototypeCache()?.getCategories()
        categoriesList = categoriesList ?? []

        let cat = index >= 0 ? categoriesList[index] : undefined;

        if ( cat?.name == undefined) {
            return
        }
        if (cat.name == this.selected_cat?.name && this.refs.available_entities.get(cat.name)?.valid == true) return;

        if (this.refs.category_picker?.valid) this.refs.category_picker.selected_index = index+1

        let oldCat = this.selected_cat
        this.selected_cat = cat
        this.selected_index = index
        this.update_gui(oldCat)
    }

    scroll_to(entityId: string) {
        let cat_name = this.selected_cat?.name ?? ""
        let entities = this.entity_lists.get(cat_name)
        let entitiesUI = this.refs.available_entities.get(cat_name)

        if (cat_name == "" || entities == undefined || entitiesUI == undefined) {
            $log_warn!(`Can't scroll to entity id '${entityId}': Empty list or gui non existent! Is mod data corrupted?`)
            return
        }

        for (let [i, entity] of entities.entries()) {
            if (entity?.valid && entity.name == entityId) {
                entitiesUI.scroll_to_item(i, "in-view")
                entitiesUI.selected_index = i+1
                return;
            }
        }

        $log_info!(`Could not find entity with id '${entityId}'!`)
        if (entitiesUI.items.length > 0) {
            entitiesUI.scroll_to_item(1)
        }
        entitiesUI.selected_index = 0
    }

    get_selected_entity_info(e: GuiEventData): {id:string, type: string} {
        let cat_name = this.selected_cat?.name
        if (cat_name == undefined) {
            return {id: "", type: ""}
        }

        let entities = this.entity_lists.get(cat_name)
        let entitiesUI = this.refs.available_entities.get(cat_name)

        if (entities == undefined || entitiesUI != e.element || entitiesUI == undefined) {
            return {id: "", type: ""}
        }

        let entity = entities[entitiesUI.selected_index-1]
        if (!entity.valid) return {id: "", type: ""}

        return {
            type: cat_name,
            id: entity.name
        }
    }


    get_verify_info(args?: any): Verifyinfo[] {
        return [
            {field: "selected_index", type: "number"},
            {field: "selected_cat", type: "object", optional: true, content: [
                    {field: "name", type: "string"},
                    {field: "localised_name", type: "array"},
                    {field: "parent", type: "object", optional: true}
            ]},
            {field: "rebuild_gui", type: "boolean"},
            {field: "refs", type: "object", content: [
                    {field: "cat_gui", type: "object", optional: true},
                    {field: "category_picker", type: "object", optional: true},
                    {field: "available_entities", type: "object", optional: true},
            ]},
            {field: "entity_lists", type: "object", content: [
                    {field: "item", type: "array", optional: true},
                    {field: "fluid", type: "array", optional: true},
                    {field: "technology", type: "array", optional: true},
                    {field: "tile", type: "array", optional: true},
            ]}
        ]
    }
}

export default Categories