import { Collection, Guild, GuildMember, User } from 'discord.js';
import { DatabaseTables, djListType, djs } from '../typings/database';
import { query } from '../utils/query';
import { log4js } from 'amethystjs';
import { sqlise } from '../utils/toolbox';
import { GuildResolvable, userResolvable } from '../typings/managers';

export class DjsManager {
    private _cache: Collection<string, djs> = new Collection();

    constructor() {
        this.init();
    }

    public getRoles(guild: GuildResolvable) {
        return this.list(guild).filter((x) => x.type === 'role');
    }
    public getUsers(guild: GuildResolvable) {
        return this.list(guild).filter((x) => x.type === 'user');
    }
    public get cache() {
        return this._cache;
    }
    public list(guild: GuildResolvable) {
        const list = this._cache.get(typeof guild === 'string' ? guild : guild.id)?.list ?? [];

        return list.concat(guild instanceof Guild ? [{ type: 'user', id: guild.ownerId }] : []);
    }
    public isDj(guild: Guild, user: userResolvable) {
        if (typeof user === 'string') return !!this.getUsers(guild).find((x) => x.id === user);
        if (user instanceof User) return !!this.getUsers(guild).find((x) => x.id === user.id);

        return (
            !!this.getUsers(guild).find((x) => x.id === user.id) ||
            this.getRoles(guild).some((x) => user.roles.cache.has(x.id))
        );
    }
    public addDj(guild: Guild, input: { id: string; type: 'user' | 'role' }) {
        if (this.isDj(guild, input.id)) return false;

        const list = this._cache.get(guild.id)?.list ?? [];
        list.push(input);

        this._cache.set(guild.id, { guild_id: guild.id, list });
        query(
            `INSERT INTO ${DatabaseTables.Djs} ( guild_id, list ) VALUES ('${guild.id}', "${this.mysqlise(
                list
            )}") ON DUPLICATE KEY UPDATE list="${this.mysqlise(list)}"`
        );
    }
    public removeDj(guild: Guild, id: string) {
        if (!this.list(guild).find((x) => x.id === id)) return false;

        const list = (this._cache.get(guild.id)?.list ?? []).filter((x) => x.id !== id);

        this._cache.set(guild.id, { guild_id: guild.id, list });
        query(
            `INSERT INTO ${DatabaseTables.Djs} ( guild_id, list ) VALUES ('${guild.id}', "${this.mysqlise(
                list
            )}") ON DUPLICATE KEY UPDATE list="${this.mysqlise(list)}"`
        );
    }

    private mysqlise(str: djListType[]) {
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
