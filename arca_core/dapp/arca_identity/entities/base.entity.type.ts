export type EncryptionKeys = {
  rsaEncryptedDEKForAdmin: string;
  rsaEncryptedDEKForPatient: string;
  dekIv: string
}

export type IPFS = {
  storageType: string;
  encryptedData: string;
  encryptedKeys?: EncryptionKeys
}
