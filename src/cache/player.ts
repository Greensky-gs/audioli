import { Player } from 'discord-player';
import { client } from '..';
import { Client } from 'discord.js';

const player = new Player(client as unknown as Client, {
    ytdlOptions: { quality: 'highestaudio', filter: 'audioonly' }
});

player.on('error', (error) => {
    console.log('Player emitted an error');
});
player.events.on('playerSkip', (queue, track) => {
    console.log(`Skipped in ${queue.guild.name}`);
});
player.events.on('playerError', (queue, error, track) => {
    console.log(`Error in ${queue.guild.name}`);
    console.log(error);
});
player.events.on('error', (queue, error) => {
    console.log(`Error in ${queue.guild.name}`);
    console.log(error);
});
player.extractors.loadDefault();
export default player;
