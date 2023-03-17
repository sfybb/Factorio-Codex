// @ts-nocheck
import { vsprintf } from "sprintf-js"
global.$multi = (...args) => args

function luaPatternToRegex(luaPattern: string): string {
    const characterClasses = {
        '%a': '[a-zA-Z]',
        '%c': '[\\cA-\\cZ]',
        '%d': '\\d',
        '%l': '[a-z]',
        '%p': '[!&+:?^} ’,;@_~#(\\-<\\[‘$)\\.=\\\\{%*\\/>\\]\\|]',
        '%s': '\\s',
        '%u': '[A-Z]',
        '%w': '\\w',
        '%x': '0x[\\da-fA-F]+',
        '%z': '\\0',
        '%%': '%'
    }
    let regexPattern = ""
    for (let i = 0; i < luaPattern.length; i++) {
        if(luaPattern.charAt(i) == '%') {
            let charClass = "%" + luaPattern.charAt(i+1)
            i++;
            let replacement = characterClasses[charClass]
            regexPattern += replacement != undefined ? replacement : "\\"+luaPattern.charAt(i)
        } else {
            regexPattern += luaPattern.charAt(i)
        }
    }

    return regexPattern
}

global.string = {
    char(...args: number[]): string {
        return ""
    },

    dump(func: Function): string {
        return ""
    },

    find( s: string,
        pattern: string,
        init?: number,
        plain?: boolean
    ): LuaMultiReturn<[number, number, ...string[]] | []> {
        let start, end, captures

        const actualStr = init != undefined ? s.substring(init - 1) : s

        if (plain) {
            let start = actualStr.search(pattern) +1
            return  start != 0 ? [start, start+pattern.length] : [undefined, undefined]
        } else {
            let matches = actualStr.match(RegExp(luaPatternToRegex(pattern), "g"))
            return matches != undefined ? matches : []
        }
    },

    format: vsprintf,

    gsub(
        s: string,
        pattern: string,
        repl: string | Record<string, string> | ((...matches: string[]) => string),
        n?: number
    ): LuaMultiReturn<[string, number]> {
        const regexPattern = RegExp(luaPatternToRegex(pattern), "g")

        let replacement
        if (typeof repl == "string" ) {
            return [s.replaceAll(regexPattern, repl), 0]
        } else {
            repl.replaceAll("%.", )
        }

        if ( n != undefined) {
            let prevReplacement = replacement
            let replNum = 0
            replacement = (match, ...args) => {
                replNum++;
                if (replNum <= n) return prevReplacement(match, ...args)
                return match
            }
        }

        s.replaceAll(regexPattern, replacement)

        return ["", 1]
    },

    match(s: string, pattern: string, init?: number): LuaMultiReturn<string[]> {
        const regexPattern = RegExp(luaPatternToRegex(pattern), "m")
        const matches = s.match(regexPattern)
        if (matches != undefined) {
            matches.splice(0,1)
            return matches
        }
        return []
    },

    gmatch(s: string, pattern: string): LuaIterable<LuaMultiReturn<string[]>> {
        const regexPattern = RegExp(luaPatternToRegex(pattern), "g")
        const matches =  [...s.matchAll(regexPattern)]
        return matches.map((v) => [v])
    }
}


