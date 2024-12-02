import { Client, ClientOptions, Collection } from "discord.js"
import { PathLike } from "fs"
import path from "path"
import Main from "../main/main"
import BaseCommand from "./commands/base.command"

export default class RoleBot extends Client {
    main: Main
    commands: Collection<string, BaseCommand> = new Collection()

    constructor(main: Main, options: ClientOptions) {
        super(options)
        this.main = main
    }

    loadCommand(commandPath: PathLike, commandName: string) {
        try {
            const command: BaseCommand = new (require(`${commandPath}${path.sep}${commandName}`).default)(this)
            console.info(`Loading Command: ${command.name}.`)
            this.commands.set(command.name, command)
        } catch (e) {
            return `Unable to load command ${commandName}: ${e}`
        }
    }

    loadEvent(eventPath: PathLike, eventName: string) {
        try {
            const event = new (require(`${eventPath}${path.sep}${eventName}`).default)(this)
            console.info(`Loading Event: ${eventName}.`)
            this.on(eventName, (...args) => event.run(...args))
        } catch (e) {
            return `Unable to load event ${eventName}: ${e}`
        }
    }
}
