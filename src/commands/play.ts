import { AmethystCommand, log4js, preconditions, waitForInteraction } from 'amethystjs';
import isDj from '../preconditions/isDj';
import { ApplicationCommandOptionType, ChannelType, ComponentType, GuildMember, Message, StringSelectMenuBuilder, VoiceChannel } from 'discord.js';
import { cancel, multipleTracks, noTracks, noVoiceChannel, play } from '../contents/embeds';
import player from '../cache/player';
import { row } from '../utils/toolbox';

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
            name: 'salon',
            description: 'Salon dans lequel vous voulez que je joue de la musique',
            required: false,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildVoice]
        }
    ]
}).setChatInputRun(async ({ interaction, client, options }) => {
    const musicSearch = options.getString('musique');
    const channel =
        (interaction?.member as GuildMember)?.voice?.channel ??
        (options.getChannel('salon') as VoiceChannel) ??
        interaction.guild.members?.me.voice?.channel;

    if (!channel) return interaction.reply({
        embeds: [ noVoiceChannel(interaction.user) ],
        ephemeral: true
    }).catch(log4js.trace)

    const msg = await interaction.deferReply({ fetchReply: true }).catch(log4js.trace) as Message<true>;
    const res = await player.search(musicSearch, {
        requestedBy: interaction.user,
        searchEngine: 'spotifySearch'
    }).catch(log4js.trace)

    if (!res || res.isEmpty()) return interaction.editReply({
        embeds: [ noTracks(interaction.user) ]
    }).catch(log4js.trace)
    
    let choice = res.tracks[0];
    if (res.tracks.length > 1) {
        await interaction.editReply({
            embeds: [ multipleTracks(interaction.user) ],
            components: [row(new StringSelectMenuBuilder()
                .setCustomId('select.multiple-tracks')
                .setMaxValues(1)
                .setPlaceholder('Choisissez une musique')
                .setOptions(
                    res.tracks.slice(0, 24).map((tr) => ({ label: tr.title, description: tr.author ?? "Auteur inconnu", value: tr.id }))
                )
            )]
        }).catch(log4js.trace)

        const rep = await waitForInteraction({
            componentType: ComponentType.StringSelect,
            user: interaction.user,
            message: msg
        }).catch(log4js.trace)

        if (!rep) return interaction.editReply({
            embeds: [cancel()],
            components: []
        }).catch(log4js.trace)

        choice = res.tracks.find(x => x.id === rep.values[0])
    }

    const playing = !!player.nodes.get(interaction.guild) ? player.nodes.get(interaction.guild).isPlaying() : false;
    if (playing) {
        player.nodes.get(interaction.guild).addTrack(choice)
    } else {
        player.play(channel as VoiceChannel, choice, {
            nodeOptions: {
                volume: 85,
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 120000,
                leaveOnEnd: false,
                leaveOnStop: false
            }
        }).catch(log4js.trace)
    }

    interaction.editReply({
        embeds: [ play(interaction.user, choice, channel as VoiceChannel, playing) ],
        components: []
    }).catch(log4js.trace)
});
