import { AutocompleteListener } from "amethystjs";
import player from "../cache/player";
import { resize } from "../utils/toolbox";

export default new AutocompleteListener({
    listenerName: 'Song from playlist',
    commandName: [{ commandName: 'liste', optionName: 'musique' }, {commandName: 'liste', optionName: 'rapport'}],
    run: ({ interaction, focusedValue }) => {
        const queue = player.nodes.get(interaction.guild)?.node?.queue?.tracks
        if (!queue) return [];

        return queue.filter(x => x.title.toLowerCase().includes(focusedValue.toLowerCase()) || focusedValue.toLowerCase().includes(x.title.toLowerCase()) || focusedValue.toLowerCase().includes(x.author.toLowerCase()) || x.author.toLowerCase().includes(focusedValue.toLowerCase())).slice(0, 24).map(x => ({ name: resize(`${x.title} - ${x.author}`, 100), value: x.id }))
    }
})