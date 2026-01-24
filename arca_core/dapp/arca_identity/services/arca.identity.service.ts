import { IPFS } from "../entities/base.entity.type";
import { PatientIdentity } from "../entities/patient.identity";
import { Gender } from "../enums/gender.enum";
import { EmploymentStatus } from "../enums/employment.status.enum";
import { IpfsFileWriter } from "../../utils/ipfs.file.writer";

import {
  PutObjectCommand,
  S3Client,
  ListObjectsV2Command,
  ObjectCannedACL,
} from "@aws-sdk/client-s3";
import { BucketManager, ObjectManager } from "@filebase/sdk";

const dotenv = require("dotenv");
const path = require("path");

let filesPath = "../../files/";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const ipfsFileWriter = new IpfsFileWriter();

const storageType = PatientIdentity.name;

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

export class ArcaIdentityService {
  async registerPatient(
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    gender: Gender,
    nationalID: string,
    homeAddress: string,
    employmentStatus: EmploymentStatus,
  ) {
    const identityData = new PatientIdentity(
      firstName,
      lastName,
      dateOfBirth,
      gender,
      nationalID,
      homeAddress,
      employmentStatus,
    );
    const data = new IPFS(storageType, identityData);
    const jsonData = JSON.stringify(data);

    const params = {
      Bucket: bucket,
      Key: `Patent-Identity-${firstName}-${lastName}.json`,
      Body: jsonData,
      ContentType: "application/json",
    };
    const command = new PutObjectCommand(params);
    command.middlewareStack.add((next) => async (args) => {
      const response = await next(args);
      console.log("Command Response...: ", response);
      const cid = (response.response as any).headers["x-amz-meta-cid"];
      console.log("CID: ", cid)
      return response;
    });
    const request = await s3Client.send(command);
    console.log("Filebase upload response: ", request);

    // const objectList = await s3Client.send(
    //   new ListObjectsV2Command({
    //     Bucket: bucket,
    //     MaxKeys: 1,
    //   }),
    // );
    // console.dir(objectList);
  }
}

const arcaIdentityService = new ArcaIdentityService();

const patient = new PatientIdentity(
  "John",
  "Doe",
  new Date(),
  Gender.MALE,
  "123456789",
  "123 Main St",
  EmploymentStatus.STUDENT,
);
arcaIdentityService.registerPatient(
  "John",
  "Doe",
  new Date(),
  Gender.MALE,
  "123456789",
  "123 Main St",
  EmploymentStatus.STUDENT,
);
