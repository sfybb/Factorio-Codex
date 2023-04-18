export type GuiAction = {
    gui: string,
    action: string
}

export default interface IGuiRoot {
    build_gui(): void

    destroy(): void

    open(): void
    close(): void
    toggle(): void

    gui_action(action: GuiAction, event: GuiEventData): void
}