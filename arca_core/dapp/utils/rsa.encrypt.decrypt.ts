import {IdentityRsaMasterKey } from "../modules/arca_identity/entities/ipfs.patient.entity.type";
import { decrypt, encrypt } from "eciesjs";
import { IdentityType } from "../modules/arca_identity/enums/identity.type.enum";

export class RsaEncryptDecrypt {
  /**
   * this function asymmetrically encrypts the data encryption key used to encrypt plain data,
   *  in order for both parties for related authorized parties to have access to the same data.
   * @param dek The data encryption key used in symmetric encryption
   * @param senderAddress The wallet address of the sender, used to identify the sender in the list of encrypted keys for senders
   * @param senderPk The sender's wallet public key
   * @param adminPk The selected public key of an arca admin
   * @param medicalGuardianPk The medical guardian's wallet public key, only required for minor patients with medical guardians
   * @param medicalGuardianAddress The wallet address of the medical guardian, used to identify the medical guardian in the list of encrypted keys for medical guardians, only required for minor patients with medical guardians
   * @returns a set of RSA encrypted keys
   */
  dualKeyEncryption(
    dek: string, 
    senderAddress: string, 
    senderPk: string, 
    adminPk: string, 
    adminAddress: string,
    medicalGuardianPk?: string,
    medicalGuardianAddress?: string,
  ) {
    try {
      const bufferDek = Buffer.from(dek, "utf-8");

      let medicalGuardianPkBuffer: Buffer | null = null;
      let medicalGuardianEncryptedDek: Buffer | null = null;
      let medicalGuardianToRsaMasterKey: IdentityRsaMasterKey | null = null;

      // public keys from ethers.js are hex strings, often with a '0x' prefix
      // they also represent uncompressed keys, which eciesjs can handle
      const senderPkBuffer = Buffer.from(
        senderPk.startsWith("0x") ? senderPk.substring(2) : senderPk,
        "hex",
      );
      const adminPkBuffer = Buffer.from(
        adminPk.startsWith("0x") ? adminPk.substring(2) : adminPk,
        "hex",
      );


      // RSA-encrypted DEK for the sender (patient)
      const sendEncryptedDek = encrypt(senderPkBuffer, bufferDek);

      // RSA-encrypted DEK for the Arca admin for KYC-verification
      const adminEncryptedDek = encrypt(adminPkBuffer, bufferDek);

      if(medicalGuardianPk){
        medicalGuardianPkBuffer = Buffer.from(
          medicalGuardianPk.startsWith("0x") ? medicalGuardianPk.substring(2) : medicalGuardianPk,
          "hex",
        );
        medicalGuardianEncryptedDek = encrypt(medicalGuardianPkBuffer, bufferDek);
      }


      const senderToRsaMasterKey: IdentityRsaMasterKey = {
        wallet: senderAddress, // patient main address
        rsaEncryptedMasterDEK: sendEncryptedDek.toString("base64"),
        identityType: IdentityType.PATIENT
      }

      const adminToRsaMasterKey: IdentityRsaMasterKey = {
        wallet : adminAddress,
        rsaEncryptedMasterDEK: adminEncryptedDek.toString("base64"),
        identityType: IdentityType.ADMIN
      }

      if(medicalGuardianEncryptedDek) {
        medicalGuardianToRsaMasterKey = {
          wallet: medicalGuardianAddress!,
          rsaEncryptedMasterDEK: medicalGuardianEncryptedDek.toString("base64"),
          identityType: IdentityType.MEDICAL_GUARDIAN
        }
      }

      // let keys: RsaEncryptedKeys = {
      //   rsaEncryptedDEKForAdmin: adminEncryptedDek.toString("base64"),
      //   rsaEncryptedMasterDEKs: [senderToRsaMasterKey],
      //   rsaEncryptedMasterDEKsForMedicalGuardians: medicalGuardianToRsaMasterKey ? [medicalGuardianToRsaMasterKey] : undefined
      // };
      // return keys;

      let keys = [senderToRsaMasterKey, adminToRsaMasterKey];
      if(medicalGuardianEncryptedDek) {
        keys.push(medicalGuardianToRsaMasterKey!);
      }
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
