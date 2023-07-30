import { APIGuildMember, Guild, GuildMember, User } from 'discord.js';

export type GuildResolvable = string | Guild;
export type userResolvable = string | User | GuildMember;
