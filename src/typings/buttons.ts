import { ButtonStyle } from 'discord.js';

export type buttonOptions = {
    label?: string;
    style: keyof typeof ButtonStyle;
    id?: string;
    btnId?: keyof typeof ButtonIds;
    disabled?: boolean;
    url?: string;
    emoji?: string;
};
export enum ButtonIds {
    Yes = 'yes',
    No = 'no',
    DJListUsers = 'cmd.djs.list.users',
    DJListRoles = 'cmd.djs.list.roles',
    DJListMixed = 'cmd.djs.list',
    AddToPlaylist = 'action.addToPlaylist'
}
