import { ColorResolvable, EmbedBuilder, PermissionsString, Role, User, VoiceChannel } from 'discord.js';
import { colors } from '../contents/data.json';
import { Track } from 'discord-player';
import { data, msToSentence, numerize, pingChan, pingRole, pingUser, plurial, resize } from '../utils/toolbox';
import { userPingResolvable } from '../typings/types';
import { AmethystCommand, preconditions } from 'amethystjs';
import isDj from '../preconditions/isDj';

const color = <Color extends keyof typeof colors>(color: Color): ColorResolvable => {
    return colors[color] as ColorResolvable;
};
const basic = (
    user: User,
    options?: {
        accentColor?: boolean;
        iconOption?: 'user' | 'client';
        footerText?: 'user' | 'client';
        denied?: boolean;
        question?: boolean;
    }
) => {
    const embed = new EmbedBuilder().setTimestamp().setFooter({
        iconURL: !!(options?.iconOption ?? 'user')
            ? user.displayAvatarURL({ forceStatic: false })
            : user.client.user.displayAvatarURL({ forceStatic: true }),
        text: !!(options?.footerText ?? 'user') ? user.username : user.client.user.username
    });

    if (!!options?.accentColor)
        embed.setColor(color(user.client.user.username.includes('Dev') ? 'beta_accent' : 'accent'));
    if (!!options?.denied) embed.setColor(color('denied'));
    if (!!options?.question) embed.setColor(color('question'));

    return embed;
};
export const classic = basic;
export const notADJ = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Non DJ')
        .setDescription(`Vous n'êtes pas un DJ, vous ne pouvez pas effectuer cette commande`);
export const guildOnly = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Serveur uniquement')
        .setDescription(`Cette commande n'est utilisable que sur un serveur`);
export const ownerOnly = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Propriétaire seulement')
        .setDescription(`Cette commande n'est exécutable que par le propriétaire du serveur`);
export const adminOnly = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Administrateur seulement')
        .setDescription(`Seul un administrateur peut effectuer cette commande`);
export const noVoiceChannel = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Pas de salon vocal')
        .setDescription(
            `Je n'ai trouvé aucun salon vocal valide.\nRéessayez en vous connectant à un salon ou en indiquant le salon dans lequel vous voulez que je joue de la musique`
        );
export const noTracks = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Pas de musique')
        .setDescription(`Aucune musique n'a été trouvée.\nRéessayez avec une recherche plus générale`);
export const multipleTracks = (user: User) =>
    basic(user, { question: true })
        .setTitle('Plusieurs musiques')
        .setDescription(`Plusieurs musiques ont été trouvées, veuillez choisir celle que vous voulez sélectionner`);
export const error = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Erreur')
        .setDescription(
            `Une erreur a eu lieu lors de l'éxécution de la commande.\nL'erreur a été signalée au développeur et devrait être réglée sous peu`
        );
export const cancel = () => new EmbedBuilder().setTitle('Annulé').setColor(color('cancel'));
export const play = (user: User, track: Track, channel: VoiceChannel, addedToQueue: boolean) =>
    basic(user, { accentColor: true })
        .setTitle(`Musique ${addedToQueue ? 'ajoutée' : 'en cours'}`)
        .setDescription(
            `La musique **${track.title}** ${
                addedToQueue ? 'a été ajoutée dans la playlist' : `va être jouée dans ${pingChan(channel)}`
            }`
        )
        .setThumbnail(track.thumbnail ?? user.client.user.displayAvatarURL());
export const notPlaying = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Pas de musique')
        .setDescription(`Je ne suis pas en train de jouer de la musique`);
export const volume = (user: User, volume: number) =>
    basic(user).setColor('#187D9F').setTitle('Volume').setDescription(`Le volume a été mis sur **${volume}%**`);
export const emptyQueue = (user: User) =>
    basic(user, { accentColor: true })
        .setTitle('Playlist vide')
        .setDescription(`Il n'y a aucune musique dans la playlist`);
export const queueList = (user: User, queue: Track[]) =>
    basic(user, { accentColor: true })
        .setTitle('Playlist')
        .setDescription(
            resize(
                `Il y a ${queue.length.toLocaleString('fr')} musique${plurial(
                    queue
                )} en attente pour une durée totale de **${msToSentence(
                    queue.map((x) => x.durationMS).reduce((a, b) => a + b, 0)
                )}** \n${queue.map((x) => `- ${x.title} - ${x.author} ( ${msToSentence(x.durationMS)} )`).join('\n')}`
            )
        );
export const trackRemoved = (user: User, track: Track) =>
    basic(user, { accentColor: true })
        .setTitle('Musique retirée')
        .setDescription(`La musique **${track.title}** a été retirée de la liste de lecture`);
export const skipped = (user: User, track: Track | undefined) =>
    basic(user, { accentColor: true })
        .setTitle('Passée')
        .setDescription(
            `La musique a été passée${
                track
                    ? `\nPassage à la chanson : **${track.title}** par ${track.author}`
                    : "\nIl n'y a plus rien dans la playlist"
            }`
        );
export const moveSameSong = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Même musique')
        .setDescription(`Vous avez choisit deux fois la même chanson, choisissez-en une autre`);
export const moved = (user: User, track: Track) =>
    basic(user, { accentColor: true })
        .setTitle('Musique déplacée')
        .setDescription(`La musique **${track.title}** a été déplacée`);
export const shuffled = (user: User) =>
    basic(user, { accentColor: true })
        .setTitle('Playlist mélangée')
        .setDescription(`La liste de lecture a été mélangée`);
export const paused = (user: User) =>
    basic(user, { accentColor: true }).setTitle('Pause').setDescription(`La musique a été mise en pause`);
export const resumed = (user: User) =>
    basic(user, { accentColor: true }).setTitle('Lecture').setDescription(`La musique a été remise en lecture`);
export const notPaused = (user: User) =>
    basic(user, { denied: true }).setTitle('Musique en lecture').setDescription(`La musique n'est pas en pause`);
export const playlistAlreadyExists = (user: User, playlist: string) =>
    basic(user, { denied: true })
        .setTitle('Playlist existante')
        .setDescription(`Vous avez déjà une playlist du même nom`);
export const unexistingPlaylist = (user: User, playlist?: string) =>
    basic(user, { denied: true })
        .setTitle('Playlist inexistante')
        .setDescription(`La playlist${playlist ? ` **${playlist}**` : ''} n'existe pas`);
export const alreadyAdded = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Musique déjà ajoutée')
        .setDescription(`Cette musique est déjà dans la playlist`);
export const songAdded = (user: User, track: Track) =>
    basic(user, { accentColor: true })
        .setTitle('Musique ajoutée')
        .setDescription(`La musique **${track.title}** a été ajoutée dans la playlist`)
        .setThumbnail(track?.thumbnail ?? user.client.user.displayAvatarURL());
export const songRemoved = (user: User) =>
    basic(user, { accentColor: true })
        .setTitle('Musique retirée')
        .setDescription(`La musique a été retirée de la playlist`);
export const sharedWith = (user: User, target: userPingResolvable) =>
    basic(user, { accentColor: true })
        .setTitle('Playlist partagée')
        .setDescription(`La playlist a été partagée avec ${pingUser(target)}`);
export const unshared = (user: User, target: userPingResolvable) =>
    basic(user, { accentColor: true })
        .setTitle('Playlist départagée')
        .setDescription(`Vous ne partagez plus la playlist à ${pingUser(target)}`);
export const totalyUnshared = (user: User) =>
    basic(user, { accentColor: true })
        .setTitle('Playlist privée')
        .setDescription(`Plus personne n'a accès à la playlist`);
export const visibility = (user: User, visible: 'public' | 'private') =>
    basic(user, { accentColor: true })
        .setTitle(`Playlist ${visible === 'private' ? 'privée' : 'publique'}`)
        .setDescription(`Votre playlist est maintenant **${visible === 'private' ? 'privée' : 'publique'}**`);
export const deleted = (user: User, playlistName: string) =>
    basic(user, { accentColor: true })
        .setTitle('Playlist supprimée')
        .setDescription(`La playlist **${playlistName}** a été supprimée`);
export const created = (user: User, name: string) =>
    basic(user, { accentColor: true })
        .setTitle('Playlist créee')
        .setDescription(`Vous avez crée la playlist **${name}**`);
export const invalidEmoji = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Émoji invalide')
        .setDescription(
            `Ce n'est pas un émoji valide.\nVeuillez envoyer un émoji correct, et assurez-vous que je puisse accéder à cet émoji`
        );
export const wait = (user: User) =>
    basic(user).setTitle('Patientez').setDescription(`Veuillez patienter quelques instants...`).setColor('#BE3702');
export const askEmoji = (user: User) =>
    basic(user, { question: true })
        .setTitle('Émoji')
        .setDescription(
            `Quel émoji voulez-vous utiliser ?\nRépondez dans le chat par un émoji\nRépondez par \`cancel\` pour annuler`
        );
export const underCooldown = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Cooldown')
        .setDescription(
            `Vous avez un cooldown sur cette commande, veuillez patienter quelques secondes avant de recommencer`
        );
export const playlistVisibilityConflict = (user: User, playlist: { name: string; public: boolean; emoji?: string }) =>
    basic(user, { denied: true })
        .setTitle(`Playlist ${playlist.public ? 'publique' : 'privée'}`)
        .setDescription(
            `La playlist ${playlist.emoji ? playlist.emoji + ' ' : ''}${playlist.name} **est déjà** ${
                playlist.public ? 'publique' : 'privée'
            }`
        );
export const userBot = (user: User, target: userPingResolvable) =>
    basic(user, { denied: true })
        .setTitle('Robot')
        .setDescription(`${pingUser(target)} est un bot.\nCette action n'est pas faisable sur un bot`);
export const shareSelf = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Auto-partage')
        .setDescription(`Vous ne pouvez pas partager la playlist à vous-même`);
export const alreadyShared = (user: User, target: userPingResolvable) =>
    basic(user, { denied: true })
        .setTitle('Déjà partagée')
        .setDescription(`Vous partagez déjà la playlist à ${pingUser(target)}`);
export const notShared = (user: User, target: userPingResolvable) =>
    basic(user, { denied: true })
        .setTitle('Non partagée')
        .setDescription(`La playlist n'est pas partagée à ${pingUser(target)}`);
export const songNotInPlaylist = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Chanson invalide')
        .setDescription(`Cette musique n'est pas dans la playlist`);
export const playPlaylistFirstNotFound = (user: User) =>
    basic(user, { denied: true })
        .setTitle('Musique introuvable')
        .setDescription(`Je n'ai pas pu trouver la musique à jouer`);
export const playlistPlayed = (user: User, channel: VoiceChannel, addedToQueue?: boolean) =>
    basic(user, { accentColor: true })
        .setTitle(`Playlist ${!!addedToQueue ? 'ajoutée' : 'jouée'}`)
        .setDescription(
            `La playlist ${
                !!addedToQueue ? `a été ajouté dans la liste de lecture` : `va être jouée dans ${pingChan(channel)}`
            }`
        );
export const emptyPlaylist = (user: User) =>
    basic(user, { denied: true }).setTitle('Playlist vide').setDescription(`La playlist est vide`);
export const help = (user: User) => basic(user, { accentColor: true })
    .setThumbnail(user.client.user.displayAvatarURL())
    .setTitle("Page d'aide")
    .setDescription(`Voici la page d'aide de ${pingUser(user.client.user)}\n${user.client.chatInputCommands.map((cmd) => `\`/${cmd.options.name}\` : ${cmd.options.description}`).join('\n')}`)
    .setFields(
        {
            name: 'Liens',
            value: `[Serveur de support](${data('links', 'support')})\n[Invitation](${data('links', 'invite')})\n[Instagram](${data('links', 'instagram')})\nEmail : \`${data('links', 'email')}\`\n[Code source](https://github.com/Greensky-gs/audioli)`,
            inline: false
        }
    )
export const commandHelp = (user: User, { options, ...command }: AmethystCommand) => {
    const checks: { condition: boolean; msg: string }[] = [
        { condition: options.preconditions.includes(preconditions.GuildOnly), msg: 'être dans un serveur' },
        { condition: options.preconditions.includes(isDj), msg: 'être DJ' },
        { condition: options.preconditions.includes(preconditions.OwnerOnly), msg: 'être propriétaire du serveur' }
    ]
    const permissions = checks.filter(x => x.condition).map(x => x.msg);

    const embed = basic(user, { accentColor: true })
        .setTitle(`Commande ${options.name}`)
        .setDescription(`Description : \`\`\`${options.description}\`\`\`\nPermissions : ${permissions.length === 0 ? 'Aucune permission' : permissions.join(', ')}`)
    return embed;
}
export const stopped = (user: User) => basic(user, { accentColor: true }).setTitle("Musique arrêtée").setDescription(`La musique a été arrêtée`)
export const invalidTime = (user: User) => basic(user, { denied: true }).setTitle("Durée invalide").setDescription(`Ce n'est pas une durée valide.\nUtilisez un chiffre, suivit de \`s\` pour les secondes, \`m\` pour les minutes, \`h\` pour les heures et \`d\` pour les jours`)
export const timeQuestion = (user: User) => basic(user, { question: true }).setTitle("Durée").setDescription(`Envoyez la durée que vous voulez dans le chat\nUtilisez un chiffre, suivit de \`s\` pour les secondes, \`m\` pour les minutes, \`h\` pour les heures et \`d\` pour les jours\n\nRépondez par \`cancel\` pour annuler`)
export const invalidNumber = (user: User) => basic(user, { denied: true }).setTitle("Nombre invalide").setDescription(`Ce n'est pas un nombre valide`)

// Embeds DJ
export const djListUsersBase = (user: User, total: number) => basic(user, { accentColor: true }).setTitle("Liste des DJ").setDescription(`Voici la liste des DJ (${numerize(total)})\n`)
export const emptyUsersDJ = (user: User) => basic(user, { accentColor: true }).setTitle("Liste des DJ").setDescription(`Il n'y a aucun DJ`)
export const djListRolesBase = (user: User, total: number) => basic(user, { accentColor: true }).setTitle("Rôles de DJ").setDescription(`Voici la liste des rôles de DJ (${numerize(total)})\n`)
export const emptyRolesDJ = (user: User) => basic(user, { accentColor: true }).setTitle("Rôles de DJ").setDescription(`Il n'y a aucun rôle de DJ`)
export const djUserMapper = (embed: EmbedBuilder, value: { id: string; type: 'user' }) => embed.setDescription(`${embed.data.description}\n${pingUser(value.id)}`)
export const djRoleMapper = (embed: EmbedBuilder, value: { id: string; type: 'role' }) => embed.setDescription(`${embed.data.description}\n${pingRole(value.id)}`)
export const djListMixedBase = (user: User, total: number) => basic(user, { accentColor: true }).setTitle("Liste des DJ").setDescription(`Voici la liste des rôles de DJ et les DJ (${numerize(total)})\n`)
export const emptyDjList = (user: User) => basic(user, { accentColor: true }).setTitle("Aucun DJ").setDescription(`La liste est complètement vide`)
export const djMixMapper = (embed: EmbedBuilder, value: { id: string; type: 'user' | 'role' }) => embed.addFields({ name: value.type === 'role' ? 'Rôle' : 'Utilisateur', value: value.type === 'role' ? pingRole(value.id) : pingUser(value.id), inline: false })
export const djListQuestion = (user: User) => basic(user, { question: true }).setTitle("Liste").setDescription(`Quelle liste voulez-vous voir ?`)
export const djAdded = (user: User, value: { id: string; type: 'user' | 'role' }) => value.type === 'role' ? basic(user, { accentColor: true }).setTitle("Rôle DJ ajouté").setDescription(`Le rôle ${pingRole(value.id)} est maintenant un rôle de DJ`) : basic(user, { accentColor: true }).setTitle("DJ ajouté").setDescription(`${pingUser(value.id)} est maintenant un DJ`)
export const djRemoved = (user: User, value: { id: string; type: 'user' | 'role' }) => value.type === 'role' ? basic(user, { accentColor: true }).setTitle("Rôle DJ retiré").setDescription(`Le rôle ${pingRole(value.id)} n'est plus un rôle de DJ`) : basic(user, { accentColor: true }).setTitle("DJ retiré").setDescription(`${pingUser(value.id)} n'est plus un DJ`)
export const alreadyDJRole = (user: User, role: Role) => basic(user, { denied: true }).setTitle("Rôle enregistré").setDescription(`Le rôle ${pingRole(role)} est déjà un rôle de DJ`)
export const alreadyDJUser = (user: User, dj: User) => basic(user, { denied: true }).setTitle("DJ enregistré").setDescription(`${pingUser(dj)} est déjà un DJ`)
export const notDJRole = (user: User, role: Role) => basic(user, { denied: true }).setTitle("Rôle non enregistré").setDescription(`Le rôle ${pingRole(role)} n'est pas un rôle de DJ`)
export const notDJUser = (user: User, dj: User) => basic(user, { denied: true }).setTitle("DJ non enregistré").setDescription(`${pingUser(dj)} n'est pas un DJ`)
export const djNoOptions = (user: User) => basic(user, { denied: true }).setDescription("Vous n'avez précisé aucune option").setTitle(`Aucune option`)
export const missingPerms = (user: User, perms: PermissionsString[]) => basic(user, { denied: true }).setTitle("Permissions insuffisantes").setDescription(`Vous n'avez pas ${perms.length === 1 ? `la permission \`${data('perms', perms[0])}\` pour faire cette commande` : `les permissions ${perms.map((perm) => `\`${data('perms', perm)}\``).join(', ')} pour faire cette commande`}`)