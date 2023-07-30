import { AmethystCommand, log4js } from 'amethystjs';
import { ApplicationCommandOptionType } from 'discord.js';
import { commandHelp, help } from '../contents/embeds';

export default new AmethystCommand({
    name: 'aide',
    description: "Affiche la page d'aide",
    options: [
        {
            name: 'commande',
            description: 'Commande que vous voulez voir',
            required: false,
            type: ApplicationCommandOptionType.String,
            autocomplete: true
        }
    ]
}).setChatInputRun(async ({ interaction, options, client }) => {
    const cmd = options.getString('commande');

    if (!cmd) {
        return interaction
            .reply({
                embeds: [help(interaction.user)]
            })
            .catch(log4js.trace);
    }
    const command = client.chatInputCommands.find((x) => x.options.name === cmd);
    interaction
        .reply({
            embeds: [commandHelp(interaction.user, command)]
        })
        .catch(log4js.trace);
});
