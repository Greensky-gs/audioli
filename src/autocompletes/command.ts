import { AutocompleteListener } from "amethystjs";

export default new AutocompleteListener({
    commandName: [{ commandName: 'aide' }],
    listenerName: 'commande',
    run: ({ focusedValue, client }) => {
        return client.chatInputCommands.map(x => ({ name: x.options.name, value: x.options.name })).filter(x => x.name.toLowerCase().includes(focusedValue.toLowerCase()) || focusedValue.toLowerCase().includes(x.name.toLowerCase())).slice(0, 24)
    }
})