interface BaseTask {
    readonly type: string,

    player_index: PlayerIndex,

    args?: LuaTable<string, any>
}

interface GuiTask extends BaseTask {
    type: "gui"
    gui: string
}

interface CommandTask extends BaseTask {
    type: "command"
    command: string
}

interface DictionaryTask extends BaseTask {
    type: "dictionary"
    dictionary_name: string,
    dictionary_data: LuaTable<string, string>,
    start_index: number,
    notify_on_complete: boolean
}


export type Task = GuiTask | CommandTask | DictionaryTask
export interface TaskExecutor {
    execute_task(task: Task): void;
}