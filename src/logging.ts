enum LogLevel {
    TRACE,
    DEBUG,
    INFO,
    WARNING,
    ERROR,
    CRITICAL
}

function $log(log_lvl: LogLevel, msg: string) {
    const $compileTimeLogLvl: LogLevel = LogLevel.INFO
    if ($compileTimeLogLvl <= log_lvl) {
        log(msg)
    }
}


function $log_trace(msg: string) {
    $log!(LogLevel.TRACE,    "[TRACE]    "+msg)
}
function $log_debug(msg: string) {
    $log!(LogLevel.DEBUG,    "[DEBUG]    "+msg)
}
function $log_info(msg: string) {
    $log!(LogLevel.INFO,     "[INFO]     "+msg)
}
function $log_warn(msg: string) {
    $log!(LogLevel.WARNING,  "[WARNING]  "+msg)
}
function $log_err(msg: string) {
    $log!(LogLevel.ERROR,    "[ERROR]    "+msg)
}

function $log_crit(msg: string, addInfo: string) {
    game.print("[FACTORIO CODEX] [CRITICAL] [color=orange]" + msg + ". Details are in the log file. If this persists try running [/color][color=cyan]/fc-rebuild-all[/color]", {r: 0.5})
    log("[CRITICAL] " + msg)
    log("[INFO] " + addInfo)
    log("[TRACEBACK] " + debug.traceback())
}

function $log_crit_raw(msg: string) {
    game.print("[FACTORIO CODEX] [CRITICAL] [color=orange]" + msg, {r: 0.5})
    log("[CRITICAL] " + msg)
}

function $get_player_string(pID: PlayerIndex): string {
    let player = game?.get_player(pID)
    return player == undefined ? `player ID: ${pID}` : `player ${pID}('${game.get_player(pID)?.name}')`
}