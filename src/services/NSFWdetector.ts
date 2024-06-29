import axios from "axios";
const nsfw = require("nsfwjs");
import type { NSFWJS, predictionType } from "nsfwjs";
const tf = require("@tensorflow/tfjs-node");
import { math, type Tensor3D } from "@tensorflow/tfjs-node";
import sharp from "sharp";
import { Message, User } from "discord.js";

export default class NSFWdetector {
  private model: NSFWJS;
  public supportedImgFormat = [
    "JPEG",
    "PNG",
    "WEBP",
    "AVIF",
    "GIF",
    "SVG",
    "TIFF",
  ];

  private constructor(model: NSFWJS) {
    this.model = model;
  }

  public static async initialise(): Promise<NSFWdetector> {
    tf.enableProdMode();
    const model = await nsfw.load("MobileNetV2Mid");
    return new NSFWdetector(model);
  }

  public async checkMessage(message: Message): Promise<void> {
    let isPorn = false;
    let predictions: any[] = [];

    const attachements = message.attachments.filter((attachement) => {
      if (attachement.contentType?.startsWith("image/")) {
        const type: string = attachement.contentType.split("/")[1];
        if (this.supportedImgFormat.includes(type.toUpperCase())) {
          return true;
        } else {
          console.log(attachement.contentType);
          return false;
        }
      }
    });

    try {
      const results = await Promise.all(
        attachements.map((attachement) => {
          return this.nsfwDetector(attachement.url);
        })
      );

      results.forEach(async (result) => {
        predictions.push({
          author: message.author,
          content: message.content,
          type: message.attachments.map((a) => a.contentType),
          ...result,
        });
        result.forEach((prediction) => {
          if (
            prediction.className === "Sexy" ||
            prediction.className === "Porn" ||
            prediction.className === "Hentai"
          ) {
            // FIXME: We probably want some kind of adjustable threshold, if the model doesn´t meet a certain threshold
            // log the image in the log channel for moderation review.
            if (prediction.probability >= 0.3) {
              isPorn = true;
            }
          }
        });
      });

      if (isPorn) {
        /* TODO:  - delete message
                  - ban user with a reason like "NSFW images are not allowed"
                  - save the image ? needed to log the image but could be an issue
                  - log the message and images with a nsfw tag
        */
        try {
          await message.delete();
        } catch (err) {
          console.error(err);
        }

        try {
          await message.member?.ban({
            reason:
              "You have been automaticaly banned from this server for posting explicit content.",
          });
        } catch (err) {
          console.error(err);
        }
      }
    } catch (error) {
      console.error(error);
    }

    console.log(predictions);
  }

  private async nsfwDetector(url: string): Promise<predictionType[]> {
    const randomSeed = Math.random() * 1000000;
    console.time("imageCheck" + randomSeed);
    const rawImageBuffer: Uint8Array = (
      await axios.get(url, {
        responseType: "arraybuffer",
      })
    ).data;

    // Transform image in the correct format
    // FIXME: Here we transform gif or other animated images in a still frame because we need a 3d tensor.
    // The limiting factor here is the nsfwjs lib but the model should be able to take 4d tensors.
    const imageBuffer: Uint8Array = await sharp(rawImageBuffer)
      .resize(299, 299)
      .jpeg({ mozjpeg: true })
      .toBuffer();
    const image = tf.node.decodeImage(
      imageBuffer,
      3,
      "int32",
      false
    ) as Tensor3D;

    const predictions = await this.model.classify(image);
    image.dispose();
    console.timeEnd("imageCheck" + randomSeed);
    return predictions;
  }
}
