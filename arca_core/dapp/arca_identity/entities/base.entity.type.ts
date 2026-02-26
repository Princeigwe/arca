export type SenderToRsaMasterKey = {
  sender: string;
  rsaEncryptedMasterDEK: string;
}

export type MedicalGuardianToRsaMasterKey = {
  medicalGuardian: string;
  rsaEncryptedMasterDEK: string;
}
export type RsaEncryptedKeys = {
  rsaEncryptedDEKForAdmin: string;
  rsaEncryptedMasterDEKsForSender: SenderToRsaMasterKey[];
  rsaEncryptedMasterDEKsForMedicalGuardians?: MedicalGuardianToRsaMasterKey[]; // Optional, only for minors with medical guardians
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
