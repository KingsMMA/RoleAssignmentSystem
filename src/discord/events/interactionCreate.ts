import RoleBot from "../roleBot"
import { Interaction } from "discord.js"

export default class {
    client: RoleBot
    constructor(client: RoleBot) {
        this.client = client
    }

    async run(interaction: Interaction) {
        if (interaction.isCommand()) {
            if (!interaction.guild) return interaction.replyError('This command can only be used in a server.');

            const command = this.client.commands.get(interaction.commandName)
            if (!command) return

            if (!command.opts.enabled) {
                return interaction.reply({
                    content: "This command is currently disabled.",
                    ephemeral: true
                })
            }

            return command.execute(interaction)
        } else if (interaction.isAutocomplete()) {
            const command = this.client.commands.get(interaction.commandName)
            if (!command) return
            return command.autocomplete(interaction)
        }
    }
}
