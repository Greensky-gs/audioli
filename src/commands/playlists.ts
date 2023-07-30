import { AmethystCommand, log4js, waitForInteraction } from 'amethystjs';
import {
    ApplicationCommandOptionType,
    ChannelType,
    ColorResolvable,
    ComponentType,
    Message,
    StringSelectMenuBuilder,
    TextChannel
} from 'discord.js';
import playlists from '../cache/playlists';
import {
    askEmoji,
    cancel,
    classic,
    created,
    deleted,
    error,
    playlistAlreadyExists,
    playlistVisibilityConflict,
    unexistingPlaylist,
    wait,
    visibility as visibilityEmbed,
    userBot,
    shareSelf,
    alreadyShared,
    sharedWith,
    notShared,
    unshared,
    noTracks,
    multipleTracks,
    songAdded,
    songNotInPlaylist,
    songRemoved,
    moveSameSong,
    moved
} from '../contents/embeds';
import { data, msToSentence, numerize, pingUser, plurial, resize, row, yesNoRow } from '../utils/toolbox';
import { ButtonIds } from '../typings/buttons';
import GetEmoji from '../processes/GetEmoji';
import player from '../cache/player';
import { Track } from 'discord-player';
import configs from '../cache/configs';
import { compareTwoStrings } from 'string-similarity';

export default new AmethystCommand({
    name: 'playlists',
    description: 'Gère vos playlists',
    options: [
        {
            name: 'créer',
            description: 'Créer une playlist',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'nom',
                    description: 'Nom de la playlist',
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: 'supprimer',
            description: 'Supprime une playlist',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'playlist',
                    description: 'Playlist que vous voulez supprimer',
                    required: true,
                    autocomplete: true,
                    type: ApplicationCommandOptionType.String
                }
            ]
        },
        {
            name: 'visibilité',
            description: 'Change la visibilité de la playlist',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'playlist',
                    description: 'Playlist dont vous voulez modifier la visibilité',
                    required: true,
                    autocomplete: true,
                    type: ApplicationCommandOptionType.String
                },
                {
                    name: 'visibilité',
                    description: 'Visibilité de la playlist',
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    choices: [
                        {
                            name: 'Publique',
                            value: 'public'
                        },
                        {
                            name: 'Privée',
                            value: 'private'
                        }
                    ]
                }
            ]
        },
        {
            name: 'voir',
            description: 'Consulte une playlist',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'playlist',
                    description: 'Playlist que vous voulez consulter',
                    required: true,
                    autocomplete: true,
                    type: ApplicationCommandOptionType.String
                }
            ]
        },
        {
            name: 'partager',
            description: "Partage une playlist avec quelqu'un",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'playlist',
                    description: 'Playlist que vous voulez partager',
                    required: true,
                    autocomplete: true,
                    type: ApplicationCommandOptionType.String
                },
                {
                    name: 'utilisateur',
                    description: 'Utilisateur avec lequel vous voulez partager la playlist',
                    required: true,
                    type: ApplicationCommandOptionType.User
                }
            ]
        },
        {
            name: 'départager',
            description: "Enlève le partage d'une playlist avec quelqu'un",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'playlist',
                    description: 'Playlist que vous voulez départager',
                    required: true,
                    autocomplete: true,
                    type: ApplicationCommandOptionType.String
                },
                {
                    name: 'utilisateur',
                    description: 'Utilisateur que vous voulez retirer de la playlist',
                    required: true,
                    type: ApplicationCommandOptionType.User
                }
            ]
        },
        {
            name: 'ajouter',
            description: 'Ajoute une musique à une playlist',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'playlist',
                    description: 'Playlist à laquelle vous voulez enlever une musique',
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    autocomplete: true
                },
                {
                    name: 'musique',
                    description: 'Musique que vous voulez ajouter',
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
            name: 'retirer',
            description: 'Retire une musique de la playlist',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'playlist',
                    description: 'Playlist dont vous voulez retirer une chanson',
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    autocomplete: true
                },
                {
                    name: 'musique',
                    description: 'Musique que vous voulez retirer',
                    type: ApplicationCommandOptionType.String,
                    autocomplete: true,
                    required: true
                }
            ]
        },
        {
            name: 'déplacer',
            description: "Déplace une musique dans la playlist",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'playlist',
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "Playlist que vous voulez modifier",
                    autocomplete: true
                },
                {
                    name: 'musique',
                    description: "Musique que vous voulez déplacer",
                    autocomplete: true,
                    required: true,
                    type: ApplicationCommandOptionType.String
                },
                {
                    name: 'position',
                    description: "Position par rapport à l'autre musique",
                    type: ApplicationCommandOptionType.String,
                    required: true,
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
                    description: "Musique par rapport à laquelle vous voulez la positionner",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true
                }
            ]
        }
    ]
}).setChatInputRun(async ({ interaction, options }) => {
    const cmd = options.getSubcommand();

    if (cmd === 'déplacer') {
        const playlist = playlists.getAbsolute(parseInt(options.getString('playlist')))
        const musicId = options.getString('musique')
        const rapportId = options.getString('rapport')
        const direction = options.getString('position') as 'before' | 'after';

        if ([musicId, rapportId].some(x => !playlist.songs.find(y => y.id === x))) return interaction.reply({
            embeds: [ songNotInPlaylist(interaction.user) ],
            ephemeral: true
        }).catch(log4js.trace)

        const music = playlist.songs.find(x => x.id === musicId)
        const rapport = playlist.songs.find(x => x.id === rapportId)

        if (musicId === rapportId) return interaction.reply({
            embeds: [ moveSameSong(interaction.user) ],
            ephemeral: true
        }).catch(log4js.trace)

        playlists.move({
            playlist: playlist.id,
            direction,
            song: music.id,
            rapport: rapport.id
        })

        interaction.reply({
            embeds: [ moved(interaction.user, music as unknown as Track) ]
        }).catch(log4js.trace)
    }
    if (cmd === 'créer') {
        const name = options.getString('nom');

        if (playlists.getUserLists(interaction.user.id).find((x) => x.name === name))
            return interaction
                .reply({
                    embeds: [playlistAlreadyExists(interaction.user, name)],
                    ephemeral: true
                })
                .catch(log4js.trace);
        const msg = (await interaction
            .reply({
                embeds: [
                    classic(interaction.user, { question: true })
                        .setTitle('Émoji')
                        .setDescription(`Souhaitez-vous mettre un émoji sur votre playlist ?`)
                ],
                components: [yesNoRow()],
                fetchReply: true
            })
            .catch(log4js.trace)) as Message<true>;
        if (!msg)
            return interaction
                .reply({
                    embeds: [error(interaction.user)]
                })
                .catch(log4js.trace);

        const emojiRes = await waitForInteraction({
            componentType: ComponentType.Button,
            message: msg,
            user: interaction.user
        }).catch(log4js.trace);
        if (!emojiRes) return interaction.editReply({ embeds: [cancel()], components: [] }).catch(log4js.trace);

        let emoji: string = null;
        if (emojiRes.customId === ButtonIds.Yes) {
            interaction
                .editReply({
                    embeds: [askEmoji(interaction.user)],
                    components: []
                })
                .catch(log4js.trace);
            const selected = await GetEmoji.process({
                user: interaction.user,
                channel: interaction.channel as TextChannel,
                allowCancel: true
            }).catch(log4js.trace);

            if (!selected || selected === 'cancel' || selected === "time's up")
                return interaction
                    .editReply({
                        embeds: [cancel()]
                    })
                    .catch(log4js.trace);
            emoji = selected;
        }
        await interaction
            .editReply({
                embeds: [wait(interaction.user)],
                components: []
            })
            .catch(log4js.trace);
        const list = playlists
            .createList({
                user: interaction.user.id,
                songs: [],
                name,
                emoji
            })
            .catch(log4js.trace);
        if (!list) {
            log4js.trace(
                `Playlist not created.\nData: ${JSON.stringify(
                    { name, user: interaction.user.id, songs: [] },
                    null,
                    4
                )}`
            );
            return interaction
                .editReply({
                    embeds: [error(interaction.user)]
                })
                .catch(log4js.trace);
        }

        interaction
            .editReply({
                embeds: [created(interaction.user, name)]
            })
            .catch(log4js.trace);
    }
    if (cmd === 'supprimer') {
        const playlist = playlists.getAbsolute(parseInt(options.getString('playlist')));
        if (!playlist)
            return interaction
                .reply({
                    embeds: [unexistingPlaylist(interaction.user)],
                    ephemeral: true
                })
                .catch(log4js.trace);

        const confirmationMsg = (await interaction
            .reply({
                embeds: [
                    classic(interaction.user, { question: true })
                        .setTitle('Suppression')
                        .setDescription(
                            `Êtes-vous sûr de supprimer la playlist ${playlist.emoji ? playlist.emoji : ''} ${
                                playlist.name
                            } ?`
                        )
                ],
                components: [yesNoRow()],
                fetchReply: true
            })
            .catch(log4js.trace)) as Message<true>;
        const confirmation = await waitForInteraction({
            componentType: ComponentType.Button,
            user: interaction.user,
            message: confirmationMsg
        }).catch(log4js.trace);
        if (!confirmation || confirmation.customId === ButtonIds.No)
            return interaction
                .editReply({
                    embeds: [cancel()],
                    components: []
                })
                .catch(log4js.trace);

        await interaction
            .editReply({
                embeds: [wait(interaction.user)],
                components: []
            })
            .catch(log4js.trace);

        await playlists.deletePlaylist(playlist.id).catch(log4js.trace);
        interaction
            .editReply({
                embeds: [deleted(interaction.user, playlist.name)]
            })
            .catch(log4js.trace);
    }
    if (cmd === 'visibilité') {
        const playlist = playlists.getAbsolute(parseInt(options.getString('playlist')));
        const visibility = options.getString('visibilité') as 'public' | 'private';

        const method = visibility === 'private' ? 'makePrivate' : 'makePublic';
        const res = playlists[method](playlist.id);

        if (res === 'unexisting')
            return interaction
                .reply({
                    embeds: [unexistingPlaylist(interaction.user, playlist?.name)],
                    ephemeral: true
                })
                .catch(log4js.trace);
        if (res === 'already public' || res === 'not public')
            return interaction
                .reply({
                    embeds: [playlistVisibilityConflict(interaction.user, playlist)],
                    ephemeral: true
                })
                .catch(log4js.trace);

        interaction
            .reply({
                embeds: [visibilityEmbed(interaction.user, visibility)]
            })
            .catch(log4js.trace);
    }
    if (cmd === 'voir') {
        const playlist = playlists.getAbsolute(parseInt(options.getString('playlist')));

        const embed = classic(interaction.user, { accentColor: true })
            .setTitle(`Playlist`)
            .setDescription(
                resize(
                    `${playlist.emoji ? playlist.emoji + ' ' : ''}${playlist.name}${
                        playlist.user_id !== interaction.user.id ? ` (par ${pingUser(playlist.user_id)})` : ''
                    }\n${numerize(playlist.songs.length)} musique${plurial(playlist.songs)}${
                        playlist.songs.length > 0 ? `\n${playlist.songs.map((x) => `- ${x.title}`).join('\n')}` : ''
                    }`
                )
            )
            .setColor(data('colors', 'informations') as ColorResolvable);

        await interaction
            .reply({
                embeds: [embed]
            })
            .catch(log4js.trace);
        if (playlist.songs.length === 0) return;

        const _infos: Track[] = [];
        const promisifier = async (song: { id: string; title: string; url: string }) => {
            return new Promise(async(resolve) => {
                const details = await player.search(song.url).catch(log4js.trace);
                if (!details) return resolve(null);
    
                _infos.push(details?.tracks[0]);
                return resolve(details);
            })
        };
        await Promise.all(playlist.songs.slice(0, 29).map(promisifier));

        const infos = () => {
            return _infos.filter((x) => !!x);
        };
        if (infos().length > 0) {
            embed.setThumbnail(infos().find(x => x.url === playlist.songs[0].url)?.thumbnail ?? interaction.client.user.displayAvatarURL());
        }

        if (infos().length > 0) {
            embed.addFields({
                name: 'Durée (des 30 premiers morceaux)',
                value:
                    msToSentence(
                        infos()
                            .map((x) => x.durationMS)
                            .reduce((a, b) => a + b, 0)
                    ) ?? 'N/A',
                inline: false
            });
        }

        interaction
            .editReply({
                embeds: [embed]
            })
            .catch(log4js.trace);
    }
    if (cmd === 'partager') {
        const playlist = playlists.getAbsolute(parseInt(options.getString('playlist')));
        const user = options.getUser('utilisateur');

        if (user.bot)
            return interaction
                .reply({ embeds: [userBot(interaction.user, user)], ephemeral: true })
                .catch(log4js.trace);
        if (user.id === interaction.user.id)
            return interaction.reply({ embeds: [shareSelf(interaction.user)], ephemeral: true }).catch(log4js.trace);
        if (playlists.sharedWith(playlist.id, user.id))
            return interaction
                .reply({ embeds: [alreadyShared(interaction.user, user)], ephemeral: true })
                .catch(log4js.trace);

        playlists.shareWith(playlist.id, user.id);

        interaction
            .reply({
                embeds: [sharedWith(interaction.user, user)]
            })
            .catch(log4js.trace);
    }
    if (cmd === 'départager') {
        const playlist = playlists.getAbsolute(parseInt(options.getString('playlist')));
        const user = options.getUser('utilisateur');

        if (user.bot)
            return interaction
                .reply({ embeds: [userBot(interaction.user, user)], ephemeral: true })
                .catch(log4js.trace);
        if (user.id === interaction.user.id)
            return interaction.reply({ embeds: [shareSelf(interaction.user)], ephemeral: true }).catch(log4js.trace);
        if (!playlists.sharedWith(playlist.id, user.id))
            return interaction
                .reply({ embeds: [notShared(interaction.user, user)], ephemeral: true })
                .catch(log4js.trace);

        playlists.unshare(playlist.id, user.id);

        interaction
            .reply({
                embeds: [unshared(interaction.user, user)]
            })
            .catch(log4js.trace);
    }
    if (cmd === 'ajouter') {
        const musicSearch = options.getString('musique');
        const author = options.getString('auteur');
        const autoSelectOption = options.getString('sélection');
        const playlist = playlists.getAbsolute(parseInt(options.getString('playlist')));

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

        playlists.addToPlaylist({
            userId: interaction.user.id,
            playlist: playlist.id,
            song: {
                id: choice.id,
                title: choice.title,
                url: choice.url
            }
        });

        interaction
            .editReply({
                embeds: [songAdded(interaction.user, choice)],
                components: []
            })
            .catch(log4js.trace);
    }
    if (cmd === 'retirer') {
        const playlist = playlists.getAbsolute(parseInt(options.getString('playlist')))
        const songId = options.getString('musique')

        if (!playlist) return interaction.reply({
            embeds: [error(interaction.user)],
            ephemeral: true
        }).catch(log4js.trace)

        if (!playlist.songs.find(x => x.id === songId)) return interaction.reply({
            embeds: [ songNotInPlaylist(interaction.user) ],
            ephemeral: true
        }).catch(log4js.trace)

        playlists.removeFromPlaylist({
            userId: interaction.user.id,
            playlist: playlist.id,
            song: songId
        });

        interaction.reply({
            embeds: [ songRemoved(interaction.user) ]
        }).catch(log4js.trace)
    }
});
