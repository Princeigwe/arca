// Relationship Code System Reference:  https://terminology.hl7.org/7.2.0/en/CodeSystem-v3-RoleCode.html

import { Gender } from "../enums/gender.enum";
import { EmploymentStatus } from "../enums/employment.status.enum";
import crypto from "crypto";


export class FhirRelatedPerson{
  walletAddress: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: Gender
  hashedPatientId: string
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
    hashedPatientId: string,
    homeAddress?: string,
    cityOfResidence?: string,
    stateOfResidence?: string,
    countryOfResidence?: string,
    employmentStatus?: EmploymentStatus,
    telephone?: string,
    email?: string,
  ){
    this.walletAddress = walletAddress;
    this.firstName = firstName;
    this.lastName = lastName;
    this.dateOfBirth = dateOfBirth;
    this.gender = gender;
    this.hashedPatientId = hashedPatientId;
    this.homeAddress = homeAddress;
    this.cityOfResidence = cityOfResidence;
    this.stateOfResidence = stateOfResidence;
    this.countryOfResidence = countryOfResidence;
    this.employmentStatus = employmentStatus;
    this.telephone = telephone;
    this.email = email;
  }


  generateId(walletAddress: string) {
    const input = `${walletAddress}`;
  
    const hash = crypto
      .createHash("sha256")
      .update(input)
      .digest("hex");
  
    return hash.slice(0, 16);
  }

  constructResource(){
    const id = this.generateId(this.walletAddress)
    return{
      resourceType: "Person",
      id: id,
      identifier: [
        {
          system: 'urn:arca:medical-guardian:did',
          value: `did:ethr:${this.walletAddress}`
        }
      ],
      active: true,
      patient: {
        reference: `Patient/${this.hashedPatientId}`
      },
      relationship: [
        {
          coding: [
            {
              system: 'https://terminology.hl7.org/7.2.0/en/CodeSystem-v3-RoleCode.html',
              code: 'GUARD',
              display: 'Guardian'
            }
          ]
        }
      ],
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