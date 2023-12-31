import { AmethystEvent, commandDeniedCode, log4js } from 'amethystjs';
import { guildOnly, ownerOnly } from '../contents/embeds';
import * as embeds from '../contents/embeds';
import { EmbedBuilder, User } from 'discord.js';

export default new AmethystEvent('commandDenied', (command, reason) => {
    if (command.interaction) {
        const codes: { x: keyof typeof commandDeniedCode; embed: (user: User) => EmbedBuilder }[] = [
            { x: 'GuildOnly', embed: guildOnly },
            { x: 'OwnerOnly', embed: ownerOnly },
            { x: 'UnderCooldown', embed: embeds.underCooldown }
        ];

        if (reason.code === commandDeniedCode.UserMissingPerms) {
            return command.interaction
                .reply({
                    embeds: [embeds.missingPerms(command.interaction.user, reason.metadata.permissions.missing)],
                    ephemeral: true
                })
                .catch(log4js.trace);
        }

        if (codes.find((x) => commandDeniedCode[x.x] === reason.code))
            return command.interaction
                .reply({
                    embeds: [
                        codes
                            .find((x) => commandDeniedCode[x.x] === reason.code)
                            ?.embed(command.interaction.user) as EmbedBuilder
                    ],
                    ephemeral: true
                })
                .catch(log4js.trace);

        if (!!embeds[reason.metadata?.embedCode]) {
            command.interaction
                .reply({
                    embeds: [embeds[reason.metadata?.embedCode](command.interaction.user)],
                    ephemeral: true
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
