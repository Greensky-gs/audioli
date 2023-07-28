import { Precondition } from "amethystjs";
import player from "../cache/player";

export default new Precondition('playing').setChatInputRun(({ interaction }) => {
    if (!interaction.guild) return {
        ok: true,
        type: 'chatInput',
        interaction
    };

    if (!player.nodes.has(interaction.guild) || !player.nodes.get(interaction.guild).isPlaying()) return {
        ok: false,
        type: 'chatInput',
        interaction,
        metadata: {
            embedCode: 'notPlaying'
        }
    }
    return {
        ok: true,
        type: 'chatInput',
        interaction
    }
})