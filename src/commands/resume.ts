import { AmethystCommand, log4js, preconditions } from "amethystjs";
import isDj from "../preconditions/isDj";
import { getNode } from "../utils/toolbox";
import { notPaused, resumed } from "../contents/embeds";

export default new AmethystCommand({
    name: 'lecture',
    description: "Remet la musique en lecture après une pause",
    preconditions: [preconditions.GuildOnly, isDj]
}).setChatInputRun(async({ interaction }) => {
    const node = getNode(interaction)
    if (!node || !node?.node?.isPaused()) return interaction.reply({
        embeds: [notPaused(interaction.user)],
        ephemeral: true
    }).catch(log4js.trace)

    node.node.resume();

    interaction.reply({
        embeds: [resumed(interaction.user)]
    }).catch(log4js.trace)
})