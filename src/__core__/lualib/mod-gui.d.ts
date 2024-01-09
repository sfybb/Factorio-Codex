// @noSelfInFile

/*
Hello script explorer, if you are looking to upgrade your mod to use the mod gui, its pretty simple.

Typically you will have something like:
player.gui.left.add{...}

All you will need to do, is change it to:
mod_gui.get_frame_flow(player).add{...}

And for buttons its just the same:
mod_gui.get_button_flow(player).add{...}

It should be as simple as find and replace.

Any other questions please feel free to ask on the modding help forum.
 */

/** @noResolution */
declare module "__core__.lualib.mod-gui" {
    export function get_frame_flow(player: LuaPlayer): FrameGuiElement;

    export function get_button_flow(player: LuaPlayer): FlowGuiElement;

    export const frame_style: string;

    export const button_style: string;
}