import { configs, configTypes } from '../contents/data.json';

export type configKey = keyof typeof configs;
export type configType = keyof typeof configTypes;
export type configValueType<T extends configType> = T extends 'boolean' ? boolean : T extends 'number' | 'time' ? number : string;

export type config<Config extends configKey> = {
    id: Config;
    name: string;
    description: string;
    type: configType;
    default: typeof configs[Config]['default'];
}