import { AmethystClient } from "amethystjs";
import { config } from "dotenv";
config()

export const client = new AmethystClient({
    intents: ['Guilds']
}, {
    token: process.env.token,
    commandsFolder: './dist/commands',
    eventsFolder: './dist/events',
    preconditionsFolder: './dist/preconditions',
    debug: true
});

client.start({})