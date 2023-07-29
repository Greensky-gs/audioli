import { Collection } from "discord.js";
import { DatabaseTables, playlists } from "../typings/database";
import { query } from "../utils/query";
import { log4js } from "amethystjs";
import { dbBool, sqlise } from "../utils/toolbox";

export class PlaylistManager {
    private cache: Collection<number, playlists> = new Collection();

    constructor() {
        this.init()
    }

    public get publicPlaylists() {
        return this.cache.filter(x => x.public);
    }
    public getSharedWith(userId: string) {
        return this.cache.filter(x => x.shared_with.includes(userId) && x.user_id !== userId);
    }
    public getUserLists(userId: string, options?: { publics?: boolean; shared?: boolean; }) {
        const getPublics = options?.publics ?? false;
        const getShared = options?.shared ?? false;

        const publics = this.publicPlaylists;
        const shared = this.getSharedWith(userId)
        const users = this.cache.filter(x => x.user_id === userId)

        return users.concat(getShared ? shared : new Collection()).concat(getPublics ? publics : new Collection())
    }
    public deletePlaylist(id: number) {
        this.cache.delete(id)
        return query(`DELETE FROM ${DatabaseTables.Playlists} WHERE id='${id}'`)
    }
    public exists(id: number, userId?: string) {
        if (!!userId) return !!this.cache.find(x => x.id === id && x.user_id === userId)
        return this.cache.has(id)
    }
    public getAbsolute(id: number) {
        return this.cache.get(id)
    }
    public getPlaylist(userId: string, id: number) {
        return this.exists(id, userId) ? this.cache.get(id) : undefined;
    }
    public addToPlaylist({ userId, playlist, song }: { userId: string; playlist: number; song: string }) {
        if (!this.exists(playlist, userId)) return 'user has not playlist with this is';
        const list = this.getPlaylist(userId, playlist)

        if (list.songs.includes(song)) return 'already included';
        list.songs.push(song)
        this.cache.set(list.id, list)

        query(`UPDATE ${DatabaseTables.Playlists} SET songs="${JSON.stringify(list.songs)}" WHERE id='${list.id}'`)
        return true
    }
    public removeFromPlaylist({ userId, playlist, song }: { userId: string; playlist: number; song: string }) {
        if (!this.exists(playlist, userId)) return 'user has not playlist with this is';
        const list = this.getPlaylist(userId, playlist)

        if (!list.songs.includes(song)) return 'not included';
        list.songs = list.songs.filter(x => x !== song)
        this.cache.set(list.id, list)

        query(`UPDATE ${DatabaseTables.Playlists} SET songs="${JSON.stringify(list.songs)}" WHERE id='${list.id}'`)
        return true
    }
    public sharedWith(id: number, user: string) {
        if (!this.exists(id)) return false
        return this.getAbsolute(id).shared_with.includes(user)
    }
    public shareWith(id: number, user: string) {
        const playlist = this.getAbsolute(id);
        if (!playlist) return 'unexisting'
        if (user === playlist.user_id) return 'user is owner'
        if (this.sharedWith(id, user)) return 'already shared'

        playlist.shared_with.push(user);
        this.cache.set(playlist.id, playlist);
        query(`UPDATE ${DatabaseTables.Playlists} SET shared_with="${JSON.stringify(playlist.shared_with)}" WHERE id='${id}'`)
    }
    public unshare(id: number, user: string) {
        const playlist = this.getAbsolute(id);
        if (!playlist) return 'unexisting'
        if (user === playlist.user_id) return 'user is owner'
        if (!this.sharedWith(id, user)) return 'not shared'

        playlist.shared_with = playlist.shared_with.filter(x => x !== user);
        this.cache.set(playlist.id, playlist);
        query(`UPDATE ${DatabaseTables.Playlists} SET shared_with="${JSON.stringify(playlist.shared_with)}" WHERE id='${id}'`)
    }
    public isPublic(id: number) {
        return !!this.getAbsolute(id)?.public
    }
    public makePublic(id: number) {
        const list = this.getAbsolute(id);
        if (!list) return 'unexisting'
        if (this.isPublic(id)) return 'already public'

        list.public = true;
        this.cache.set(list.id, list)
        query(`UPDATE ${DatabaseTables.Playlists} SET public='1' WHERE id='${id}'`)
    }
    public makePrivate(id: number) {
        const list = this.getAbsolute(id);
        if (!list) return 'unexisting'
        if (!this.isPublic(id)) return 'not public'

        list.public = false;
        this.cache.set(list.id, list)
        query(`UPDATE ${DatabaseTables.Playlists} SET public='0' WHERE id='${id}'`)
    }
    public async createList({ user, songs = [], name }: { user: string; songs?: string[]; name: string; }) {
        const res = await query(`INSERT INTO ${DatabaseTables.Playlists} ( user_id, name, shared_with, songs, public ) VALUES ('${user}', "${sqlise(name)}", '[]', "${JSON.stringify(songs)}", '0')`)

        if (!res) return 'error (db)'
        this.cache.set(res.insertId, {
            id: res.insertId,
            user_id: user,
            songs,
            shared_with: [],
            public: false,
            name
        })

        return true;
    }

    private async checkDb() {
        await query(`CREATE TABLE IF NOT EXISTS ${DatabaseTables.Playlists} ( user_id VARCHAR(255) NOT NULL, \`name\` VARCHAR(255) NOT NULL, songs LONGTEXT, shared_with LONGTEXT, public TINYINT(1) NOT NULL DEFAULT '0', id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT )`)
        return true;
    }
    private async fillCache() {
        const res = await query<playlists<true>>(`SELECT * FROM ${DatabaseTables.Playlists}`)
        if (!res) return log4js.trace("No data in playlist (database)")

        res.forEach((pl) => {
            this.cache.set(pl.id, {
                ...pl,
                shared_with: JSON.parse(pl.shared_with),
                songs: JSON.parse(pl.songs),
                public: dbBool(pl.public)
            })
        })
    }
    private async init() {
        await this.checkDb();
        this.fillCache()
    }
}