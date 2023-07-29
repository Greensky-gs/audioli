import { APIGuildMember, GuildMember, User } from 'discord.js';

export type userPingResolvable = string | User | GuildMember | APIGuildMember;
