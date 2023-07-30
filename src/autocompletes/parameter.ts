import { AutocompleteListener } from 'amethystjs';
import configs from '../cache/configs';
import { getConfig } from '../utils/toolbox';
import { configKey } from '../typings/configs';

export default new AutocompleteListener({
    commandName: [{ commandName: 'paramètres' }],
    listenerName: 'paramètre',
    run: ({ focusedValue, interaction }) => {
        const list = Object.keys(configs.getConfigs(interaction.guild.id))
            .filter((x) => x !== 'guild_id')
            .map((x: configKey) => getConfig(x));

        return list
            .filter(
                (x) =>
                    x.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
                    focusedValue.toLowerCase().includes(x.name.toLowerCase()) ||
                    x.description.toLowerCase().includes(focusedValue.toLowerCase()) ||
                    focusedValue.toLowerCase().includes(x.description.toLowerCase())
            )
            .slice(0, 24)
            .map((x) => ({ name: x.name, value: x.id }));
    }
});
