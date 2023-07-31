import { ButtonHandler, log4js } from 'amethystjs';
import { ButtonIds } from '../typings/buttons';
import playlists from '../cache/playlists';
import { noPlaylist, noTracks, songAdded, unexistingPlaylist } from '../contents/embeds';
import { ModalBuilder, RepliableInteraction, TextInputBuilder, TextInputStyle } from 'discord.js';
import { row } from '../utils/toolbox';
import { compareTwoStrings, findBestMatch } from 'string-similarity';
import player from '../cache/player';

export default new ButtonHandler({
    customId: ButtonIds.AddToPlaylist
}).setRun(async ({ button, message, user }) => {
    const url = message.embeds[0].url;
    const userPlaylists = playlists.getUserLists(user.id);

    if (!userPlaylists.size)
        return button
            .reply({
                embeds: [noPlaylist(user)],
                ephemeral: true
            })
            .catch(log4js.trace);

    let playlist: number = userPlaylists.first().id;
    let interaction: RepliableInteraction = button;

    if (userPlaylists.size > 1) {
        const modal = new ModalBuilder()
            .setCustomId('addToPlaylistModal')
            .setTitle('Playlist')
            .setComponents(
                row(
                    new TextInputBuilder()
                        .setLabel('Nom de la playlist')
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short)
                        .setCustomId('playlistName')
                )
            );

        await button.showModal(modal).catch(log4js.trace);
        const rep = await button
            .awaitModalSubmit({
                time: 120000
            })
            .catch(log4js.trace);
        if (!rep) return;

        const name = rep.fields.getTextInputValue('playlistName');
        const playlistTest = userPlaylists.find(
            (y) =>
                y.name ===
                findBestMatch(
                    name,
                    userPlaylists.map((x) => x.name)
                ).bestMatch.target
        );

        if (!playlistTest)
            return rep
                .reply({
                    embeds: [unexistingPlaylist(user)],
                    ephemeral: true
                })
                .catch(log4js.trace);

        playlist = playlistTest.id;
        interaction = rep;
    }

    await interaction.deferReply({ ephemeral: true }).catch(log4js.trace);
    const res = await player.search(url).catch(log4js.trace);

    if (!res) return interaction.editReply({ embeds: [noTracks(user)] }).catch(log4js.trace);

    playlists.addToPlaylist({
        userId: user.id,
        playlist,
        song: { id: res.tracks[0].id, url, title: res.tracks[0].title }
    });
    interaction
        .editReply({
            embeds: [songAdded(user, res.tracks[0])]
        })
        .catch(log4js.trace);
});
