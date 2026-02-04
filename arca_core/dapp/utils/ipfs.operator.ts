import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });


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
    }

    let fileCid

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
      uploadRequest
    }
  }



}
