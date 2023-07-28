import { ActionRowBuilder, AnyComponentBuilder, ButtonBuilder, ButtonStyle, Channel, ChannelType } from 'discord.js';
import datas from '../contents/data.json';
import { config, configKey } from '../typings/configs';
import { ButtonIds, buttonOptions } from '../typings/buttons';

export const sqlise = (str: string) => str.replace(/"/g, '\\"');
export const data = <Folder extends keyof typeof datas, Key extends keyof (typeof datas)[Folder]>(
    folder: Folder,
    key: Key
): (typeof datas)[Folder][Key] => {
    return datas[folder][key];
};
export const getConfig = <Config extends configKey>(config: Config): config<Config> => {
    return datas.configs[config] as unknown as config<Config>;
};
export const dbBool = (x: number | string | boolean) =>
    typeof x === 'number' ? x === 1 : typeof x === 'string' ? x === '1' : x ? '1' : '0';
export const row = <Components extends AnyComponentBuilder>(...components: Components[]): ActionRowBuilder<Components> => {
    return new ActionRowBuilder().setComponents(components) as ActionRowBuilder<Components>
}
export const button = ({ label, style, url, id, btnId, emoji, disabled = false }: buttonOptions) => {
    const btn = new ButtonBuilder()
        .setStyle(ButtonStyle[style])
        .setDisabled(disabled)
    
    if (label) btn.setLabel(label)
    if (id) btn.setCustomId(id)
    if (url) btn.setURL(url)
    if (emoji) btn.setEmoji(emoji)
    if (btnId) btn.setCustomId(ButtonIds[btnId]);

    return btn;
}
export const yesBtn = () => button({ label: 'Oui', btnId: 'Yes', style: 'Success' })
export const noBtn = () => button({ label: 'Non', btnId: 'No', style:'Danger'})
export const yesNoRow = () => row(yesBtn(), noBtn());
export const pingChan = (channel: string | Channel) => typeof channel === 'string' ? `<#${channel}>` : channel.type === ChannelType.GuildCategory ? channel.name : `<#${channel.id}>`