import { AmethystCommand, AmethystPaginator, log4js, preconditions, waitForInteraction } from "amethystjs";
import { ApplicationCommandOptionType, ComponentType, EmbedBuilder, Message, Role, User } from "discord.js";
import djs from "../cache/djs";
import { alreadyDJRole, alreadyDJUser, cancel, classic, djAdded, djListMixedBase, djListQuestion, djListRolesBase, djListUsersBase, djMixMapper, djNoOptions, djRemoved, djRoleMapper, djUserMapper, emptyDjList, emptyRolesDJ, emptyUsersDJ, notDJRole, notDJUser, userBot } from "../contents/embeds";
import { button, numerize, row } from "../utils/toolbox";
import { djListType } from "../typings/database";
import { ButtonIds } from "../typings/buttons";

export default new AmethystCommand({
    name: 'dj',
    description: "Gère les DJ du serveur",
    preconditions: [preconditions.GuildOnly, preconditions.OwnerOnly],
    options: [
        {
            name: 'liste',
            description: "Liste des DJ du serveur",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'ajouter',
            description: 'Ajoute un rôle de DJ ou un DJ',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'dj',
                    description: "DJ que vous voulez ajouter",
                    required: false,
                    type: ApplicationCommandOptionType.User
                },
                {
                    name: 'rôle',
                    description: "Rôle que vous voulez ajouter",
                    type: ApplicationCommandOptionType.Role,
                    required: false
                }
            ]
        },
        {
            name: 'retirer',
            description: 'Retirer un rôle de DJ ou un DJ',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'dj',
                    description: "DJ que vous voulez retirer",
                    required: false,
                    type: ApplicationCommandOptionType.User
                },
                {
                    name: 'rôle',
                    description: "Rôle que vous voulez retirer",
                    type: ApplicationCommandOptionType.Role,
                    required: false
                }
            ]
        }
    ]
}).setChatInputRun(async({ interaction, options }) => {
    const cmd = options.getSubcommand()

    if (cmd === 'liste') {
        const question = await interaction.reply({
            embeds: [ djListQuestion(interaction.user) ],
            fetchReply: true,
            components: [row(
                button({ label: 'Utilisateurs', style: 'Secondary', btnId: 'DJListUsers' }),
                button({ label: 'Rôles', style: 'Secondary', btnId: 'DJListRoles' }),
                button({ label: 'Utilisateurs & rôles', style: 'Primary', btnId: 'DJListMixed' })
            )]
        }).catch(log4js.trace) as Message<true>

        if (!question) return;

        const rep = await waitForInteraction({
            componentType: ComponentType.Button,
            user: interaction.user,
            message: question
        }).catch(log4js.trace)
        if (!rep) return interaction.editReply({
            embeds: [ cancel() ],
            components: []
        }).catch(log4js.trace)

        const lists: Record<'u' | 'r' | 'ur', {
            base: (user: User, total: number) => EmbedBuilder;
            list: djListType[];
            mapper: (embed: EmbedBuilder, value: djListType) => EmbedBuilder
            criteria: number;
            empty: (user: User) => EmbedBuilder;
        }> = {
            u: {
                base: djListUsersBase,
                list: djs.getUsers(interaction.guild),
                mapper: djUserMapper,
                criteria: 15,
                empty: emptyUsersDJ
            },
            r: {
                base: djListRolesBase,
                list: djs.getRoles(interaction.guild),
                mapper: djRoleMapper,
                criteria: 15,
                empty: emptyRolesDJ
            },
            ur: {
                base: djListMixedBase,
                list: djs.list(interaction.guild),
                mapper: djMixMapper,
                criteria: 5,
                empty: emptyDjList
            }
        }

        const pack = lists[rep.customId === ButtonIds.DJListMixed ? 'ur' : rep.customId === ButtonIds.DJListRoles ? 'r': 'u']

        if (pack.list.length === 0) return interaction.editReply({
            embeds: [ pack.empty(interaction.user) ],
            components: []
        }).catch(log4js.trace);

        await interaction.editReply({
            components: []
        }).catch(log4js.trace);

        if (pack.list.length <= pack.criteria) {
            const embed = pack.base(interaction.user, pack.list.length)

            pack.list.forEach((value) => pack.mapper(embed, value))

            interaction.editReply({
                embeds: [embed ],
                components: []
            }).catch(log4js.trace)
        } else {
            const embeds = [pack.base(interaction.user, pack.list.length)]

            pack.list.forEach((value, index) => {
                if (index % pack.criteria === 0 && index > 0) embeds.push(pack.base(interaction.user, pack.list.length))

                pack.mapper(embeds[embeds.length - 1], value)
            })

            new AmethystPaginator({
                cancelContent: {
                    embeds: [ cancel() ],
                    ephemeral: true
                },
                embeds,
                user: interaction.user,
                interaction,
                interactionNotAllowedContent: {
                    embeds: [
                        classic(interaction.user, { denied: true })
                            .setTitle("Interaction interdite")
                            .setDescription(`Vous ne pouvez pas interagir avec ce message`)
                    ],
                    ephemeral: true
                },
                invalidPageContent: (max) => ({ content: `Veuillez choisir un chiffre entre **1** et **${numerize(max)}**`, ephemeral: true }),
                numeriseLocale: 'fr',
                modal: {
                    title: 'Page',
                    fieldName: 'Numéro de la page'
                }
            })
        }
    }
    if (cmd === 'ajouter') {
        const roleOption = options.getRole('rôle') as Role;
        const userOption = options.getUser('dj')

        const role = async() => {
            if (djs.getRoles(interaction.guild).find(x => x.id === roleOption.id)) return await interaction.reply({
                embeds: [alreadyDJRole(interaction.user, roleOption)]
            }).catch(log4js.trace)

            djs.addDj(interaction.guild, { id: roleOption.id, type: 'role' })

            await interaction.reply({
                embeds: [ djAdded(interaction.user, { id: roleOption.id, type: 'role' }) ]
            }).catch(log4js.trace)
        }
        const user = (roleTreated: boolean) => {
            const methodName = roleTreated ? 'followUp' : 'reply'
            if (userOption.bot) return interaction[methodName]({
                embeds: [ userBot(interaction.user, userOption) ]
            }).catch(log4js.trace)
            if (djs.getUsers(interaction.guild).find(x => x.id === userOption.id)) return interaction[methodName]({
                embeds: [ alreadyDJUser(interaction.user, userOption) ]
            }).catch(log4js.trace)

            djs.addDj(interaction.guild, { id: userOption.id, type: 'user' })

            interaction[methodName]({ embeds: [ djAdded(interaction.user, { id: userOption.id, type: 'user' }) ] })
        }

        if (!roleOption && !userOption) return interaction.reply({
            embeds: [ djNoOptions(interaction.user) ],
            ephemeral: true
        }).catch(log4js.trace)

        if (!!roleOption) await role();
        if (!!userOption) user(!!roleOption)
    }
    if (cmd === 'retirer') {
        const roleOption = options.getRole('rôle') as Role;
        const userOption = options.getUser('dj')

        const role = async() => {
            if (!djs.getRoles(interaction.guild).find(x => x.id === roleOption.id)) return await interaction.reply({
                embeds: [notDJRole(interaction.user, roleOption)]
            }).catch(log4js.trace)

            djs.removeDj(interaction.guild, roleOption.id)

            await interaction.reply({
                embeds: [ djRemoved(interaction.user, { id: roleOption.id, type: 'role' }) ]
            }).catch(log4js.trace)
        }
        const user = (roleTreated: boolean) => {
            const methodName = roleTreated ? 'followUp' : 'reply'
            if (userOption.bot) return interaction[methodName]({
                embeds: [ userBot(interaction.user, userOption) ]
            }).catch(log4js.trace)
            if (!djs.getUsers(interaction.guild).find(x => x.id === userOption.id)) return interaction[methodName]({
                embeds: [ notDJUser(interaction.user, userOption) ]
            }).catch(log4js.trace)

            djs.removeDj(interaction.guild, userOption.id)

            interaction[methodName]({ embeds: [ djRemoved(interaction.user, { id: userOption.id, type: 'user' }) ] })
        }

        if (!roleOption && !userOption) return interaction.reply({
            embeds: [ djNoOptions(interaction.user) ],
            ephemeral: true
        }).catch(log4js.trace)

        if (!!roleOption) await role();
        if (!!userOption) user(!!roleOption)
    }
})