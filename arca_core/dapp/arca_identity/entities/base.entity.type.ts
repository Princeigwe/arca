export type RsaEncryptedKeys = {
  rsaEncryptedDEKForAdmin: string;
  rsaEncryptedDEKForSender: string;
}

export type EncryptionMetadata = {
  rsaKeys: RsaEncryptedKeys
  dekIv: string;
};

export type IPFS = {
  storageType: string;
  encryptedData: string;
  encryptedKeys?: EncryptionMetadata;
};
