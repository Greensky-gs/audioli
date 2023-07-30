import { Precondition } from 'amethystjs';
import djs from '../cache/djs';
import configs from '../cache/configs';
import { preconditionRunReturn } from 'amethystjs/dist/typings/Precondition';
import { GuildMember } from 'discord.js';

export default new Precondition('is DJ').setChatInputRun(({ interaction }) => {
    if (!interaction.guild)
        return {
            ok: true,
            type: 'chatInput',
            interaction
        };

    const condition = configs.getconfig(interaction.guild.id, 'djallow');
    const dj = () => {
        if (!djs.isDj(interaction.guild, interaction.member as GuildMember))
            return {
                ok: false,
                type: 'chatInput',
                interaction,
                metadata: {
                    embedCode: 'notADJ'
                }
            };
        return { ok: true };
    };
    const admin = () => {
        if (!(interaction.member as GuildMember).permissions.has('Administrator'))
            return {
                ok: false,
                type: 'chatInput',
                interaction,
                metadata: {
                    embedCode: 'notADJ'
                }
            };
        return { ok: true };
    };
    if (condition === 'everyone') {
        return {
            ok: true,
            interaction,
            type: 'chatInput'
        };
    }
    if (condition === 'djonly') {
        if (!dj().ok) return dj() as preconditionRunReturn;
    } else if (condition === 'adminsonly') {
        if (!admin().ok) return admin() as preconditionRunReturn;
    } else {
        if (!dj().ok || !admin().ok) {
            return {
                ok: false,
                type: 'chatInput',
                interaction,
                metadata: {
                    embedCode: 'notADJ'
                }
            };
        }
    }

    return {
        ok: true,
        type: 'chatInput',
        interaction
    };
});
