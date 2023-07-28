import { Player } from 'discord-player';
import { client } from '..';
import { Client } from 'discord.js';

const player = new Player(client as unknown as Client, {
    ytdlOptions: {quality: 'highestaudio', filter: 'audioonly'}
});

player.extractors.loadDefault();
export default player
