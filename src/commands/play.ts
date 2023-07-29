import { AmethystCommand, log4js, preconditions, waitForInteraction } from 'amethystjs';
import isDj from '../preconditions/isDj';
import {
    ApplicationCommandOptionType,
    ChannelType,
    ComponentType,
    GuildMember,
    Message,
    StringSelectMenuBuilder,
    VoiceChannel
} from 'discord.js';
import { cancel, multipleTracks, noTracks, noVoiceChannel, play } from '../contents/embeds';
import player from '../cache/player';
import { row } from '../utils/toolbox';
import configs from '../cache/configs';
import { Track } from 'discord-player';
import { compareTwoStrings } from 'string-similarity';

export default new AmethystCommand({
    name: 'jouer',
    description: 'Joue une musique',
    preconditions: [preconditions.GuildOnly, isDj],
    options: [
        {
            name: 'musique',
            description: 'Musique que vous voulez jouer',
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'auteur',
            description: 'Auteur de la musique',
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: 'salon',
            description: 'Salon dans lequel vous voulez que je joue de la musique',
            required: false,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildVoice]
        },
        {
            name: 'sélection',
            description: 'Vous laisse faire la sélection si elle doit se faire',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                {
                    name: 'Sélection automatique',
                    value: 'auto'
                },
                {
                    name: 'Sélection manuelle',
                    value: 'user'
                }
            ]
        }
    ]
}).setChatInputRun(async ({ interaction, client, options }) => {
    const musicSearch = options.getString('musique');
    const author = options.getString('auteur');
    const autoSelectOption = options.getString('sélection') === 'auto';
    const channel =
        (interaction?.member as GuildMember)?.voice?.channel ??
        (options.getChannel('salon') as VoiceChannel) ??
        interaction.guild.members?.me.voice?.channel;

    if (!channel)
        return interaction
            .reply({
                embeds: [noVoiceChannel(interaction.user)],
                ephemeral: true
            })
            .catch(log4js.trace);

    const msg = (await interaction.deferReply({ fetchReply: true }).catch(log4js.trace)) as Message<true>;
    const res = await player
        .search(musicSearch, {
            requestedBy: interaction.user,
            searchEngine: 'spotifySearch'
        })
        .catch(log4js.trace);

    if (!res || res.isEmpty())
        return interaction
            .editReply({
                embeds: [noTracks(interaction.user)]
            })
            .catch(log4js.trace);

    let choice = res.tracks[0];
    const auto = autoSelectOption ?? configs.getconfig(interaction.guild.id, 'autoSelect');

    if (auto && res.tracks.length > 1) {
        const values = {};
        res.tracks.forEach((x: Track) => {
            values[x.id] = {
                titleRate: compareTwoStrings(musicSearch, x.title),
                authorRate: author ? compareTwoStrings(author, x.author) : 1
            };
        });
        choice = res.tracks.sort(
            (a, b) =>
                values[b.id].authorRate + values[b.id].titleRate - (values[a.id].authorRate + values[b.id].titleRate)
        )[0];
    }
    if (res.tracks.length > 1 && !auto) {
        await interaction
            .editReply({
                embeds: [multipleTracks(interaction.user)],
                components: [
                    row(
                        new StringSelectMenuBuilder()
                            .setCustomId('select.multiple-tracks')
                            .setMaxValues(1)
                            .setPlaceholder('Choisissez une musique')
                            .setOptions(
                                res.tracks
                                    .slice(0, 24)
                                    .map((tr) => ({
                                        label: tr.title,
                                        description: tr.author ?? 'Auteur inconnu',
                                        value: tr.id
                                    }))
                            )
                    )
                ]
            })
            .catch(log4js.trace);

        const rep = await waitForInteraction({
            componentType: ComponentType.StringSelect,
            user: interaction.user,
            message: msg
        }).catch(log4js.trace);

        if (!rep)
            return interaction
                .editReply({
                    embeds: [cancel()],
                    components: []
                })
                .catch(log4js.trace);

        choice = res.tracks.find((x) => x.id === rep.values[0]);
    }

    const playing = !!player.nodes.get(interaction.guild) ? player.nodes.get(interaction.guild).isPlaying() : false;
    if (playing) {
        player.nodes.get(interaction.guild).addTrack(choice);
    } else {
        player
            .play(channel as VoiceChannel, choice, {
                nodeOptions: {
                    volume: configs.getconfig(interaction.guild.id, 'volume'),
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 120000,
                    leaveOnEnd: false,
                    leaveOnStop: false
                }
            })
            .catch(log4js.trace);
    }

    interaction
        .editReply({
            embeds: [play(interaction.user, choice, channel as VoiceChannel, playing)],
            components: []
        })
        .catch(log4js.trace);
});
