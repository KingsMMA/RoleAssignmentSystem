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

export default class RolesCommand extends BaseCommand {
    constructor(client: RoleBot) {
        super(client, {
            name: "roles",
            description: "Manages reaction roles.",
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: "selected",
                    description: "View selected reaction roles.",
                    type: ApplicationCommandOptionType.Subcommand
                },
                {
                    name: "available",
                    description: "View available reaction roles.",
                    type: ApplicationCommandOptionType.Subcommand
                }
            ]
        })
    }

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        switch (interaction.options.getSubcommand()) {
            case "selected":
                return this.viewSelected(interaction);
            case "available":
                return this.viewAvailable(interaction);
            default:
                return interaction.replyError("Invalid subcommand.");
        }
    }

    async viewSelected(interaction: ChatInputCommandInteraction) {
        const reactionRoles: Snowflake[] = await this.client.main.mongo.fetchAllAvailableRoles(interaction.guildId!);
        const userRoles: Snowflake[] = await interaction.guild!.members.fetch(interaction.user.id)
            .then(member => member.roles.cache.map(role => role.id));

        const roles = userRoles.filter(role => reactionRoles.includes(role));
        if (roles.length === 0) return interaction.editReply({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setTitle("Selected Reaction Roles")
                    .setDescription("You have not selected any reaction roles.")
                    .setColor('Blurple')
            ]
        });

        return interaction.editReply({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setTitle("Selected Reaction Roles")
                    .setDescription(`You have selected ${roles.length} reaction role${roles.length === 1 ? '' : 's'}.\n\n${
                        roles.map(role => `• <@&${role}>`).join('\n')}`)
                    .setColor('Blurple')
            ]
        });
    }

    async viewAvailable(interaction: ChatInputCommandInteraction) {
        const available = await this.client.main.mongo.fetchReactionMessages(interaction.guildId!);

        if (available.length === 0) return interaction.editReply({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setTitle("Available Reaction Roles")
                    .setDescription("There are no available reaction roles.")
                    .setColor('Blurple')
            ]
        });

        let availableRoles = await this.client.main.mongo.fetchAllAvailableRoles(interaction.guildId!);
        availableRoles = availableRoles.filter((role, index) => availableRoles.indexOf(role) === index);

        return interaction.editReply({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setTitle("Available Reaction Roles")
                    .setDescription(`There are ${availableRoles.length} available reaction role${availableRoles.length === 1 ? '' : 's'
                    } across ${available.length} reaction role message${available.length === 1 ? '' : 's'
                    }.\n\n${available.map(message => `• [Jump to Message](${message.url})\n${
                        Object.entries(message.roles).map(([emoji, role]) => `${emoji}: <@&${role}>`).join('\n')
                    }`).join('\n\n')}`)
                    .setColor('Blurple')
            ]
        });
    }

}
