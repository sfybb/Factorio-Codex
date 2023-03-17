type FLIBMigrationsTable = {
    [key: string]: (...args: any) => void;
}

/** @noResolution */
declare module "__flib__.migration" {
    export function on_config_changed(event: ConfigurationChangedData,
                                      migrations: FLIBMigrationsTable,
                                      mod_name: undefined | string,
                                      ...args: any): boolean;

    export function run(old_version: string, migrations: FLIBMigrationsTable, format: undefined | string, ...args: any): void;
    export function is_newer_version(old_version: string, new_version: string, format: undefined | string): undefined | boolean;
    export function format_version(version: string, format: undefined | string): undefined | string;
}