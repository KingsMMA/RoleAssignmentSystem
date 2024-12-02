import RoleBot from "../roleBot"
import {Interaction, MessageReaction, MessageReactionEventDetails, User} from "discord.js"

export default class {
    client: RoleBot
    constructor(client: RoleBot) {
        this.client = client
    }

    async run(messageReaction: MessageReaction, user: User, details: MessageReactionEventDetails) {
        if (user.id === this.client.user!.id) return;

        const url = messageReaction.message.url;
        const roles = await this.client.main.mongo.fetchMessageRoles(url);
        if (Object.keys(roles).length === 0) return;

        let removedReaction = await messageReaction.users.remove(user.id)
            .catch(() => undefined);
        if (!removedReaction) return;

        const role = roles[messageReaction.emoji.name!];
        if (!role) return;

        const member = await messageReaction.message.guild!.members.fetch(user.id);
        if (!member) return;

        const guildRole = member.guild.roles.cache.get(role);
        if (!guildRole) return;

        const hasRole = member.roles.cache.has(role);
        if (hasRole) {
            await member.roles.remove(guildRole);
        } else {
            await member.roles.add(guildRole);
        }

        await user.createDM()
            .then((dm) =>
                dm.send(`You have been ${hasRole ? 'removed from' : 'given'} the role \`${guildRole.name}\` in \`${member.guild.name}\`.`)
                    .catch(() => undefined)
            ).catch(() => undefined);
    }

}
