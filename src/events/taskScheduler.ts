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
interface TickTaskID {
    readonly type: "tick";
    readonly index: number;
    readonly tick: number;
}

interface AlwaysTaskID {
    readonly type: "always";
    readonly handler_id: string;
}

export type TaskID = TickTaskID | AlwaysTaskID;

export type TaskHandler = (this: any, task: TaskBaseData) => void;
export type TaskStorage = LuaMap<number, (TaskBaseData | undefined)[]>;

export namespace TaskScheduler {
    let taskHandlers: LuaMap<string, TaskHandler> = new LuaMap<string, TaskHandler>()
    let reoccurringTask: LuaMap<string, TaskBaseData> = new LuaMap<string, TaskBaseData>();

    export function register(handler_id: string, callback: TaskHandler)  {
        taskHandlers.set(handler_id, callback);
    }

    export function Init(this: any): TaskStorage {
        return new LuaMap();
    }

    export function scheduleAlways(this: any, task: TaskBaseData): TaskID {
        reoccurringTask.set(task.handler_id, task)
        return {
            type: "always",
            handler_id: task.handler_id
        }
    }

    export function scheduleTask(this: any, task: TaskBaseData, delay: number = 1): TaskID {
        if (delay < 0) {
            $log_warn!(`Task scheduled with negative delay (${delay})! I cant time travel. (Data: ${serpent.line(task)})`)
        }

        let indx = 0;
        let tick = game.tick + delay;
        // If there is a delay schedule task
        if (delay > 0) {
            let data = getGlobalData().task_scheduler

            let taskList = data.get(tick) ?? []
            indx = taskList.length
            taskList.push(task)
            data.set(tick, taskList)
        }
        else {
            executeTask(task);
        }

        return {
            type: "tick",
            tick: tick,
            index: indx
        }
    }

    export function remove(this: any, id: TaskID): any {
        let data = getGlobalData().task_scheduler
        switch(id.type) {
            case "tick":
                let list = data.get(id.tick)
                if (list != undefined) list[id.index] = undefined;
                break;
            case "always":
                reoccurringTask.delete(id.handler_id)
                break;
        }
    }

    export function checkTasks(this: any, event: OnTickEvent) {
        let data = getGlobalData().task_scheduler;
        let taskList = data.get(event.tick)

        if (taskList && taskList.length > 0) {
            for (let task of taskList) {
                if (task != undefined) executeTask(task);
            }

            data.delete(event.tick)
        }

        for (let [_, task] of reoccurringTask) {
            if (task != undefined) executeTask(task);
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