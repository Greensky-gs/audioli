import { APIGuildMember, GuildMember, User } from 'discord.js';

export type userPingResolvable = string | User | GuildMember | APIGuildMember;
export enum DJPermLevel {
    Owner = 3,
    DJ = 2,
    Admin = 1,
    everyone = 0
}