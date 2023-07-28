import { AmethystEvent, log4js } from 'amethystjs';
import { ActivityType } from 'discord.js';
import SendInPanel from '../processes/SendInPanel';

export default new AmethystEvent('ready', async (client) => {
    client.user.setActivity({
        name: 'de la musique',
        type: ActivityType.Listening
    });

    log4js.config('onLog', (log) => {
        SendInPanel.process(client, log);
    });
    process.on('uncaughtException', (error, origin) => {
        SendInPanel.process(client, JSON.stringify(error, null, 4));
    });
});
