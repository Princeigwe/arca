import { IdentityType } from "../enums/identity.type.enum";

export type IdentityRsaMasterKey = {
  wallet: string;
  rsaEncryptedMasterDEK: string;
  identityType: IdentityType;
}

export type EncryptionMetadata = {
  rsaKeys: IdentityRsaMasterKey[]
  dekIv: string;
};

export type IpfsEnvelope = {
  storageType: string;
  primaryWalletAddress: string;
  uploadedAt: Date,
  encryptedData: string;
  encryptionMetaData?: EncryptionMetadata;
};
