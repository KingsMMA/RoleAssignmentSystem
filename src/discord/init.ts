import RoleBot from "./roleBot"
import path from "path"
import klaw from "klaw"
import Main from "../main/main"
import axios from "axios"
import {GatewayIntentBits} from "discord-api-types/v10"
import {Partials} from "discord.js";

export const init = async (main: Main) => {
    const client = new RoleBot(main, {
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildModeration,
            GatewayIntentBits.GuildEmojisAndStickers,
            GatewayIntentBits.GuildIntegrations,
            GatewayIntentBits.GuildWebhooks,
            GatewayIntentBits.GuildInvites,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildMessageTyping,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.MessageContent,
        ],
        allowedMentions: {
            parse: ["users", "roles"]
        },
        shards: "auto",
        partials: [Partials.Message, Partials.Channel, Partials.Reaction]
    })

    klaw(`${__dirname}/commands`).on("data", file => {
        const command = path.parse(file.path)
        if (command.ext !== ".js" || command.name === "base.command") return
        const err = client.loadCommand(command.dir, command.base)
        if (err) console.info(err)
    })
        .on("end", () =>
            axios.put(
                `https://discord.com/api/v10/applications/${process.env.BOT_ID}/commands`,
                client.commands.map(command => command.toApplicationCommand()),
                {
                    headers: {
                        Authorization: "Bot " + process.env.BOT_TOKEN,
                        "Content-Type": "application/json"
                    }
                }
            )
        );

    klaw(`${__dirname}/events`).on("data", file => {
        const event = path.parse(file.path)
        if (event.ext !== ".js") return
        const err = client.loadEvent(event.dir, event.name)
        if (err) console.info(err)
    })

    await client.login(process.env.BOT_TOKEN)
    return client
}
