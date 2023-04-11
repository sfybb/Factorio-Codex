export default interface ISearchable<T extends AnyNotNil> {
    getResults(search: string, set: LuaSet<T>): void
}