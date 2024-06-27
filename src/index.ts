import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import nsfw, { predictionType } from "nsfwjs";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on("ready", () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});

const supportedImgFormat = ['jpeg', 'png', "bmp", "gif"];

client.on("messageCreate", async (msg) => {
    const attachements = msg.attachments.filter(attachement => {
        if (attachement.contentType?.startsWith("image/")) {
            const type = attachement.contentType.split("/")[1];
            if (supportedImgFormat.includes(type)) {
                return true
            } else {
                console.log(attachement.contentType);
                return false;
            }

        }
    })

    try {
        const results = await Promise.all(attachements.map(attachement => {
            return nsfwDetector(attachement.url);
        }));
        results.forEach(async result => {
            let isPorn = false;
            result.forEach(prediction => {
                if (prediction.className === "Sexy" || prediction.className === 'Porn' || prediction.className === 'Hentai') {
                    if (prediction.probability >= 0.25) {
                        isPorn = true;
                    }
                }
            })
            if (isPorn) {
                await msg.delete();
            }
        });

    } catch (error) {
        console.error(error);
    }


})

async function nsfwDetector(url: string): Promise<predictionType[]> {
    const pic = await axios.get(url, {
        responseType: "arraybuffer",
    });

    const model = await nsfw.load();
    const image = new Uint8Array(pic.data);
    const predictions = await model.classify(image);

    return predictions;

}

client.login(process.env.TOKEN);