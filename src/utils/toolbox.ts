import datas from '../contents/data.json';
import { config, configKey } from '../typings/configs';

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
