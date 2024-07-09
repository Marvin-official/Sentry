import { SlashCommandBuilder } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set log channel")
    .setDescription("Set the channel in wich Sentry will store it's logs"),
};
