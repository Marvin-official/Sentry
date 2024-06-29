import NSFWdetector from "./services/NSFWdetector";
import { Message } from "discord.js";

export default class MessageHandler {
  private nsfwDetector: NSFWdetector;

  constructor(nsfwDetector: NSFWdetector) {
    this.nsfwDetector = nsfwDetector;
  }

  public async handler(message: Message): Promise<void> {
    await this.nsfwDetector.checkMessage(message);
  }
}
