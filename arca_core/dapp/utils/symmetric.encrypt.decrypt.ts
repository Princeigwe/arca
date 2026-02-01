import * as crypto from "crypto";

const algorithm = "aes-256-cbc";

export class SymmetricEncryptDecrypt {
  // generates 256-bits data encryption key
  async generateDEKAndIV() {
    const iv = crypto.randomBytes(16).toString("hex");
    const dek = crypto.randomBytes(32).toString("hex");
    console.log("IV: " + iv);
    console.log("DEK: " + dek);
    return { dek, iv };
  }

  async encryptData(plainData: any) {
    try {
      const { dek, iv } = await this.generateDEKAndIV();
      const cipher = crypto.createCipheriv(
        algorithm,
        Buffer.from(dek, "hex"),
        Buffer.from(iv, "hex"),
      );
      let encryptedData = cipher.update(plainData, "utf-8", "hex");
      encryptedData += cipher.final("hex");
      return { encryptedData, iv };
    } catch (error) {
      console.error(`Error encrypting data: ${error}`);
    }
  }

  async decryptData(encryptedData: string, dek: string, iv: string) {
    try {
      const decipher = crypto.createDecipheriv(
        algorithm,
        Buffer.from(dek, "hex"),
        Buffer.from(iv, "hex"),
      );
      let decryptedData = decipher.update(encryptedData, "hex", "utf-8");
      decryptedData += decipher.final("utf-8");
      return decryptedData;
    } catch (error) {
      console.error(`Error decrypting data: ${error}`);
    }
  }
}
