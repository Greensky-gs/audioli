import { AmethystClient } from 'amethystjs';
import { Partials } from 'discord.js';
import { config } from 'dotenv';
config();

export const client = new AmethystClient(
    {
        intents: ['Guilds', 'GuildVoiceStates', 'MessageContent', 'GuildMessages'],
        partials: [Partials.Channel, Partials.Message]
    },
    {
        token: process.env.token,
        commandsFolder: './dist/commands',
        eventsFolder: './dist/events',
        preconditionsFolder: './dist/preconditions',
        autocompleteListenersFolder: './dist/autocompletes',
        debug: true,
        prefix: 'au!'
    }
);

client.start({});
