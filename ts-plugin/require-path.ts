import ts from "typescript";
import * as tstl from "typescript-to-lua";

const REQUIRE_PATH_REGEX = /require\("(.+)"\)(.*)/g;

const REQUIRE_PREFIX = "build"
// require paths that we don't want to transform
function RAW_IMPORT_PATHS (path: string): boolean {
    if (path === "util") return true;

    if (path.search(/^__\w+__/g) >= 0) return true;

    return false;
}

const plugin: tstl.Plugin = {
    beforeEmit(
        _program: ts.Program,
        _options: tstl.CompilerOptions,
        _emitHost: tstl.EmitHost,
        result: tstl.EmitFile[]
    ) {
        for (const file of result) {
            file.code = file.code.replaceAll(
                REQUIRE_PATH_REGEX,
                (match: string, path: unknown, tail: string) => {
                    if (typeof path !== "string" || RAW_IMPORT_PATHS(path)) {
                        return match;
                    }

                    return `require("${REQUIRE_PREFIX}.${path}")${tail}`;
                }
            );
        }
    },
};

export default plugin;