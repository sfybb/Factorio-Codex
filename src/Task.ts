export type Task = {
    gui: string,
    player_index: PlayerIndex,

    [key: string]: any
}
export interface TaskExecutor {
    execute_task(task: Task): void;
}