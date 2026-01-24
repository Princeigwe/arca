export class IPFS{
  storageType: string;
  data: any

  constructor(storageType: string, data: any) {
    this.storageType = storageType;
    this.data = data;
  }
}