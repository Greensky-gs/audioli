import { AmethystCommand, log4js } from "amethystjs";
import { ApplicationCommandOptionType } from "discord.js";
import playing from "../preconditions/playing";
import isDj from "../preconditions/isDj";
import player from "../cache/player";
import { volume as volumeEmbed } from "../contents/embeds";

export default new AmethystCommand({
    name: 'volume',
    description: "Modifie le volume",
    options: [
        {
            name: 'volume',
            description: "Volume que vous voulez mettre",
            type: ApplicationCommandOptionType.Integer,
            maxValue: 100
        }
    ],
    preconditions: [playing, isDj]
}).setChatInputRun(async({ interaction, options }) => {
    const volume = options.getInteger('volume')
    player.nodes.get(interaction.guild)?.node?.setVolume(volume);

    interaction.reply({
        embeds: [volumeEmbed(interaction.user, volume)]
    }).catch(log4js.trace)
})