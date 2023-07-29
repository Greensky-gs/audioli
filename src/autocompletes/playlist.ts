import { AutocompleteListener } from "amethystjs";
import { ApplicationCommandOptionType } from "discord.js";
import playlists from "../cache/playlists";
import { compareTwoStrings } from "string-similarity";
import { resize } from "../utils/toolbox";

export default new AutocompleteListener({
    listenerName: 'playlist',
    commandName: [{ commandName: 'jouer', optionName: 'playlist' }, { commandName: 'playlists', optionName: 'playlist' }],
    run: ({ focusedValue, interaction }) => {
        const cmd = interaction.options.data.find(x => x.type === ApplicationCommandOptionType.Subcommand)?.value;
        const command = interaction.commandName
        const shared = command === 'playlists' ? cmd === 'supprimer' ? false : cmd === 'ajouter' ? false : cmd === 'retirer' ? false : cmd === 'partager' ? false : cmd === 'visibilité' ? false : true : true;

        const lists = playlists.getUserLists(interaction.user.id, { publics: shared, shared })
        return lists.filter(x => (compareTwoStrings(x.name.toLowerCase(), focusedValue.toLowerCase()) > 0.7) || ( x.name.toLowerCase().includes(focusedValue.toLowerCase()) || focusedValue.toLowerCase().includes(x.name.toLowerCase()) )).toJSON().slice(0, 24).map(x => ({ name: resize(`${x.name}${x.shared_with.includes(interaction.user.id) ? ' (partagée)' : x.public ? ' (publique)' : ''}`, 100), value: x.id.toString() }))
    }
})