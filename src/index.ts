import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import nsfw, { NSFWJS, predictionType } from "nsfwjs";
import tf, { Tensor3D } from "@tensorflow/tfjs-node"
import dotenv from "dotenv";

dotenv.config();

let _model: NSFWJS;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on("ready", async () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    await load_model();
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

    const image = await tf.node.decodeImage(pic.data, 3);
    const predictions = await _model.classify(image as Tensor3D);

    return predictions;

}

async function load_model() {
    _model = await nsfw.load();
};

client.login(process.env.TOKEN);