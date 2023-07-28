import { AmethystCommand, log4js, preconditions } from 'amethystjs';
import playing from '../preconditions/playing';
import player from '../cache/player';
import { emptyQueue, queueList } from '../contents/embeds';

export default new AmethystCommand({
    name: 'playlist',
    description: 'Affiche la liste de lecture',
    preconditions: [preconditions.GuildOnly, playing]
}).setChatInputRun(async ({ interaction }) => {
    const queue = player.nodes.get(interaction.guild).node.queue;

    if (queue.size === 0)
        return interaction
            .reply({
                embeds: [emptyQueue(interaction.user)]
            })
            .catch(log4js.trace);
    interaction
        .reply({
            embeds: [queueList(interaction.user, queue.tracks.toArray())]
        })
        .catch(log4js.trace);
});
