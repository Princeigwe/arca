import { RsaEncryptedKeys } from "../arca_identity/entities/base.entity.type";
import { decrypt, encrypt } from "eciesjs";

export class RsaEncryptDecrypt {
  /**
   * this function asymmetrically encrypts the data encryption key used to encrypt plain data,
   *  in order for both parties for related authorized parties to have access to the same data.
   * @param dek The data encryption key used in symmetric encryption
   * @param senderPk The sender's wallet public key
   * @param adminPk The selected public key of an arca admin
   * @returns a set of RSA encrypted keys
   */
  dualKeyEncryption(dek: string, senderPk: string, adminPk: string) {
    try {
      const bufferDek = Buffer.from(dek, "utf-8");

      // Ppublic keys from ethers.js are hex strings, often with a '0x' prefix
      // they also represent uncompressed keys, which eciesjs can handle
      const senderPkBuffer = Buffer.from(
        senderPk.startsWith("0x") ? senderPk.substring(2) : senderPk,
        "hex",
      );
      const adminPkBuffer = Buffer.from(
        adminPk.startsWith("0x") ? adminPk.substring(2) : adminPk,
        "hex",
      );

      const sendEncryptedDek = encrypt(senderPkBuffer, bufferDek);
      const adminEncryptedDek = encrypt(adminPkBuffer, bufferDek);

      let keys: RsaEncryptedKeys = {
        rsaEncryptedDEKForAdmin: adminEncryptedDek.toString("base64"),
        rsaEncryptedMasterDEKsForSender: [sendEncryptedDek.toString("base64")],
      };
      return keys;
    } catch (error) {
      console.error("Error in dual encryption process: ", error);
      throw error;
    }
  }

  /**
   * This function decrypts the RSA encrypted key to return the original DEK,
   * which will in turn be used to symmetrically decrypt the plain data
   * @param privateKey the private key of the reader's wallet
   * @param encryptedDek the RSA encrypted key
   * @returns the decrypted DEK
   */
  decryptDek(privateKey: string, encryptedDek: string) {
    try {
      // the private key is a hex string, convert it to a Buffer, removing the '0x' prefix if it exists
      const privateKeyBuffer = Buffer.from(
        privateKey.startsWith("0x") ? privateKey.substring(2) : privateKey,
        "hex",
      );
      // converting base64 string back to buffer
      const encryptedBuffer = Buffer.from(encryptedDek, "base64");

      const decryptedBuffer = decrypt(privateKeyBuffer, encryptedBuffer);

      // converting back to original string
      return decryptedBuffer.toString("utf-8");
    } catch (error) {
      console.error("Error decrypting DEK:", error);
      throw error;
    }
  }

  encryptDek(publicKey: string, dek: string) {
    try {
      const bufferDek = Buffer.from(dek, "utf-8");
      const pkBuffer = Buffer.from(
        publicKey.startsWith("0x") ? publicKey.substring(2) : publicKey,
        "hex",
      );
      const rsaEncryptedDek = encrypt(pkBuffer, bufferDek);
      return rsaEncryptedDek.toString("base64");
    } catch (error) {
      console.error("Error encrypting DEK:", error);
      throw error;
    }
  }
}
