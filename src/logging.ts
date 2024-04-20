enum LogLevel {
    TRACE,
    DEBUG,
    INFO,
    WARNING,
    ERROR,
    CRITICAL
}

function $compileTimeLogLvl(): LogLevel | undefined {
    //const config = $$readFile!<{node_env?: string, logLevel?: string}>("./config.json", true)
    // @ts-ignore
    const config: { node_env?: string, logLevel?: string } | undefined = null

    if (config != undefined) {
        if (config.logLevel != undefined) {
            switch (config.logLevel.toLowerCase()) {
                case "trace":
                    return LogLevel.TRACE
                case "debug":
                    return LogLevel.DEBUG
                case "info":
                    return LogLevel.INFO
                case "warning":
                    return LogLevel.WARNING
                case "error":
                    return LogLevel.ERROR
                case "critical":
                    return LogLevel.CRITICAL
            }
        }

        if (config.node_env != undefined) {
            switch (config.node_env.toLowerCase()) {
                case "release":
                    return LogLevel.WARNING
                case "debug":
                    return LogLevel.DEBUG
            }
        }
    }

    return undefined
}

function $log(log_lvl: LogLevel, msg: string) {
    //const compileTimeLogLvl: LogLevel = /*$compileTimeLogLvl!() ??*/ LogLevel.INFO
    if (LogLevel.INFO <= log_lvl) {
        log(msg)
    }
}


function $log_trace(msg: string) {
    $log!(LogLevel.TRACE, `[TRACE]    ${msg}`)
}

function $log_debug(msg: string) {
    $log!(LogLevel.DEBUG, `[DEBUG]    ${msg}`)
}

function $log_info(msg: string) {
    $log!(LogLevel.INFO, `[INFO]     ${msg}`)
}

function $log_warn(msg: string) {
    $log!(LogLevel.WARNING, `[WARNING]  ${msg}`)
}

function $log_err(msg: string) {
    $log!(LogLevel.ERROR, `[ERROR]    ${msg}`)
}

function $log_crit(msg: string, addInfo: string) {
    game?.print(`[FACTORIO CODEX] [CRITICAL] [color=orange]${msg}. Details are in the log file. If this persists try running [/color][color=cyan]/fc-rebuild-all[/color]`, {r: 0.5})
    log(`[CRITICAL] ${msg}`)
    log(`[INFO] ${addInfo}`)
    log(`[TRACEBACK] ${debug.traceback()}`)
}

function $log_crit_raw(msg: string) {
    game?.print(`[FACTORIO CODEX] [CRITICAL] [color=orange]${msg}`, {r: 0.5})
    log(`[CRITICAL] ${msg}`)
}

function $get_player_string(pID: FactorioRuntime.PlayerIndex): string {
    let ____temp_player = game?.get_player(pID)
    return ____temp_player == undefined ? `player ID: ${pID}` : `player ${pID} ('${____temp_player.name}')`
}