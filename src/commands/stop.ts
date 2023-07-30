import { AmethystCommand, log4js, preconditions } from 'amethystjs';
import isDj from '../preconditions/isDj';
import { getNode } from '../utils/toolbox';
import { notPlaying, stopped } from '../contents/embeds';

export default new AmethystCommand({
    name: 'stop',
    description: 'Arrête la musique',
    preconditions: [preconditions.GuildOnly, isDj]
}).setChatInputRun(async ({ interaction }) => {
    const node = getNode(interaction);
    if (!node || !node?.node?.queue?.currentTrack)
        return interaction
            .reply({
                embeds: [notPlaying(interaction.user)],
                ephemeral: true
            })
            .catch(log4js.trace);

    node.node.stop(true);

    interaction
        .reply({
            embeds: [stopped(interaction.user)],
            ephemeral: true
        })
        .catch(log4js.trace);
});
