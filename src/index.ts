import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

import NSFWdetector from "./services/NSFWdetector";
import MessageHandler from "./messageHandler";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
});

let messageHandler: MessageHandler;
let nsfwDetector: NSFWdetector;

client.on("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  try {
    nsfwDetector = await NSFWdetector.initialise();
    messageHandler = new MessageHandler(nsfwDetector);
  } catch (err) {
    console.error(err);
  }
});

client.on("messageCreate", async (msg) => {
  messageHandler.handler(msg);
});

client.login(process.env.TOKEN);
