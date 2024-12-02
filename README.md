# Role Assignment System
###### A commission developed by KingsDev

![Screenshot of role selection menu](https://github.com/user-attachments/assets/6a767ac5-a66c-4652-bc19-d30cb2b84e8e)
###### To see more of my work, including more screenshots, go to https://kingrabbit.dev/

Role Assignment System (RAS) manages roles for a community server.  The bot allows users to assign or unassign themselves specific roles by reacting with corresponding emojis to a message.  The bot can also automatically display the list of available roles and the emojis associated with them for each panel of roles.  Alternatively, users can have reaction roles added to a message sent by themself, another user, or another bot.  Users are able to view their current roles and all available roles at any time through the `/roles` command.  Server staff can setup and manage reaction roles and panels through the `/reaction-role` command.

## Commands
`<>` required parameter  
`[]` optional parameter

### `/roles`
This is the public command usable by all server members.
- #### `/roles selected`
  This command allows users to view what reaction roles they currently have selected.
- #### `/roles available`
  This command allows users to view a list of all available reaction roles across all available panels.
### `/reaction-role`
This is the staff-only command used to manage reaction roles and panels.
- #### `/reaction-role create <title> <description> [panel]`
  This creates a panel of reaction roles which automatically updates to show a list of the roles it provides.  Users can alternatively just use their own messages.
- #### `/reaction-role add <message-url> <role> <emoji>`
  This adds a reaction role to a message.  If the targeted message is a panel (created with `/reaction-role create ...`), then the message will be automatically updated to include the new role.
- #### `/reaction-role remove <message-url> <emoji>`
  This removes a reaction role from a message.  If the targeted message is a panel (created with `/reaction-role create ...`), then the message will be automatically updated to remove the old option.  The `emoji` parameter tab completes based on what emojis are on the provided message.
- #### `/reaction-role edit <message-url> [title] [description]>`
  This edits a panel (created with `/reaction-role create ...`)'s title and/or description.  Users can alternatively choose to provide and update their own message to be used for reaction roles.
- #### `/reaction-role fix-reactions`
  This ensures that a message with reaction roles has all the required reactions added to it by the bot.  This can be used if the bot's reactions are mistakenly removen from a message.

## Running the bot
The bot is built using Node.js 20.  To run the bot, install the required dependencies with `npm i` and then run the bot with `npm run start`.  
The bot requires environment variables to be set (optionally through the creation of a `.env` file):
- `BOT_ID` - The bot's user ID
- `BOT_TOKEN` - The bot token
- `MONGO_URI` - The MongoDB URI the bot should connect to.  This database will be used to store the reaction roles.
