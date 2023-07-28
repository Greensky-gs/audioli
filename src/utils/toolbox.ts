import {
    ActionRowBuilder,
    AnyComponentBuilder,
    ButtonBuilder,
    ButtonStyle,
    Channel,
    ChannelType,
    Collection
} from 'discord.js';
import datas from '../contents/data.json';
import { config, configKey } from '../typings/configs';
import { ButtonIds, buttonOptions } from '../typings/buttons';

export const sqlise = (str: string | number | boolean) =>
    typeof str === 'boolean' ? dbBool(str) : str.toString().replace(/"/g, '\\"');
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
export const row = <Components extends AnyComponentBuilder>(
    ...components: Components[]
): ActionRowBuilder<Components> => {
    return new ActionRowBuilder().setComponents(components) as ActionRowBuilder<Components>;
};
export const button = ({ label, style, url, id, btnId, emoji, disabled = false }: buttonOptions) => {
    const btn = new ButtonBuilder().setStyle(ButtonStyle[style]).setDisabled(disabled);

    if (label) btn.setLabel(label);
    if (id) btn.setCustomId(id);
    if (url) btn.setURL(url);
    if (emoji) btn.setEmoji(emoji);
    if (btnId) btn.setCustomId(ButtonIds[btnId]);

    return btn;
};
export const yesBtn = () => button({ label: 'Oui', btnId: 'Yes', style: 'Success' });
export const noBtn = () => button({ label: 'Non', btnId: 'No', style: 'Danger' });
export const yesNoRow = () => row(yesBtn(), noBtn());
export const pingChan = (channel: string | Channel) =>
    typeof channel === 'string'
        ? `<#${channel}>`
        : channel.type === ChannelType.GuildCategory
        ? channel.name
        : `<#${channel.id}>`;
export const plurial = (nb: number | any[] | Collection<any, any>, data?: { pl?: string; sg?: string }) => {
    const int = typeof nb === 'number' ? nb : nb instanceof Collection ? nb.size : nb.length;
    return int === 1 ? data?.sg ?? '' : data?.pl ?? 's';
};
export const numerize = (int: number | any[] | Collection<any, any>) =>
    (typeof int === 'number' ? int : int instanceof Collection ? int.size : int.length).toLocaleString('fr');
export const msToSentence = (time: number, multiply = false) => {
    if (multiply) time *= 1000;
    time = Math.floor(time);

    const s = Math.floor(time / 1000) % 60;
    const m = Math.floor(time / (1000 * 60)) % 60;
    const h = Math.floor(time / (1000 * 60 * 60)) % 24;
    const d = Math.floor(time / (1000 * 60 * 60 * 24)) % 365;
    const y = Math.floor(time / (1000 * 60 * 60 * 24 * 365));

    const superior = [
        { name: 'seconde', value: s },
        { name: 'minute', value: m },
        { name: 'heure', value: h },
        { name: 'jour', value: d },
        { name: 'an', value: y }
    ]
        .filter((x) => x.value > 0)
        .reverse();

    const format = [];
    superior.forEach((sup) => {
        format.push(`${numerize(sup.value)} ${sup.name}${plurial(sup.value)}`);
    });
    let str = '';

    format.forEach((v, i, a) => {
        str += v + (a[i + 1] ? (a[i + 2] ? ', ' : ' et ') : '');
    });

    return str;
};
export const resize = (str: string, size = 4096) => {
    if (str.length <= size) return str;
    return str.slice(0, size - 3) + '...';
};
