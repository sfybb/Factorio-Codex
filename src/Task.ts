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


export type Task = GuiTask | CommandTask
export interface TaskExecutor {
    execute_task(task: Task): void;
}