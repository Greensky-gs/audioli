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
import {
    cancel,
    emptyPlaylist,
    multipleTracks,
    noTracks,
    noVoiceChannel,
    notADJ,
    play,
    playPlaylistFirstNotFound,
    playlistPlayed
} from '../contents/embeds';
import player from '../cache/player';
import { resize, row, shuffle as shuffleArray } from '../utils/toolbox';
import configs from '../cache/configs';
import { Track } from 'discord-player';
import { compareTwoStrings } from 'string-similarity';
import playlists from '../cache/playlists';
import initiations from '../cache/initiations';
import { DJPermLevel } from '../typings/types';
import djs from '../cache/djs';

export default new AmethystCommand({
    name: 'jouer',
    description: 'Joue une musique',
    preconditions: [preconditions.GuildOnly],
    options: [
        {
            name: 'musique',
            description: 'Joue une musique',
            type: ApplicationCommandOptionType.Subcommand,
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
        },
        {
            name: 'playlist',
            description: 'Joue une playlist',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'playlist',
                    description: 'Playlist que vous voulez jouer',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true
                },
                {
                    name: 'aléatoire',
                    description: 'Joue la playlist en mode aléatoire',
                    required: false,
                    type: ApplicationCommandOptionType.String,
                    choices: [
                        {
                            name: 'Oui',
                            value: 'yes'
                        },
                        {
                            name: 'Non',
                            value: 'non'
                        }
                    ]
                },
                {
                    name: 'salon',
                    description: 'Salon dans lequel vous voulez jouer la musique',
                    required: false,
                    type: ApplicationCommandOptionType.Channel,
                    channelTypes: [ChannelType.GuildVoice]
                }
            ]
        }
    ]
}).setChatInputRun(async ({ interaction, client, options }) => {
    const cmd = options.getSubcommand();

    const initiated = initiations.get(interaction.guild.id);
    if (initiated) {
        const permLevel =
            interaction.guild.ownerId === initiated.id
                ? DJPermLevel.Owner
                : initiated.wasDj
                ? DJPermLevel.DJ
                : initiated.wasAdmin
                ? DJPermLevel.Admin
                : DJPermLevel.everyone;
        const userPermLevel =
            interaction.guild.ownerId === interaction.user.id
                ? DJPermLevel.Owner
                : djs.isDj(interaction.guild, interaction.member as GuildMember)
                ? DJPermLevel.DJ
                : (interaction.member as GuildMember).permissions.has('Administrator')
                ? DJPermLevel.Admin
                : DJPermLevel.everyone;

        if (permLevel >= userPermLevel && (permLevel === userPermLevel ? permLevel !== DJPermLevel.Owner : true)) {
            return interaction
                .reply({
                    embeds: [notADJ(interaction.user)],
                    ephemeral: true
                })
                .catch(log4js.trace);
        }
    }

    if (cmd === 'musique') {
        const musicSearch = options.getString('musique');
        const author = options.getString('auteur');
        const autoSelectOption = options.getString('sélection');
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
        const auto =
            (autoSelectOption ? autoSelectOption === 'auto' : undefined) ??
            configs.getconfig(interaction.guild.id, 'autoSelect');

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
                    values[b.id].authorRate +
                    values[b.id].titleRate -
                    (values[a.id].authorRate + values[b.id].titleRate)
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
                                    res.tracks.slice(0, 24).map((tr) => ({
                                        label: resize(tr.title, 100),
                                        description: resize(tr.author ?? 'Auteur inconnu', 100),
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

            initiations.set(interaction.guild.id, {
                id: interaction.user.id,
                wasDj: djs.isDj(interaction.guild, interaction.member as GuildMember),
                wasAdmin: (interaction.member as GuildMember).permissions.has('Administrator')
            });
        }

        interaction
            .editReply({
                embeds: [play(interaction.user, choice, channel as VoiceChannel, playing)],
                components: []
            })
            .catch(log4js.trace);
    }

    if (cmd === 'playlist') {
        const playlist = playlists.getAbsolute(parseInt(options.getString('playlist')));
        const channel =
            (interaction?.member as GuildMember)?.voice?.channel ??
            (options.getChannel('salon') as VoiceChannel) ??
            interaction.guild.members?.me.voice?.channel;
        const shuffle = options.getString('aléatoire') === 'yes';

        if (!channel)
            return interaction
                .reply({
                    embeds: [noVoiceChannel(interaction.user)],
                    ephemeral: true
                })
                .catch(log4js.trace);
        if (playlist.songs.length === 0)
            return interaction
                .reply({
                    embeds: [emptyPlaylist(interaction.user)],
                    ephemeral: true
                })
                .catch(log4js.trace);

        const songs = shuffle ? shuffleArray(playlist.songs) : playlist.songs;

        await interaction.deferReply().catch(log4js.trace);
        const playing = !!player.nodes.get(interaction.guild) ? player.nodes.get(interaction.guild).isPlaying() : false;

        if (!playing) {
            const first = await player.search(songs[0].url).catch(log4js.trace);
            if (!first || !first?.tracks[0])
                return interaction
                    .editReply({
                        embeds: [playPlaylistFirstNotFound(interaction.user)]
                    })
                    .catch(log4js.trace);

            player
                .play(channel as VoiceChannel, first.tracks[0], {
                    nodeOptions: {
                        volume: configs.getconfig(interaction.guild.id, 'volume'),
                        leaveOnEmpty: true,
                        leaveOnEmptyCooldown: 120000,
                        leaveOnEnd: false,
                        leaveOnStop: false
                    }
                })
                .catch(log4js.trace);
            initiations.set(interaction.guild.id, {
                id: interaction.user.id,
                wasDj: djs.isDj(interaction.guild, interaction.member as GuildMember),
                wasAdmin: (interaction.member as GuildMember).permissions.has('Administrator')
            });
        }

        const handleQueue = async () => {
            const _list: Track[] = [];
            const promisifier = (song: { id: string; title: string; url: string }) => {
                return new Promise(async (resolve) => {
                    const details = await player.search(song.url).catch(log4js.trace);
                    if (!details || !details?.tracks[0]) return resolve(null);

                    _list.push(details.tracks[0]);
                    return resolve(true);
                });
            };
            const list = () => {
                return _list.filter((x) => !!x && (playing ? true : x.url !== songs[0].url));
            };

            await Promise.all(songs.map(promisifier));

            if (list().length === 0) return;
            player.nodes.get(interaction.guild).addTrack(list());
        };
        handleQueue();

        interaction
            .editReply({
                embeds: [playlistPlayed(interaction.user, channel as VoiceChannel, playing)]
            })
            .catch(log4js.trace);
    }
});
