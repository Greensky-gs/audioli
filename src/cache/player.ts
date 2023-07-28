import { Player } from 'discord-player';
import { client } from '..';
import { Client } from 'discord.js';

export default new Player(client as unknown as Client);
