import { AutocompleteListener } from 'amethystjs';
import playlists from '../cache/playlists';

export default new AutocompleteListener({
    listenerName: 'remove song from playlist',
    commandName: [{ commandName: 'playlists', optionName: 'musique' }],
    run: ({ focusedValue, interaction }) => {
        const allSongs = playlists
            .getUserLists(interaction.user.id)
            .map((x) => x.songs)
            .flat();
        const available = allSongs.filter(
            (x) =>
                x.title.toLowerCase().includes(focusedValue.toLowerCase()) ||
                focusedValue.toLowerCase().includes(x.title.toLowerCase())
        );
        const filtered = [...new Set(available.map((x) => x.id))]
            .map((x) => ({ id: x, title: available.find((y) => y.id === x).title }))
            .map((x) => ({ name: x.title, value: x.id }));

        return filtered.slice(0, 24);
    }
});
