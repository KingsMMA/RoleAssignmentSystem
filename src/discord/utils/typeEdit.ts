import {CommandInteraction, InteractionResponse, Message} from "discord.js";
import KingsDevEmbedBuilder from "./kingsDevEmbedBuilder";

declare module 'discord.js' {
    interface CommandInteraction {
        replySuccess(
            message: string,
            ephemeral?: boolean,
        ): Promise<Message | InteractionResponse>;
        replyError(
            message: string,
            ephemeral?: boolean,
        ): Promise<Message | InteractionResponse>;
    }
}

CommandInteraction.prototype.replySuccess = function (
    message: string,
    ephemeral?: boolean,
) {
    if (this.replied || !this.isRepliable() || this.deferred)
        return this.editReply({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setColor('Green')
                    .setTitle('Success')
                    .setDescription(message)
                ]
        });
    else
        return this.reply({
            ephemeral: ephemeral,
            embeds: [
                new KingsDevEmbedBuilder()
                    .setColor('Green')
                    .setTitle('Success')
                    .setDescription(message)
            ]
        });
}

CommandInteraction.prototype.replyError = function (
    message: string,
    ephemeral?: boolean,
) {
    if (this.replied || !this.isRepliable() || this.deferred)
        return this.editReply({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error')
                    .setDescription(message)
                ]
        });
    else
        return this.reply({
            ephemeral: ephemeral,
            embeds: [
                new KingsDevEmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error')
                    .setDescription(message)
            ]
        });
}
