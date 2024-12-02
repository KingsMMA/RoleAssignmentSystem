import BaseCommand from "../base.command"
import RoleBot from "../../roleBot"
import {ApplicationCommandType, ApplicationCommandOptionType, APIRole} from "discord-api-types/v10"
import {
    AutocompleteInteraction,
    ChatInputCommandInteraction, GuildTextBasedChannel, Message,
    PermissionOverwrites,
    PermissionsBitField, Role
} from "discord.js"
import KingsDevEmbedBuilder from "../../utils/kingsDevEmbedBuilder";
import {Snowflake} from "discord-api-types/globals";

export default class ReactionRoleCommand extends BaseCommand {
    constructor(client: RoleBot) {
        super(client, {
            name: "reaction-role",
            description: "Manages reaction roles.",
            type: ApplicationCommandType.ChatInput,
            default_member_permissions:
                PermissionsBitField.Flags.ManageRoles.toString(),
            options: [
                {
                    name: 'create',
                    description: 'Create a reaction role message',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "title",
                            description: "The title of the message.",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                        {
                            name: "description",
                            description: "The description of the message.",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                        {
                            name: "channel",
                            description: "The channel to send the message to.",
                            type: ApplicationCommandOptionType.Channel,
                            required: false,
                        },
                    ]
                },
                {
                    name: 'add',
                    description: 'Add a reaction role to a message',
                    type: ApplicationCommandOptionType.Subcommand,
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
                },
                {
                    name: 'remove',
                    description: 'Remove a reaction role',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "message-url",
                            description: "The URL of the message to remove the reaction role from.",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                        {
                            name: "emoji",
                            description: "The emoji to remove.",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            autocomplete: true,
                        },
                    ]
                },
                {
                    name: 'fix-reactions',
                    description: 'Ensure the bot has reacted to a message with all the reaction roles.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "message-url",
                            description: "The URL of the message to fix the reactions for.",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                    ]
                }
            ]
        })
    }

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        switch (interaction.options.getSubcommand()) {
            case "create":
                return this.createReactionRoleMessage(interaction);
            case "add":
                return this.addReactionRole(interaction);
            case "remove":
                return this.removeReactionRole(interaction);
            case "fix-reactions":
                return this.fixReactions(interaction);
            default:
                return interaction.replyError("Invalid subcommand.");
        }
    }

    async createReactionRoleMessage(interaction: ChatInputCommandInteraction) {
        const title = interaction.options.getString("title", true);
        const description = interaction.options.getString("description", true);
        const channelOption = interaction.options.getChannel("channel") || interaction.channel!;

        let channel = await interaction.guild!.channels.fetch(channelOption.id);
        if (!channel)
            return interaction.replyError("The channel could not be found.");
        if (!channel.isTextBased() || channel.isVoiceBased())
            return interaction.replyError("The channel must be a text channel.");

        const embed = new KingsDevEmbedBuilder()
            .setTitle(title)
            .setDescription(description + "\n\nNo reaction roles have been added to this message.")
            .setColor("Blurple");
        const message = await channel.send({ embeds: [embed] })
            .catch(() => undefined);
        if (!message)
            return interaction.replyError("The bot could not send the message.  Double check the bot's permissions in the targeted channel.");

        await this.client.main.mongo.createNewPanel(interaction.guild!.id, message.url, title, description);

        const successEmbed = new KingsDevEmbedBuilder()
            .setTitle("Reaction Role Message Created")
            .setDescription(`The reaction role message has been created in <#${channel.id}>: [Jump to message](${message.url})\n\nYou can now add reaction roles to this message with the \`/reaction-role add\` command.`)
            .setColor("Green");
        await interaction.editReply({ embeds: [successEmbed] });
    }

    async addReactionRole(interaction: ChatInputCommandInteraction) {
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
            return interaction.replyError("The bot could not react with this emoji.  Double check the emoji you provided and the bot's permissions in the targeted channel.");

        roles[emoji] = role.id;
        await this.client.main.mongo.updateMessageRoles(message.url, roles);

        await this.updatePanelMessage(message, roles);

        const embed = new KingsDevEmbedBuilder()
            .setTitle("Reaction Role Added")
            .setDescription(`The reaction role has been added to [this message](${message.url}).`)
            .addField("Role", role.toString(), true)
            .addField("Emoji", emoji, true)
            .setColor("Green");
        await interaction.editReply({ embeds: [embed] });
    }

    async removeReactionRole(interaction: ChatInputCommandInteraction) {
        const url = interaction.options.getString("message-url", true);
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

        const roles = await this.client.main.mongo.fetchMessageRoles(message.url);
        if (!roles[emoji])
            return interaction.replyError("This emoji is not used as a reaction role on this message.");

        let response = await message.reactions.cache.find(r => r.emoji.name === emoji)?.users.remove(this.client.user!.id)
            .catch(() => undefined);
        if (!response)
            return interaction.replyError("The bot could not remove the reaction.  Double check the emoji you provided and the bot's permissions in the targeted channel");

        let previousRole = roles[emoji];
        delete roles[emoji];
        await this.client.main.mongo.updateMessageRoles(message.url, roles);

        await this.updatePanelMessage(message, roles);

        const embed = new KingsDevEmbedBuilder()
            .setTitle("Reaction Role Removed")
            .setDescription(`The reaction role has been removed from [this message](${message.url}).`)
            .addField("Role", `<@&${previousRole}>`, true)
            .addField("Emoji", emoji, true)
            .setColor("Green");
        await interaction.editReply({ embeds: [embed] });
    }

    async fixReactions(interaction: ChatInputCommandInteraction) {
        const url = interaction.options.getString("message-url", true);

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

        const roles = await this.client.main.mongo.fetchMessageRoles(message.url);
        for (const emoji in roles) {
            if (!message.reactions.cache.has(emoji)) {
                await message.react(emoji)
                    .catch(() => undefined);
            }
        }

        const embed = new KingsDevEmbedBuilder()
            .setTitle("Reactions Fixed")
            .setDescription(`The bot has reacted to the message with all the reaction roles.`)
            .setColor("Green");
        await interaction.editReply({ embeds: [embed] });
    }

    async updatePanelMessage(message: Message, roles: Record<string, Snowflake>): Promise<void> {
        const panel = await this.client.main.mongo.fetchPanel(message.guild!.id, message.url);
        if (!panel)
            return;

        let rolesText: string;
        if (Object.keys(roles).length === 0) {
            rolesText = "No reaction roles have been added to this message.";
        } else {
            rolesText = Object.keys(roles)
                .map(emoji => `${emoji} <@&${roles[emoji]}>`)
                .join("\n");
        }

        const embed = new KingsDevEmbedBuilder()
            .setTitle(panel.title)
            .setDescription(`${panel.description}\n\n${rolesText}`)
            .setColor("Blurple");

        return void await message.edit({ embeds: [embed] })
            .catch(() => undefined);
    }

    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === "remove") {
            const url = interaction.options.getString("message-url", true);
            const roles = await this.client.main.mongo.fetchMessageRoles(url);
            return interaction.respond(
                Object.keys(roles)
                    .map(emoji => ({
                        name: emoji,
                        value: emoji,
                    }))
            );
        }

        return interaction.respond([]);
    }

}
