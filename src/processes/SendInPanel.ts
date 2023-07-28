import { Client, TextBasedChannel } from "discord.js";
import { Process } from "../structures/Process";
import { log4js } from "amethystjs";
import { classic } from "../contents/embeds";

export default new Process('send in panel channel', async(client: Client, content: string) => {
    const panelChannel = client.channels.cache.get(process.env.panel) ?? await client.channels.fetch(process.env.panel).catch(() => {});
    if (!panelChannel) return;

    const channel = panelChannel as TextBasedChannel;
    channel.send({
        embeds: [
            classic(client.user, { accentColor: true }).setTitle("Erreur").setDescription(`Quelque chose a été signalé :\n\`\`\`${content}\`\`\``)
        ]
    }).catch(log4js.trace)
})