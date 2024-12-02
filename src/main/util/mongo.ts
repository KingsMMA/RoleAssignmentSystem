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

}
