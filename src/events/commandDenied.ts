import { AmethystEvent, commandDeniedCode, log4js } from "amethystjs";
import { guildOnly, ownerOnly } from '../contents/embeds'
import * as embeds from '../contents/embeds';
import { EmbedBuilder, User } from "discord.js";

export default new AmethystEvent('commandDenied', (command, reason) => {
    if (command.interaction) {
        const codes: { x: keyof typeof commandDeniedCode; embed: (user: User) => EmbedBuilder }[] = [
            { x: 'GuildOnly', embed: guildOnly },
            { x: 'OwnerOnly', embed: ownerOnly }
        ]

        if (codes.find(x => x.x === reason.code)) return command.interaction.reply({ embeds: [ codes.find(x => x.x === reason.code)?.embed(command.interaction.user) as EmbedBuilder ] }).catch(log4js.trace)

        command.interaction.reply({
            embeds: [ embeds[reason.metadata?.embedCode](command.interaction.user) ]
        }).catch(log4js.trace)
    }
})