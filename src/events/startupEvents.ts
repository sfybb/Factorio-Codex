import {GameEventRegistry} from "./eventRegistry";
import Dictionary from "../core/Dictionary";


function InitializeMod() {
    Dictionary.Init()
}

GameEventRegistry.register("on_init", InitializeMod)