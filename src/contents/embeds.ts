import { ColorResolvable, EmbedBuilder, User, VoiceChannel } from 'discord.js';
import { colors } from '../contents/data.json'
import { Track } from 'discord-player';
import { pingChan } from '../utils/toolbox';

const color = <Color extends keyof typeof colors>(color: Color): ColorResolvable => {
    return colors[color] as ColorResolvable
}
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

    if (!!options.accentColor) embed.setColor(color('accent'));
    if (!!options.denied) embed.setColor(color('denied'));
    if (!!options.question) embed.setColor(color('question'));

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
export const noVoiceChannel = (user: User) => basic(user, { denied: true }).setTitle("Pas de salon vocal").setDescription(`Je n'ai trouvé aucun salon vocal valide.\nRéessayez en vous connectant à un salon ou en indiquant le salon dans lequel vous voulez que je joue de la musique`)
export const noTracks = (user: User) => basic(user, { denied: true }).setTitle("Pas de musique").setDescription(`Aucune musique n'a été trouvée.\nRéessayez avec une recherche plus générale`)
export const multipleTracks = (user: User) => basic(user, { question: true }).setTitle("Plusieurs musiques").setDescription(`Plusieurs musiques ont été trouvées, veuillez choisir celle que vous voulez sélectionner`)
export const error = (user: User) => basic(user, { denied: true }).setTitle("Erreur").setDescription(`Une erreur a eu lieu lors de l'éxécution de la commande.\nL'erreur a été signalée au développeur et devrait être réglée sous peu`)
export const cancel = () => new EmbedBuilder().setTitle("Annulé").setColor(color('cancel'))
export const play = (user: User, track: Track, channel: VoiceChannel, addedToQueue: boolean) => basic(user, { accentColor: true }).setTitle(`Musique ${addedToQueue ? 'ajoutée' : 'en cours'}`).setDescription(`La musique **${track.title}** ${addedToQueue ? 'a été ajouté dans la playlist' : `va être jouée dans ${pingChan(channel)}`}`).setThumbnail(track.thumbnail ?? user.client.user.displayAvatarURL())
export const notPlaying = (user: User) => basic(user, { denied: true }).setTitle("Pas de musique").setDescription(`Je ne suis pas en train de jouer de la musique`)
export const volume = (user: User, volume: number) => basic(user).setColor('#187D9F').setTitle("Volume").setDescription(`Le volume a été mis sur **${volume}%**`)