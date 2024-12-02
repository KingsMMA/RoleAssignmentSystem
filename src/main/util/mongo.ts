import { Db, MongoClient } from "mongodb"
import Main from "../main"
import {Snowflake} from "discord-api-types/globals";

export default class Mongo {
    private mongo!: Db
    main: Main
    constructor(main: Main) {
        this.main = main
    }

    async connect() {
        const client = await MongoClient.connect(process.env.MONGO_URI!)
        this.mongo = client.db(this.main.config.mongo.database)
        console.info(`Connected to Database ${this.mongo.databaseName}`)
    }

    async createNewPanel(guild_id: Snowflake, message_url: string, title: string, description: string): Promise<void> {
        return void this.mongo.collection("panels")
            .updateOne(
                { guild_id: guild_id },
                { $set: { [`panels.${message_url.replace(/\./g, '[D]')}`]: { title, description } } },
                { upsert: true });
    }

    async fetchPanel(guild_id: Snowflake, message_url: string): Promise<{ title: string, description: string } | null> {
        return this.mongo.collection("panels")
            .findOne({ guild_id: guild_id })
            .then((doc) => doc?.panels[message_url.replace(/\./g, '[D]')] || null);
    }

    async updatePanel(guild_id: Snowflake, message_url: string, title: string, description: string): Promise<void> {
        return void this.mongo.collection("panels")
            .updateOne(
                { guild_id: guild_id },
                { $set: { [`panels.${message_url.replace(/\./g, '[D]')}`]: { title, description } } },
                { upsert: true });
    }

    async fetchMessageRoles(message_url: string): Promise<Record<string, Snowflake>> {
        return this.mongo.collection("reaction_roles")
            .findOne({ url: message_url })
            .then((doc) => doc?.roles || {});
    }

    async updateMessageRoles(message_url: string, roles: Record<string, Snowflake>): Promise<void> {
        if (Object.keys(roles).length === 0)
            return void this.mongo.collection("reaction_roles")
                .deleteOne({ url: message_url });

        return void this.mongo.collection("reaction_roles")
            .updateOne(
                { url: message_url },
                { $set: { roles: roles } },
                { upsert: true });
    }

    async fetchAllAvailableRoles(guild_id: Snowflake): Promise<Snowflake[]> {
        return this.mongo.collection("reaction_roles")
            .find({
                url: { $regex: guild_id }
            }).map((doc) => Object.values(doc.roles) as Snowflake[])
            .toArray()
            .then((roles) => roles.flat())
            .then((roles) => [...new Set(roles)]);
    }

}
