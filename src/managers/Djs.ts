import { Collection, Guild } from 'discord.js';
import { DatabaseTables, djs } from '../typings/database';
import { query } from '../utils/query';
import { log4js } from 'amethystjs';
import { sqlise } from '../utils/toolbox';

export class DjsManager {
    private _cache: Collection<string, djs> = new Collection();

    constructor() {
        this.init();
    }

    public get cache() {
        return this._cache;
    }
    public list(guild: Guild) {
        return this._cache.get(guild?.id)?.list ?? [guild?.ownerId];
    }
    public isDj(guild: Guild, user: string) {
        return this.list(guild).includes(user);
    }
    public addDj(guild: Guild, user: string) {
        if (this.isDj(guild, user)) return false;

        const list = this._cache.get(guild.id)?.list ?? [];
        list.push(user);

        this._cache.set(guild.id, { guild_id: guild.id, list });
        query(
            `INSERT INTO ${DatabaseTables.Djs} ( guild_id, list ) VALUES ('${guild.id}', "${this.mysqlise(
                list
            )}") ON DUPLICATE KEY UPDATE list="${this.mysqlise(list)}"`
        );
    }
    public removeDj(guild: Guild, user: string) {
        if (!this.isDj(guild, user)) return false;

        const list = (this._cache.get(guild.id)?.list ?? []).filter((x) => x !== user);

        this._cache.set(guild.id, { guild_id: guild.id, list });
        query(
            `INSERT INTO ${DatabaseTables.Djs} ( guild_id, list ) VALUES ('${guild.id}', "${this.mysqlise(
                list
            )}") ON DUPLICATE KEY UPDATE list="${this.mysqlise(list)}"`
        );
    }

    private mysqlise(str: string[]) {
        return sqlise(JSON.stringify(str));
    }
    private async checkDb() {
        await query(
            `CREATE TABLE IF NOT EXISTS ${DatabaseTables.Djs} ( guild_id VARCHAR(255) NOT NULL PRIMARY KEY, list LONGTEXT )`
        );
    }
    private async fillCache() {
        const res = await query<djs<true>>(`SELECT * FROM ${DatabaseTables.Djs}`);
        if (!res) return log4js.trace('No data in table djs');

        res.forEach((x) => {
            this._cache.set(x.guild_id, {
                guild_id: x.guild_id,
                list: JSON.parse(x.list)
            });
        });
    }
    private async init() {
        await this.checkDb();
        await this.fillCache();
    }
}
