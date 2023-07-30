import { Collection } from 'discord.js';
import { DatabaseTables, configs } from '../typings/database';
import { query } from '../utils/query';
import { log4js } from 'amethystjs';
import { dbBool, getConfig, sqlise } from '../utils/toolbox';
import { configKey, configType, configValueType } from '../typings/configs';
import { configs as configsData } from '../contents/data.json';

export class ConfigsManager {
    private _cache: Collection<string, configs> = new Collection();

    constructor() {
        this.init();
    }

    public get cache() {
        return this._cache;
    }
    public get defaultConfigs() {
        const confs = {};

        Object.keys(configsData).forEach((k: keyof typeof configsData) => {
            confs[k] = configsData[k].default ?? null;
        });

        return confs as Record<configKey, string | number | boolean | null>;
    }
    public getConfigs(guild: string) {
        return this._cache.get(guild) ?? { ...this.defaultConfigs, guild_id: guild };
    }
    public getconfig<Key extends configKey>(guild: string, config: Key): (typeof configsData)[Key]['default'] {
        return this.getConfigs(guild)[config] as (typeof configsData)[Key]['default'];
    }
    public setConfig<Key extends configKey>(guild: string, config: Key, value: (typeof configsData)[Key]['default']) {
        const confs = this.getConfigs(guild);
        confs[config] = value;

        this._cache.set(guild, confs);
        this.save(guild, config);
    }

    private save(guild: string, key: configKey) {
        const confs = this.getConfigs(guild);
        const value = (x: keyof typeof confs) =>
            typeof confs[x] === 'boolean' ? dbBool(confs[x]) : sqlise(confs[x].toString());
        query(`INSERT INTO ${DatabaseTables.Configs} ( ${Object.keys(confs).join(', ')} ) VALUES (${Object.keys(confs)
                .map((x: keyof typeof confs) => `"${value(x)}"`)
                .join(', ')}) ON DUPLICATE KEY UPDATE ${key}="${value(key)}"`);
    }
    private async fillCache() {
        const res = await query<configs<true>>(`SELECT * FROM ${DatabaseTables.Configs}`);
        if (!res) return log4js.trace('No data in database for configs');

        res.forEach((value) => {
            const confs = {
                guild_id: value.guild_id
            };

            Object.keys(value)
                .filter((x) => x !== 'guild_id')
                .forEach((x: configKey) => {
                    if (getConfig(x).type === 'boolean') {
                        confs[x] = dbBool(value[x]);
                    } else if (getConfig(x).type === 'number' || getConfig(x).type === 'time') {
                        confs[x] = parseInt(value[x]);
                    } else {
                        confs[x] = value[x];
                    }
                });
            this._cache.set(value.guild_id, confs as configs);
        });
    }
    private async checkDb() {
        const types: Record<configType, string> = {
            boolean: 'TINYINT(1)',
            channel: 'VARCHAR(255)',
            customstring: 'VARCHAR(255)',
            number: 'VARCHAR(255)',
            role: 'VARCHAR(255)',
            string: 'VARCHAR(2048)',
            time: 'VARCHAR(255)'
        };

        const generateTables = () => {
            return [
                {
                    name: 'guild_id',
                    type: 'VARCHAR(255)',
                    default: null,
                    primary: true
                },
                ...Object.keys(configsData).map((cf: keyof typeof configsData) => {
                    return {
                        name: cf,
                        type: types[configsData[cf].type],
                        default: configsData[cf].default,
                        primary: false
                    };
                })
            ];
        };
        const tableCreation = () =>
            generateTables()
                .map(
                    (x) =>
                        `${x.name} ${x.type}${x.default ? ` DEFAULT "${sqlise(x.default)}"` : ''}${
                            x.primary ? ' PRIMARY KEY' : ''
                        }`
                )
                .join(', ');

        await query(`CREATE TABLE IF NOT EXISTS ${DatabaseTables.Configs} ( ${tableCreation()} )`);
        const tables = await query<{
            Field: string;
            Type: string;
            Null: string;
            Key: string;
            Default: string | null;
            Extra: string;
        }>(`SHOW COLUMNS FROM ${DatabaseTables.Configs}`);

        if (!tables) return;
        if (tables.length - 1 < Object.keys(configsData).length) {
            const missing = (Object.keys(configsData) as configKey[]).filter((x) => !tables.find((y) => y.Field === x));

            await Promise.all(
                missing.map((m) =>
                    query(
                        `ALTER TABLE ${DatabaseTables.Configs} ADD ${m} ${types[configsData[m].type]}${
                            configsData[m].default ? ` DEFAULT "${sqlise(configsData[m].default)}"` : ''
                        }`
                    )
                )
            );
        }

        return true;
    }
    private async init() {
        await this.checkDb();
        this.fillCache();
    }
}
