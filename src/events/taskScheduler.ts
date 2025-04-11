import {getGlobalData, registerDataInitializer} from "../core/dataHandler";
import {OnTickEvent, PlayerIndex} from "factorio:runtime";
import {$safe_call} from "../util/Util";
import {GameEventRegistry} from "./eventRegistry";

export interface TaskBaseData {
    readonly handler_id: string;

    player_index: PlayerIndex;

    [key: string]: any;
}

// Can be used to cancel a task with this ID before it is executed
export interface TaskID {
    readonly index: number;
    readonly tick: number;
}

export type TaskHandler = (this: any, task: TaskBaseData) => void;
export type TaskStorage = LuaMap<number, (TaskBaseData | undefined)[]>;

export namespace TaskScheduler {
    let taskHandlers: LuaMap<string, TaskHandler> = new LuaMap<string, TaskHandler>()

    export function register(handler_id: string, callback: TaskHandler)  {
        taskHandlers.set(handler_id, callback);
    }

    export function Init(this: any): TaskStorage {
        return new LuaMap()
    }

    export function scheduleTask(this: any, task: TaskBaseData, delay: number = 1): TaskID {
        if (delay < 0) {
            $log_warn!(`Task scheduled with negative delay (${delay})! I cant time travel. (Data: ${serpent.line(task)})`)
        }

        let indx = 0;
        let tick = game.tick + delay;
        // If there is a delay schedule task
        if (delay > 0) {
            let taskList = getGlobalData().task_scheduler.get(tick) ?? []
            indx = taskList.length
            taskList.push(task)
            getGlobalData().task_scheduler.set(tick, taskList)
        }
        else {
            executeTask(task);
        }

        return {
            tick: tick,
            index: indx
        }
    }

    export function remove(this: any, id: TaskID): any {
        let list = getGlobalData().task_scheduler.get(id.tick)
        if (list != undefined) list[id.index] = undefined
    }

    export function checkTasks(this: any, event: OnTickEvent) {
        let taskList = getGlobalData().task_scheduler.get(event.tick)

        if (taskList && taskList.length > 0) {
            for (let task of taskList) {
                if (task) executeTask(task);
            }

            getGlobalData().task_scheduler.delete(event.tick)
        }
    }

    function executeTask(task: TaskBaseData) {
        if (!taskHandlers.has(task.handler_id)) {
            $log_warn!(`Task wants unknown handler id "${task.handler_id}"! (Data: ${serpent.line(task)})`)
            return;
        }

        $safe_call!(taskHandlers.get(task.handler_id), undefined, task);
    }
}

registerDataInitializer("task_scheduler", TaskScheduler.Init);

GameEventRegistry.register("on_tick", TaskScheduler.checkTasks);