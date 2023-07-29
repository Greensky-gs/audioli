import { AmethystCommand, log4js, preconditions } from "amethystjs";
import isDj from "../preconditions/isDj";
import playing from "../preconditions/playing";
import { getNode } from "../utils/toolbox";
import { notPlaying, paused } from "../contents/embeds";

export default new AmethystCommand({
    name: 'pause',
    description: "Met en pause la musique",
    preconditions: [preconditions.GuildOnly, isDj, playing]
}).setChatInputRun(async({ interaction }) => {
    const node = getNode(interaction);
    if (!node || !node?.node?.isPlaying() || node?.node?.isPaused()) return interaction.reply({
        embeds: [ notPlaying(interaction.user)],
        ephemeral: true
    }).catch(log4js.trace)
    node?.node?.pause();

    interaction.reply({ embeds: [ paused(interaction.user) ] }).catch(log4js.trace)
})