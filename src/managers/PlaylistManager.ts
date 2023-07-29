import { Collection } from "discord.js";
import { DatabaseTables, playlists } from "../typings/database";
import { query } from "../utils/query";
import { log4js } from "amethystjs";
import { dbBool, sqlise } from "../utils/toolbox";
import GetEmojiStorage from "../processes/GetEmojiStorage";
import GetEmojiFromStorage from "../processes/GetEmojiFromStorage";

export class PlaylistManager {
    private _cache: Collection<number, playlists> = new Collection();

    constructor() {
        this.init()
    }

    public get cache() {
        return this._cache
    }
    public get publicPlaylists() {
        return this._cache.filter(x => x.public);
    }
    public getSharedWith(userId: string) {
        return this._cache.filter(x => x.shared_with.includes(userId) && x.user_id !== userId);
    }
    public getUserLists(userId: string, options?: { publics?: boolean; shared?: boolean; }) {
        const getPublics = options?.publics ?? false;
        const getShared = options?.shared ?? false;

        const publics = this.publicPlaylists;
        const shared = this.getSharedWith(userId)
        const users = this._cache.filter(x => x.user_id === userId)

        return users.concat(getShared ? shared : new Collection()).concat(getPublics ? publics : new Collection())
    }
    public deletePlaylist(id: number) {
        this._cache.delete(id)
        return query(`DELETE FROM ${DatabaseTables.Playlists} WHERE id='${id}'`)
    }
    public exists(id: number, userId?: string) {
        if (!!userId) return !!this._cache.find(x => x.id === id && x.user_id === userId)
        return this._cache.has(id)
    }
    public getAbsolute(id: number) {
        return this._cache.get(id)
    }
    public getPlaylist(userId: string, id: number) {
        return this.exists(id, userId) ? this._cache.get(id) : undefined;
    }
    public playlistIncludes(playlist: { songs: {id: string; title: string}[] }, song: string | { id: string; title: string }) {
        return !!playlist.songs.find(x => x.id === (typeof song === 'string' ? song : song.id))
    }
    public addToPlaylist({ userId, playlist, song }: { userId: string; playlist: number; song: { id: string; title: string } }) {
        if (!this.exists(playlist, userId)) return 'user has not playlist with this is';
        const list = this.getPlaylist(userId, playlist)

        if (this.playlistIncludes(list, song)) return 'already included';
        list.songs.push(song)
        this._cache.set(list.id, list)

        query(`UPDATE ${DatabaseTables.Playlists} SET songs='${JSON.stringify(list.songs).replace(/'/g, "\\'")}' WHERE id='${list.id}'`)
        return true
    }
    public removeFromPlaylist({ userId, playlist, song }: { userId: string; playlist: number; song: string }) {
        if (!this.exists(playlist, userId)) return 'user has not playlist with this is';
        const list = this.getPlaylist(userId, playlist)

        if (!this.playlistIncludes(list, song)) return 'not included';
        list.songs = list.songs.filter(x => x.id !== song)
        this._cache.set(list.id, list)

        query(`UPDATE ${DatabaseTables.Playlists} SET songs='${JSON.stringify(list.songs).replace(/'/g, "\\'")}' WHERE id='${list.id}'`)
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
        this._cache.set(playlist.id, playlist);
        query(`UPDATE ${DatabaseTables.Playlists} SET shared_with='${JSON.stringify(playlist.shared_with)}' WHERE id='${id}'`)
    }
    public unshare(id: number, user: string) {
        const playlist = this.getAbsolute(id);
        if (!playlist) return 'unexisting'
        if (user === playlist.user_id) return 'user is owner'
        if (!this.sharedWith(id, user)) return 'not shared'

        playlist.shared_with = playlist.shared_with.filter(x => x !== user);
        this._cache.set(playlist.id, playlist);
        query(`UPDATE ${DatabaseTables.Playlists} SET shared_with='${JSON.stringify(playlist.shared_with)}' WHERE id='${id}'`)
    }
    public isPublic(id: number) {
        return !!this.getAbsolute(id)?.public
    }
    public makePublic(id: number) {
        const list = this.getAbsolute(id);
        if (!list) return 'unexisting'
        if (this.isPublic(id)) return 'already public'

        list.public = true;
        this._cache.set(list.id, list)
        query(`UPDATE ${DatabaseTables.Playlists} SET public='1' WHERE id='${id}'`)
    }
    public makePrivate(id: number) {
        const list = this.getAbsolute(id);
        if (!list) return 'unexisting'
        if (!this.isPublic(id)) return 'not public'

        list.public = false;
        this._cache.set(list.id, list)
        query(`UPDATE ${DatabaseTables.Playlists} SET public='0' WHERE id='${id}'`)
    }
    public async createList({ user, songs = [], name, emoji = null }: { user: string; songs?: {id: string; title: string}[]; name: string; emoji?: string; }) {
        const res = await query(`INSERT INTO ${DatabaseTables.Playlists} ( user_id, name, shared_with, songs, public, emoji ) VALUES ('${user}', "${sqlise(name)}", '[]', "${JSON.stringify(songs)}", '0', "${emoji ? GetEmojiStorage.process(emoji) : 'null'}")`)

        if (!res) return 'error (db)'
        this._cache.set(res.insertId, {
            id: res.insertId,
            user_id: user,
            songs,
            shared_with: [],
            public: false,
            name,
            emoji: emoji
        })

        return this._cache.get(res.insertId);
    }

    private async checkDb() {
        await query(`CREATE TABLE IF NOT EXISTS ${DatabaseTables.Playlists} ( user_id VARCHAR(255) NOT NULL, \`name\` VARCHAR(255) NOT NULL, songs LONGTEXT, shared_with LONGTEXT, public TINYINT(1) NOT NULL DEFAULT '0', emoji VARCHAR(255) DEFAULT NULL, id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT )`)
        return true;
    }
    private async fillCache() {
        const res = await query<playlists<true>>(`SELECT * FROM ${DatabaseTables.Playlists}`)
        if (!res) return log4js.trace("No data in playlist (database)")

        res.forEach((pl) => {
            this._cache.set(pl.id, {
                ...pl,
                shared_with: JSON.parse(pl.shared_with),
                songs: JSON.parse(pl.songs),
                public: dbBool(pl.public),
                emoji: pl.emoji === 'null' ? null : GetEmojiFromStorage.process(pl.emoji)
            })
        })
    }
    private async init() {
        await this.checkDb();
        this.fillCache()
    }
}