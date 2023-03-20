enum LogLevel {
    TRACE,
    DEBUG,
    INFO,
    WARNING,
    ERROR,
    CRITICAL
}

let runtimeLogLvl: LogLevel = LogLevel.DEBUG

function $log(log_lvl: LogLevel, msg: string) {
    const $compileTimeLogLvl: LogLevel = LogLevel.DEBUG
    if ($compileTimeLogLvl <= log_lvl) {
        if (runtimeLogLvl <= log_lvl) log(msg)
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

function $log_crit(msg: string) {
    game.print("[FACTORIO CODEX] [CRITICAL] "+ msg, {r: 0.5})
    log("[TRACEBACK] " + debug.traceback())
    log("[CRITICAL] " + msg)
}