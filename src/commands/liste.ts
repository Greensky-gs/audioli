import { AmethystCommand, log4js, preconditions } from 'amethystjs';
import playing from '../preconditions/playing';
import isDj from '../preconditions/isDj';
import { ApplicationCommandOptionType, VoiceChannel } from 'discord.js';
import player from '../cache/player';
import { error, moveSameSong, moved, play, shuffled, skipped, trackRemoved } from '../contents/embeds';

export default new AmethystCommand({
    name: 'liste',
    description: 'Gère la liste de lecture du serveur',
    preconditions: [preconditions.GuildOnly, playing, isDj],
    options: [
        {
            name: 'retirer',
            description: 'Retire une chanson de la liste de lecture',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'musique',
                    description: 'Musique que vous voulez retirer',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true
                }
            ]
        },
        {
            name: 'passer',
            description: 'Passe à la chanson suivante, sans finir celle actuelle',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'recommencer',
            description: 'Recommence la chanson en cours',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'déplacer',
            description: 'Déplace une chanson',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'musique',
                    description: 'Musique que vous voulez déplacer',
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    autocomplete: true
                },
                {
                    name: 'position',
                    description: 'Le sens de la position',
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    choices: [
                        {
                            name: 'Avant',
                            value: 'before'
                        },
                        {
                            name: 'Après',
                            value: 'after'
                        }
                    ]
                },
                {
                    name: 'rapport',
                    description: "Musique à côté de laquelle vous voulez qu'elle soit",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true
                }
            ]
        },
        {
            name: 'mélanger',
            description: "Mélange la liste de lecture",
            type: ApplicationCommandOptionType.Subcommand
        }
    ]
}).setChatInputRun(async ({ interaction, options }) => {
    const cmd = options.getSubcommand();
    const node = player.nodes.get(interaction.guild);

    if (cmd === 'mélanger') {
        node.tracks.shuffle()
        
        interaction.reply({
            embeds: [shuffled(interaction.user)]
        }).catch(log4js.trace)
    }
    if (cmd === 'déplacer') {
        const selected = options.getString('musique');
        const sens = options.getString('position') as 'before' | 'after';
        const rapport = options.getString('rapport');

        if (selected === rapport)
            return interaction.reply({ ephemeral: true, embeds: [moveSameSong(interaction.user)] }).catch(log4js.trace);

        const sTrack = node.tracks.find((x) => x.id === selected);
        const rTrack = node.tracks.find((x) => x.id === rapport);

        const pos = node.tracks.toArray().indexOf(rTrack);

        node.moveTrack(sTrack, pos + (sens === 'after' ? 1 : 0));

        interaction
            .reply({
                embeds: [moved(interaction.user, sTrack)]
            })
            .catch(log4js.trace);
    }
    if (cmd === 'recommencer') {
        const current = node.currentTrack;

        node.addTrack(current);
        const res = node.node.skip();

        if (!res)
            return interaction
                .reply({
                    embeds: [error(interaction.user)],
                    ephemeral: true
                })
                .catch(log4js.trace);

        interaction
            .reply({
                embeds: [
                    play(
                        interaction.user,
                        current,
                        interaction.guild.members?.me?.voice?.channel as VoiceChannel,
                        false
                    )
                ]
            })
            .catch(log4js.trace);
    }
    if (cmd === 'passer') {
        const next = node.node.queue.tracks.toArray()[0];
        node.node.skip();

        interaction
            .reply({
                embeds: [skipped(interaction.user, next)]
            })
            .catch(log4js.trace);
    }
    if (cmd === 'retirer') {
        const musicId = options.getString('musique');
        const res = node.removeTrack(musicId);

        if (!res) {
            log4js.trace(
                `La musique n'a pas été trouvée dans la playlist (elle n'a pas pu être retirée)\nconst res = player.nodes.get(interaction.guild).removeTrack(musicId)\n${new Array(
                    47
                ).fill('^')}\nServeur : ${interaction.guild.name} (${interaction.guild.id})\nMusique : ${musicId}`
            );
            return interaction
                .reply({
                    embeds: [error(interaction.user)]
                })
                .catch(log4js.trace);
        }

        interaction
            .reply({
                embeds: [trackRemoved(interaction.user, res)]
            })
            .catch(log4js.trace);
    }
});
