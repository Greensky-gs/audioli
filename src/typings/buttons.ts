import { ButtonStyle } from "discord.js";

export type buttonOptions = {
    label?: string;
    style: keyof typeof ButtonStyle;
    id?: string;
    btnId?: keyof typeof ButtonIds;
    disabled?: boolean;
    url?: string;
    emoji?: string;
}
export enum ButtonIds {
    Yes = 'yes',
    No = 'no'
}