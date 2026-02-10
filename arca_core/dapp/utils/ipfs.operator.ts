import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import axios from "axios";
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const IPFS_RPC_API_BASEURL = "https://rpc.filebase.io/";

const s3Client = new S3Client({
  apiVersion: "2006-03-01",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.FILEBASE_ACCESS_KEY!,
    secretAccessKey: process.env.FILEBASE_SECRET_KEY!,
  },
  endpoint: "https://s3.filebase.com",
  forcePathStyle: true,
});

const bucket = "arca";

export class IpfsOperator {
  async uploadJsonData(fileName: string, jsonData: any) {
    const params = {
      Bucket: bucket,
      Key: fileName,
      Body: jsonData,
      ContentType: "application/json",
    };

    let fileCid;

    const command = new PutObjectCommand(params);
    command.middlewareStack.add((next) => async (args) => {
      const response = await next(args);
      // console.log("Command Response...: ", response);
      fileCid = (response.response as any).headers["x-amz-meta-cid"];
      return response;
    });
    const uploadRequest = await s3Client.send(command);

    return {
      cid: fileCid,
      uploadRequest,
    };
  }

  async getIpfsDaemon() {
    const url = `${IPFS_RPC_API_BASEURL}api/v0/version`;
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.FILEBASE_RPC_ARCA_BUCKET_API_ACCESS_KEY}`,
        },
      },
    );
    console.log("Daemon version:", response.data);
  }

  async getFileByCid(cid: string) {
    const url = `${IPFS_RPC_API_BASEURL}api/v0/cat?arg=${cid}`;
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.FILEBASE_RPC_ARCA_BUCKET_API_ACCESS_KEY}`,
        },
      },
    );
    console.log("File data:", JSON.stringify(response.data));
  }
}

const ipfsOperator = new IpfsOperator();

// ipfsOperator.getIpfsDaemon()

const cid = "Qma3b81nGeNyJELFtS2FYy6tUN1qo7f74Xj4MBFQeSRTot";
ipfsOperator.getFileByCid(cid);
