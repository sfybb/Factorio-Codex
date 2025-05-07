import {GameEventRegistry} from "./eventRegistry";
import {getGlobalData} from "../core/dataHandler";


function InitializeMod() {
    getGlobalData();
}

GameEventRegistry.register("on_init", InitializeMod)