import { AmethystCommand, log4js, preconditions } from 'amethystjs';
import { button, getNode, row } from '../utils/toolbox';
import { current, notPlaying } from '../contents/embeds';
import player from '../cache/player';

export default new AmethystCommand({
    name: 'actuelle',
    description: 'Affiche la musique en cours',
    preconditions: [preconditions.GuildOnly]
}).setChatInputRun(async ({ interaction }) => {
    const node = getNode(interaction);

    if (!node || !node.node.queue.currentTrack)
        return interaction
            .reply({
                embeds: [notPlaying(interaction.user)],
                ephemeral: true
            })
            .catch(log4js.trace);

    interaction
        .reply({
            embeds: [current(interaction.user, node)],
            components: [row(button({ label: 'Ajouter à une playlist', btnId: 'AddToPlaylist', style: 'Primary' }))]
        })
        .catch(log4js.trace);
});
