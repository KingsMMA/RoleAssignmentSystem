import RoleBot from "../roleBot"

export default class {
    client: RoleBot

    constructor(client: RoleBot) {
        this.client = client
    }

    run() {
        console.info(`Successfully logged in! \nSession Details: id=${this.client.user?.id} tag=${this.client.user?.tag}`)
    }
}
