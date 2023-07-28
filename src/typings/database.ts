import { If } from "discord.js";
import { configKey } from "./configs";

export type DefaultQueryResult = {
    fieldCount: number;
    affectedRows: number;
    insertId: number;
    serverStatus: number;
    warningCount: number;
    message: string;
    protocol41: boolean;
    changedRows: number;
};
export type QueryResult<T> = T extends DefaultQueryResult ? DefaultQueryResult : T[];
export enum DatabaseTables {
    Djs = 'djs',
    Configs = 'configs'
}
export type djs<Raw extends boolean = false> = {
    guild_id: string;
    list: If<Raw, string, string[]>;
}
export type configs<Raw extends boolean = false> = {
    guild_id: string;
} & Record<configKey, string | If<Raw, string, number> | If<Raw, string, boolean>>