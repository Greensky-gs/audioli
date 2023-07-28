import { ColorResolvable, EmbedBuilder, User } from "discord.js";
import { data } from "../utils/toolbox";

const basic = (
  user: User,
  options?: {
    accentColor?: boolean;
    iconOption?: "user" | "client";
    footerText?: "user" | "client";
    denied?: boolean;
  },
) => {
  const embed = new EmbedBuilder().setTimestamp().setFooter({
    iconURL: !!(options?.iconOption ?? "user")
      ? user.displayAvatarURL({ forceStatic: false })
      : user.client.user.displayAvatarURL({ forceStatic: true }),
    text: !!(options?.footerText ?? "user")
      ? user.username
      : user.client.user.username,
  });

  if (!!options.accentColor)
    embed.setColor(data("colors", "accent") as ColorResolvable);
  if (!!options.denied)
    embed.setColor(data("colors", "denied") as ColorResolvable);

  return embed;
};
export const classic = basic;
export const notADJ = (user: User) =>
  basic(user, { denied: true })
    .setTitle("Non DJ")
    .setDescription(
      `Vous n'êtes pas un DJ, vous ne pouvez pas effectuer cette commande`,
    );
export const guildOnly = (user: User) =>
  basic(user, { denied: true })
    .setTitle("Serveur uniquement")
    .setDescription(`Cette commande n'est utilisable que sur un serveur`);
export const ownerOnly = (user: User) =>
  basic(user, { denied: true })
    .setTitle("Propriétaire seulement")
    .setDescription(
      `Cette commande n'est exécutable que par le propriétaire du serveur`,
    );
export const adminOnly = (user: User) =>
  basic(user, { denied: true })
    .setTitle("Administrateur seulement")
    .setDescription(`Seul un administrateur peut effectuer cette commande`);
