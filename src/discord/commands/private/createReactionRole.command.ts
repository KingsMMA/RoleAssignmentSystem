import BaseCommand from "../base.command"
import RoleBot from "../../roleBot"
import {ApplicationCommandType, ApplicationCommandOptionType, APIRole} from "discord-api-types/v10"
import {
    AutocompleteInteraction,
    ChatInputCommandInteraction, GuildTextBasedChannel,
    PermissionOverwrites,
    PermissionsBitField, Role
} from "discord.js"
import KingsDevEmbedBuilder from "../../utils/kingsDevEmbedBuilder";

export default class CreateReactionRoleCommand extends BaseCommand {
    constructor(client: RoleBot) {
        super(client, {
            name: "create-reaction-role",
            description: "Add a reaction role to a message.",
            type: ApplicationCommandType.ChatInput,
            default_member_permissions:
                PermissionsBitField.Flags.ManageRoles.toString(),
            options: [
                {
                    name: "message-url",
                    description: "The URL of the message to add the reaction role to.",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: "role",
                    description: "The role to add.",
                    type: ApplicationCommandOptionType.Role,
                    required: true,
                },
                {
                    name: "emoji",
                    description: "The emoji to react with.",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ]
        })
    }

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const url = interaction.options.getString("message-url", true);
        let role: Role | APIRole | null = interaction.options.getRole("role", true);
        const emoji = interaction.options.getString("emoji", true);

        // URL validation
        if (!/https?:\/\/(.+?\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/.test(url.trim()))
            return interaction.replyError("Invalid message URL.");

        const [ guild_id, channel_id, message_id ] = url.trim().split("/").slice(-3);
        if (guild_id !== interaction.guildId)
            return interaction.replyError("The message must be in this server.");

        const channel = await interaction.guild!.channels.fetch(channel_id) as GuildTextBasedChannel | undefined;
        if (!channel)
            return interaction.replyError("The message's channel could not be found.");

        const message = await channel.messages.fetch(message_id)
            .catch(() => undefined);
        if (!message)
            return interaction.replyError("The message could not be found.");

        // Role validation
        if (role && !(role instanceof Role)) {
            role = await interaction.guild!.roles.fetch(role.id)
                .catch(() => null);
        }
        if (!role) {
            return interaction.replyError("The role could not be found.");
        }

        if (interaction.guild!.roles.everyone.id === role.id)
            return interaction.replyError("You cannot add the @everyone role.");
        if (role.managed)
            return interaction.replyError("You cannot add a managed role.");
        if (role.comparePositionTo((await interaction.guild!.members.fetch(this.client.user!.id)).roles.highest) >= 0)
            return interaction.replyError("You cannot add a role higher than the bot's highest role.");

        const roles = await this.client.main.mongo.fetchMessageRoles(message.url);
        if (Object.keys(roles).length >= 20)
            return interaction.replyError("You cannot add more than 20 reaction roles to a message.");
        if (Object.keys(roles).some(r => r === emoji))
            return interaction.replyError("This emoji is already used as a reaction role on this message.");
        if (Object.values(roles).some(r => r === role.id))
            return interaction.replyError("This role is already a reaction role on this message.");

        let reaction = await message.react(emoji)
            .catch(() => undefined);
        if (!reaction)
            return interaction.replyError("The bot could not react with this emoji.");

        roles[emoji] = role.id;
        await this.client.main.mongo.updateMessageRoles(message.url, roles);

        const embed = new KingsDevEmbedBuilder()
            .setTitle("Reaction Role Added")
            .setDescription(`The reaction role has been added to [this message](${message.url}).`)
            .addField("Role", role.toString(), true)
            .addField("Emoji", emoji, true)
            .setColor("Green");
        await interaction.editReply({ embeds: [embed] });
    }

}
