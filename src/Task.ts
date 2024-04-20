import {PlayerIndex} from "factorio:runtime";

interface BaseTask {
    readonly type: string,

    player_index: PlayerIndex,

    args?: LuaTable<string, any>
}

export interface GuiTask extends BaseTask {
    type: "gui"
    gui: string
}

export interface CommandTask extends BaseTask {
    type: "command"
    command: string
}

export interface DictionaryTask extends BaseTask {
    type: "dictionary"
    language: string,
    dictionaries: {
        name: string,
        num_entries: number,
        data: LuaTable<string, string>
    }[],
    start_index: number,
    num_indexed_entries: number,
    num_all_entries: number
}


export type Task = GuiTask | CommandTask | DictionaryTask
export interface TaskExecutor {
    execute_task(task: Task): void;
}