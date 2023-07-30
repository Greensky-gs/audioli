import { APIGuildMember, GuildMember, User } from 'discord.js';

export type userPingResolvable = string | User | GuildMember | APIGuildMember;
export enum DJPermLevel {
    Owner = 2,
    DJ = 1,
    everyone = 0
}