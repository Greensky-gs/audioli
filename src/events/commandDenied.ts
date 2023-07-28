import { AmethystEvent, commandDeniedCode, log4js } from 'amethystjs';
import { guildOnly, ownerOnly } from '../contents/embeds';
import * as embeds from '../contents/embeds';
import { EmbedBuilder, User } from 'discord.js';

export default new AmethystEvent('commandDenied', (command, reason) => {
    if (command.interaction) {
        const codes: { x: keyof typeof commandDeniedCode; embed: (user: User) => EmbedBuilder }[] = [
            { x: 'GuildOnly', embed: guildOnly },
            { x: 'OwnerOnly', embed: ownerOnly }
        ];

        if (codes.find((x) => x.x === reason.code))
            return command.interaction
                .reply({
                    embeds: [codes.find((x) => x.x === reason.code)?.embed(command.interaction.user) as EmbedBuilder]
                })
                .catch(log4js.trace);

        if (!!embeds[reason.metadata?.embedCode]) {
            command.interaction
                .reply({
                    embeds: [embeds[reason.metadata?.embedCode](command.interaction.user)]
                })
                .catch(log4js.trace);
        } else {
            log4js.trace(
                `Pas d'embed trouvé pour la dénietion de la commande ${command.command.options.name}\nPrécondition: ${
                    reason.message
                } (message) ${reason.code} (code) ${JSON.stringify(reason.metadata ?? {}, null, 4)} (metadata)`
            );
            command.interaction
                .reply({
                    embeds: [embeds.error(command.interaction.user)]
                })
                .catch(log4js.trace);
        }
    }
});
