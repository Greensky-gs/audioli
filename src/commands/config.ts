import { AmethystCommand, log4js, preconditions, waitForInteraction, waitForMessage } from 'amethystjs';
import {
    ApplicationCommandOptionType,
    ChannelSelectMenuBuilder,
    ChannelType,
    ComponentType,
    Message,
    StringSelectMenuBuilder,
    TextChannel
} from 'discord.js';
import { additionalChannelType, additionalCustomStringType, additionalNumberType, configKey } from '../typings/configs';
import { button, data, getConfig, msToSentence, numerize, pingChan, pingRole, resize, row } from '../utils/toolbox';
import {
    cancel,
    channelNotFound,
    classic,
    configInfo,
    invalidChannelType,
    invalidNumber,
    viewConfig,
    wait
} from '../contents/embeds';
import { ButtonIds } from '../typings/buttons';
import configs from '../cache/configs';
import SendAndDelete from '../processes/SendAndDelete';
import GetTime from '../processes/GetTime';
import GetRole from '../processes/GetRole';

export default new AmethystCommand({
    name: 'paramètres',
    description: 'Configure le serveur',
    preconditions: [preconditions.GuildOnly],
    permissions: ['Administrator'],
    options: [
        {
            name: 'configurer',
            description: 'Configure un paramètre',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'paramètre',
                    description: 'Paramètre que vous voulez configurer',
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    autocomplete: true
                }
            ]
        },
        {
            name: 'informations',
            description: "Affiche les informations d'un paramètre",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'paramètre',
                    description: 'Paramètre dont vous voulez les informations',
                    required: true,
                    autocomplete: true,
                    type: ApplicationCommandOptionType.String
                }
            ]
        },
        {
            name: 'voir',
            description: 'Affiche les paramètres',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'paramètre',
                    required: false,
                    description: 'Paramètre que vous voulez voir',
                    autocomplete: true,
                    type: ApplicationCommandOptionType.String
                }
            ]
        }
    ]
}).setChatInputRun(async ({ interaction, options }) => {
    const cmd = options.getSubcommand();

    if (cmd === 'voir') {
        const key = options.getString('paramètre') as configKey;

        if (getConfig(key)) {
            return interaction
                .reply({
                    embeds: [viewConfig(interaction.user, interaction.guild, key)]
                })
                .catch(log4js.trace);
        }
        interaction
            .reply({
                embeds: [viewConfig(interaction.user, interaction.guild)]
            })
            .catch(log4js.trace);
    }
    if (cmd === 'informations') {
        const key = options.getString('paramètre') as configKey;
        const info = getConfig(key);

        interaction
            .reply({
                embeds: [configInfo(interaction.user, info)]
            })
            .catch(log4js.trace);
    }
    if (cmd === 'configurer') {
        const key = options.getString('paramètre') as configKey;
        const config = getConfig(key);

        if (config.type === 'boolean') {
            const msg = (await interaction
                .reply({
                    embeds: [
                        classic(interaction.user, { question: true })
                            .setTitle('Configuration')
                            .setDescription(`Voulez-vous **activer** ou **désactiver** ${config.name} ?`)
                    ],
                    components: [
                        row(
                            button({ label: 'Activer', style: 'Success', btnId: 'Yes' }),
                            button({ label: 'Désactiver', style: 'Danger', btnId: 'No' })
                        )
                    ],
                    fetchReply: true
                })
                .catch(log4js.trace)) as Message<true>;
            if (!msg) return;

            const rep = await waitForInteraction({
                componentType: ComponentType.Button,
                user: interaction.user,
                message: msg
            }).catch(log4js.trace);
            if (!rep)
                return interaction
                    .editReply({
                        embeds: [cancel()],
                        components: []
                    })
                    .catch(log4js.trace);

            const value = rep.customId === ButtonIds.Yes;
            configs.setConfig(interaction.guild.id, key, value);

            interaction
                .editReply({
                    embeds: [
                        classic(interaction.user, { accentColor: true })
                            .setTitle('Paramètre configuré')
                            .setDescription(
                                `Le paramètre **${config.name}** est maintenant ${value ? 'activé' : 'désactivé'}`
                            )
                    ],
                    components: []
                })
                .catch(log4js.trace);
        } else if (config.type === 'customstring') {
            const msg = (await interaction
                .reply({
                    embeds: [
                        classic(interaction.user, { question: true })
                            .setTitle('Configuration')
                            .setDescription(`Sur quelle valeur voulez-vous configurer **${config.name}** ?`)
                    ],
                    fetchReply: true,
                    components: [
                        row(
                            new StringSelectMenuBuilder()
                                .setCustomId('config-select-custom')
                                .setOptions(
                                    (config as unknown as additionalCustomStringType).states.map((x) => ({
                                        label: x.name,
                                        value: x.value,
                                        description: x.description
                                    }))
                                )
                                .setMaxValues(1)
                        )
                    ]
                })
                .catch(log4js.trace)) as Message<true>;

            if (!msg) return;
            const rep = await waitForInteraction({
                componentType: ComponentType.StringSelect,
                user: interaction.user,
                message: msg
            }).catch(() => {});
            if (!rep) return interaction.editReply({ embeds: [cancel()], components: [] }).catch(log4js.trace);

            const value = rep.values[0];
            configs.setConfig(interaction.guild.id, key, value);

            interaction
                .editReply({
                    embeds: [
                        classic(interaction.user, { accentColor: true })
                            .setTitle('Configuré')
                            .setDescription(
                                `Le paramètre **${config.name}** a été configuré sur \`${
                                    (config as unknown as additionalCustomStringType).states.find(
                                        (x) => x.value === value
                                    ).name
                                }\``
                            )
                    ],
                    components: []
                })
                .catch(log4js.trace);
        } else if (config.type === 'number') {
            const meta = config as unknown as additionalNumberType;
            await interaction
                .reply({
                    embeds: [
                        classic(interaction.user, { question: true })
                            .setTitle('Configuration')
                            .setDescription(
                                `Sur quel nombre voulez-vous configurer **${
                                    config.name
                                }** ?\nRépondez dans le chat par un nombre ${
                                    !!meta.max && !!meta.min
                                        ? `entre ${numerize(meta.min)} et ${numerize(meta.max)}`
                                        : !!meta.min
                                        ? `supérieur à ${numerize(meta.min)}`
                                        : !!meta.max
                                        ? `inférieur à ${numerize(meta.max)}`
                                        : ''
                                }\n\nRépondez par \`cancel\` pour annuler`
                            )
                    ]
                })
                .catch(log4js.trace);

            let int: number;
            const collector = interaction.channel.createMessageCollector({
                filter: (x) => x.author.id === interaction.user.id,
                time: 120000
            });
            collector.on('collect', (message) => {
                message.delete().catch(log4js.trace);
                if (message.content?.toLowerCase() === 'cancel') return collector.stop('cancel');

                const intTry = parseInt(message.content);
                if (isNaN(intTry))
                    return SendAndDelete.process(
                        { embeds: [invalidNumber(interaction.user)] },
                        message.channel as TextChannel
                    );
                if ((!!meta.max && intTry > meta.max) || (!!meta.min && intTry < meta.min))
                    return SendAndDelete.process(
                        { embeds: [invalidNumber(interaction.user)] },
                        message.channel as TextChannel
                    );

                int = intTry;
                collector.stop('finished');
            });
            collector.on('end', (c, reason) => {
                if (reason !== 'finished') {
                    interaction.editReply({ embeds: [cancel()] }).catch(log4js.trace);
                    return;
                }

                configs.setConfig(interaction.guild.id, key, int);
                interaction
                    .editReply({
                        embeds: [
                            classic(interaction.user, { accentColor: true })
                                .setTitle('Configuré')
                                .setDescription(
                                    `Le paramètre **${config.name}** a été configuré sur **${numerize(int)}**`
                                )
                        ]
                    })
                    .catch(log4js.trace);
            });
        } else if (config.type === 'string') {
            await interaction
                .reply({
                    embeds: [
                        classic(interaction.user, { question: true })
                            .setTitle('Configuration')
                            .setDescription(
                                `Sur quoi voulez-vous configurer **${config.name}**\nRépondez dans le chat.\nRépondez par \`cancel\` pour annuler`
                            )
                    ]
                })
                .catch(log4js.trace);

            const rep = await waitForMessage({
                channel: interaction.channel as TextChannel,
                user: interaction.user
            }).catch(log4js.trace);
            if (!rep || rep?.content?.toLowerCase() === 'cancel')
                return interaction
                    .editReply({
                        embeds: [cancel()]
                    })
                    .catch(log4js.trace);

            configs.setConfig(interaction.guild.id, key, rep.content);

            interaction
                .editReply({
                    embeds: [
                        classic(interaction.user, { accentColor: true })
                            .setTitle('Configuré')
                            .setDescription(
                                `${resize(
                                    `Le paramètre **${config.name}** a été configuré sur \`\`\`${rep.content}`,
                                    4090
                                )}\`\`\``
                            )
                    ]
                })
                .catch(log4js.trace);
        } else if (config.type === 'time') {
            const rep = await GetTime.process({
                interaction,
                user: interaction.user,
                embed: classic(interaction.user, { question: true })
                    .setTitle('Configuration')
                    .setDescription(
                        `Sur quelle durée voulez-vous configurer **${config.name}** ?\nRépondez dans le chat\nVous pouvez répondre par \`cancel\` pour annuler`
                    )
            }).catch(log4js.trace);

            if (!rep || rep === 'cancel' || rep === "time's up")
                return interaction
                    .editReply({
                        embeds: [cancel()]
                    })
                    .catch(log4js.trace);

            configs.setConfig(interaction.guild.id, key, rep);
            interaction
                .editReply({
                    embeds: [
                        classic(interaction.user, { accentColor: true })
                            .setTitle('Configuré')
                            .setDescription(
                                `Le paramètre **${config.name}** a été configuré sur \`${msToSentence(rep)}\``
                            )
                    ]
                })
                .catch(log4js.trace);
        } else if (config.type === 'role') {
            const msg = (await interaction
                .reply({
                    fetchReply: true,
                    embeds: [
                        classic(interaction.user, { question: true })
                            .setTitle('Configuration')
                            .setDescription(
                                `Quel est le rôle que vous voulez utiliser pour configurer **${config.name}** ?\nRépondez dans le chat par un nom, un identifiant ou une mention\nRépondez par \`cancel\` pour annuler`
                            )
                    ]
                })
                .catch(log4js.trace)) as Message<true>;
            const role = await GetRole.process({
                message: msg,
                user: interaction.user,
                allowCancel: true
            }).catch(log4js.trace);

            if (!role || role === "time's up" || role === 'cancel')
                return interaction
                    .editReply({
                        embeds: [cancel()]
                    })
                    .catch(log4js.trace);

            configs.setConfig(interaction.guild.id, key, role.id);
            interaction
                .editReply({
                    embeds: [
                        classic(interaction.user, { accentColor: true })
                            .setTitle('Configuré')
                            .setDescription(`Le paramètre **${config.name}** a été configuré sur ${pingRole(role)}`)
                    ]
                })
                .catch(log4js.trace);
        } else {
            const meta = config as unknown as additionalChannelType;
            const channelSelect = new ChannelSelectMenuBuilder().setMaxValues(1).setCustomId('config-select-channel');

            if (!!meta?.types) channelSelect.setChannelTypes(meta.types);
            const msg = (await interaction
                .reply({
                    embeds: [
                        classic(interaction.user, { question: true })
                            .setTitle('Configuration')
                            .setDescription(`Sur quel salon voulez-vous configurer **${config.name}** ?`)
                    ],
                    components: [row(channelSelect)],
                    fetchReply: true
                })
                .catch(log4js.trace)) as Message<true>;

            if (!msg) return;
            const rep = await waitForInteraction({
                componentType: ComponentType.ChannelSelect,
                user: interaction.user,
                message: msg
            }).catch(log4js.trace);

            if (!rep)
                return interaction
                    .editReply({
                        embeds: [cancel()],
                        components: []
                    })
                    .catch(log4js.trace);
            await interaction
                .editReply({
                    embeds: [wait(interaction.user)],
                    components: []
                })
                .catch(log4js.trace);
            const channel =
                interaction.guild.channels.cache.get(rep.values[0]) ??
                (await interaction.guild.channels.fetch(rep.values[0]).catch(log4js.trace));
            if (!channel)
                return interaction
                    .editReply({
                        embeds: [channelNotFound(interaction.user)]
                    })
                    .catch(log4js.trace);
            if (!!meta?.types && meta.types.length > 0 && !meta.types.includes(channel.type))
                return interaction
                    .editReply({
                        embeds: [invalidChannelType(interaction.user, meta.types)]
                    })
                    .catch(log4js.trace);

            configs.setConfig(interaction.guild.id, key, channel.id);
            interaction
                .editReply({
                    embeds: [
                        classic(interaction.user, { accentColor: true })
                            .setTitle('Configuré')
                            .setDescription(`Le paramètre **${config.name}** a été configuré sur ${pingChan(channel)}`)
                    ]
                })
                .catch(log4js.trace);
        }
    }
});
