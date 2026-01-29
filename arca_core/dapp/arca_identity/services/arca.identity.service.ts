import { IPFS } from "../entities/base.entity.type";
import { PatientIdentity } from "../entities/patient.identity";
import { Gender } from "../enums/gender.enum";
import { EmploymentStatus } from "../enums/employment.status.enum";
import { IpfsOperator } from "../../utils/ipfs.operator";

// const dotenv = require("dotenv");
// const path = require("path");


// dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const ipfsOperator = new IpfsOperator();

const storageType = PatientIdentity.name;


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

    const fileName: string = `Patent-Identity-${firstName}-${lastName}.json`
    const uploadJsonData = await ipfsOperator.uploadJsonData(fileName, jsonData)
    console.log("Filebase upload response: ", uploadJsonData);

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
