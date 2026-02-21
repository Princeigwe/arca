export type SenderToRsaMasterKey = {
  sender: string;
  rsaEncryptedMasterDEK: string;
}
export type RsaEncryptedKeys = {
  rsaEncryptedDEKForAdmin: string;
  rsaEncryptedMasterDEKsForSender: SenderToRsaMasterKey[];
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
  encryptionMetaData?: EncryptionMetadata;
};
