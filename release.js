require('require-json5').replace();
const pjson = require('./package.json')
const tsconf = require('./tsconfig.json')

const fs = require('fs')
const path = require('path');

const {spawnSync} = require('child_process');

function runCommand(command, options) {
    let prog , args, command_str
    if (typeof  command === "string") {
        command_str = command
        args = command.split(" ")
        prog = args.splice(0, 1)[0]
        args = args

    } else {
        command_str = command.join(" ")
        prog = command.splice(0, 1)[0]
        args = command
    }

    if (options === undefined || options.stdio === undefined) {
        options = {
            ...options,
            stdio: "inherit"
        }
    }

    console.log(">  " + command_str)

    let p_res = spawnSync(prog, args, options)

    if (p_res.error !== undefined) {
        console.log(`Command failed to execute successfully: ${p_res.error.name}: ${p_res.error.message}`)
        process.exit(1)
    }
    if (p_res.status !== 0) {
        console.log(`Command failed with exit code ${p_res.status}`)
        process.exit(1)
    }

    return p_res
}

function genChangelogMd() {
    const fac_changelog = "changelog.txt"
    const git_changelog = "Changelog.md"
    console.log(`Generating ${git_changelog} from ${fac_changelog} ...`)

    let changelog_md = "# Changelog"

    const allFileContents = fs.readFileSync(fac_changelog, 'utf-8');
    allFileContents.split(/\r?\n/).forEach(line =>  {
        let num_spaces = line.search(/\S|$/)

        let remLine = line.substring(num_spaces)
        remLine = remLine.replaceAll("__", "\\_\\_")
        remLine = remLine.replaceAll("**", "\\*\\*")

        if (num_spaces === 0 && line.indexOf(":") !== -1 && line.startsWith("Version")) {
            changelog_md += "\n  - " + remLine
        } else if (num_spaces === 2) {
            changelog_md += "\n    - " + remLine
        } else if (num_spaces === 4) {
            changelog_md += "\n        " + remLine
        }
    });

    fs.writeFileSync(git_changelog, changelog_md, {encoding: "utf8", flag: "w"})
}

function buildZip() {
    const possible_files = [
        "info.json",
        "changelog.txt",
        "thumbnail.png",
        "settings.lua",
        "settings-updates.lua",
        "settings-final-fixes.lua",
        "settings-final-fixes.lua",
        "data.lua",
        "data-updates.lua",
        "data-final-fixes.lua",
        "data-final-fixes.lua",
        "control.lua"
    ]

    const possible_dirs = [
        "locale",
        "scenarios",
        "campaigns",
        "tutorials",
        "migrations",

        "build",
        "graphics",
    ]

    const release_zip_name = `${pjson.name}_${pjson.version}.zip`
    if (fs.existsSync(release_zip_name)) {
        console.log(`Removing previous build of '${release_zip_name}'....`)
        fs.unlinkSync(release_zip_name)
    }
    console.log(`Building ${pjson.name} release zip: '${release_zip_name}'...`)

    const files = possible_files.filter(fs.existsSync).map((f) => pjson.name + "/" + f)
    const dirs  = possible_dirs .filter(fs.existsSync).map( (d) => pjson.name + "/" + d)

    if (!fs.existsSync(pjson.name)) {
        fs.symlinkSync(path.resolve("./"), pjson.name)
    }

    runCommand([
        "zip", "-r", release_zip_name,
        ...files,
        ...dirs,
    ])

    fs.unlinkSync(pjson.name)
}

console.log(`Running tests...`)
runCommand("npm run test")


if (pjson.name === undefined || pjson.version === undefined) {
    console.log("Name or version is not defined in 'package.json' aborting release!")
    process.exit(1)
}
console.log(`Clean building ${pjson.name} version ${pjson.version}...`)


if (tsconf.compilerOptions.outDir === undefined) {
    console.log("Output directory is not defined in 'tsconfig.json' aborting release!")
    process.exit(1)
}
let outDir = path.resolve(tsconf.compilerOptions.outDir)
console.log(`Deleting ${outDir}`)
fs.rmSync(outDir, { recursive: true, force: true })

runCommand("npm run build")

genChangelogMd()

let info_json = require('./info.json')
if (info_json.version !== pjson.version) {
    console.log(`Updating version in info.json '${info_json.version}' => '${pjson.version}'`)
    info_json.version = pjson.version
    let pretty_json = JSON.stringify(info_json, null, 4)
    fs.writeFileSync('./info.json', pretty_json, {encoding: "utf8", flag: "w"})
}

buildZip()