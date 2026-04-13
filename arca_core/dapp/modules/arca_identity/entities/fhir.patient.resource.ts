import { Gender } from "../enums/gender.enum";
import { EmploymentStatus } from "../enums/employment.status.enum";
import crypto from "crypto";


const arcaDiamondAddress = process.env.ARCA_DIAMOND_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"

export class FhirPatient {
  walletAddress: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: Gender
  homeAddress?: string
  cityOfResidence?: string
  stateOfResidence?: string
  countryOfResidence?: string
  employmentStatus?: EmploymentStatus
  telephone?: string
  email?: string



  constructor(
    walletAddress: string,
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    gender: Gender,
    homeAddress?: string,
    cityOfResidence?: string,
    stateOfResidence?: string,
    countryOfResidence?: string,
    employmentStatus?: EmploymentStatus,
    telephone?: string,
    email?: string
  ) {
    this.walletAddress = walletAddress;
    this.firstName = firstName;
    this.lastName = lastName;
    this.dateOfBirth = dateOfBirth;
    this.gender = gender;
    this.homeAddress = homeAddress;
    this.cityOfResidence = cityOfResidence;
    this.stateOfResidence = stateOfResidence;
    this.countryOfResidence = countryOfResidence;
    this.employmentStatus = employmentStatus;
    this.telephone = telephone;
    this.email = email;
  }


  generateId(firstName: string, lastName: string) {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(4).toString("hex");

    const input = `${firstName}${lastName}${timestamp}${random}`;

    const hash = crypto
      .createHash("sha256")
      .update(input)
      .digest("hex");

    return hash.slice(0, 16);
  }


  constructResource(){
    const id = this.generateId(this.firstName, this.lastName)
    return{
      resourceType: "Patient",
      id: id,
      identifier: [
        {
          system: `arca/${arcaDiamondAddress}/patient-ids`,
          value: this.walletAddress
        }
      ],
      active: true,
      name: [
        {
          use: "official",
          family: this.lastName,
          given: [this.firstName]
        }
      ],
      gender: this.gender,
      birthDate: this.dateOfBirth.toISOString().split("T")[0],
      telecom: [
        {
          system: "phone",
          value: this.telephone,
          use: "mobile"
        },
        {
          system: "email",
          value: this.email
        }
      ],
      address: [
        {
          text: this.homeAddress,
          city: this.cityOfResidence,
          state: this.stateOfResidence,
          country: this.countryOfResidence
        }
      ]
    }
  }
}