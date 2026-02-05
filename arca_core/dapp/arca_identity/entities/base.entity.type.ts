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
  primaryWalletAddress: string;
  uploadedAt: Date,
  encryptedData: string;
  encryptedKeys?: EncryptionMetadata;
};
