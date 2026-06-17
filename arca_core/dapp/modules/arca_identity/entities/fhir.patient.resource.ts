import { Gender } from "../enums/gender.enum";
import { EmploymentStatus } from "../enums/employment.status.enum";
import { FhirMedicalGuardianRelationshipRoleType } from "../enums/fhir.personal.relationship.role.type.enum";
import crypto from "crypto";


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

  medicalGuardian1HashedId?: string
  medicalGuardian1FirstName?: string
  medicalGuardian1LastName?: string
  medicalGuardian1Telephone?: string
  medicalGuardian1HomeAddress?: string
  medicalGuardian1CityOfResidence?: string
  medicalGuardian1StateOfResidence?: string
  medicalGuardian1CountryOfResidence?: string
  medicalGuardian1Relationship?: FhirMedicalGuardianRelationshipRoleType

  medicalGuardian2HashedId?: string
  medicalGuardian2FirstName?: string
  medicalGuardian2LastName?: string
  medicalGuardian2Telephone?: string
  medicalGuardian2HomeAddress?: string
  medicalGuardian2CityOfResidence?: string
  medicalGuardian2StateOfResidence?: string
  medicalGuardian2CountryOfResidence?: string
  medicalGuardian2Relationship?: FhirMedicalGuardianRelationshipRoleType


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
    email?: string,

    medicalGuardian1HashedId?: string,
    medicalGuardian1FirstName?: string,
    medicalGuardian1LastName?: string,
    medicalGuardian1Telephone?: string,
    medicalGuardian1Relationship?: FhirMedicalGuardianRelationshipRoleType,
    medicalGuardian1HomeAddress?: string,
    medicalGuardian1CityOfResidence?: string,
    medicalGuardian1StateOfResidence?: string,
    medicalGuardian1CountryOfResidence?: string,

    medicalGuardian2HashedId?: string,
    medicalGuardian2FirstName?: string,
    medicalGuardian2LastName?: string,
    medicalGuardian2Telephone?: string,
    medicalGuardian2Relationship?: FhirMedicalGuardianRelationshipRoleType,
    medicalGuardian2HomeAddress?: string,
    medicalGuardian2CityOfResidence?: string,
    medicalGuardian2StateOfResidence?: string,
    medicalGuardian2CountryOfResidence?: string,
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

    this.medicalGuardian1HashedId = medicalGuardian1HashedId
    this.medicalGuardian1FirstName = medicalGuardian1FirstName;
    this.medicalGuardian1LastName = medicalGuardian1LastName;
    this.medicalGuardian1Telephone = medicalGuardian1Telephone;
    this.medicalGuardian1Relationship = medicalGuardian1Relationship;
    this.medicalGuardian1HomeAddress = medicalGuardian1HomeAddress;
    this.medicalGuardian1CityOfResidence = medicalGuardian1CityOfResidence;
    this.medicalGuardian1StateOfResidence = medicalGuardian1StateOfResidence;
    this.medicalGuardian1CountryOfResidence = medicalGuardian1CountryOfResidence;

    this.medicalGuardian2HashedId = medicalGuardian2HashedId
    this.medicalGuardian2FirstName = medicalGuardian2FirstName;
    this.medicalGuardian2LastName = medicalGuardian2LastName;
    this.medicalGuardian2Telephone = medicalGuardian2Telephone;
    this.medicalGuardian2Relationship = medicalGuardian2Relationship;
    this.medicalGuardian2HomeAddress = medicalGuardian2HomeAddress;
    this.medicalGuardian2CityOfResidence = medicalGuardian2CityOfResidence;
    this.medicalGuardian2StateOfResidence = medicalGuardian2StateOfResidence;
    this.medicalGuardian2CountryOfResidence = medicalGuardian2CountryOfResidence;

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
      resourceType: "Patient",
      id: id,
      identifier: [
        {
          system: 'urn:arca:patient:did',
          value: `did:ethr:${this.walletAddress}`
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
      ],
      // this contains the contact of a patient, for example their, guardian, next of kin, emergency contact etc. 
      contact: [
        // medical guardian 1 details
        {
          name: [
            {
              use: "official",
              family: this.medicalGuardian1LastName,
              given: [this.medicalGuardian1FirstName]
            }
          ],
          telecom: [
            {
              system: "phone",
              value: this.medicalGuardian1Telephone,
              use: "mobile"
            }
          ],
          address: [
            {
              text: this.medicalGuardian1HomeAddress,
              city: this.medicalGuardian1CityOfResidence,
              state: this.medicalGuardian1StateOfResidence,
              country: this.medicalGuardian1CountryOfResidence
            }
          ],
          relationship: [
            {
              coding: [
                {
                  system: "https://terminology.hl7.org/7.2.0/en/ValueSet-v3-PersonalRelationshipRoleType.html",
                  code: Object.keys(FhirMedicalGuardianRelationshipRoleType)[Object.values(FhirMedicalGuardianRelationshipRoleType).indexOf(this.medicalGuardian1Relationship!)] || null,
                  display: this.medicalGuardian1Relationship
                }
              ]
            }
          ]
        },

        // medical guardian 2 details
        {
          name: [
            {
              use: "official",
              family: this.medicalGuardian2LastName,
              given: [this.medicalGuardian2FirstName]
            }
          ],
          telecom: [
            {
              system: "phone",
              value: this.medicalGuardian2Telephone,
              use: "mobile"
            }
          ],
          address: [
            {
              text: this.medicalGuardian2HomeAddress,
              city: this.medicalGuardian2CityOfResidence,
              state: this.medicalGuardian2StateOfResidence,
              country: this.medicalGuardian2CountryOfResidence
            }
          ],
          relationship: [
            {
              coding: [
                {
                  system: "https://terminology.hl7.org/7.2.0/en/ValueSet-v3-PersonalRelationshipRoleType.html",
                  code: Object.keys(FhirMedicalGuardianRelationshipRoleType)[Object.values(FhirMedicalGuardianRelationshipRoleType).indexOf(this.medicalGuardian2Relationship!)] || null,
                  display: this.medicalGuardian2Relationship
                }
              ]
            }
          ]
        }
      ],
      link: [
        // this holds references to RelatedPerson resource type
        {
          target: {
            reference: `RelatedPerson/${this.medicalGuardian1HashedId}`,
            display: `${this.medicalGuardian1FirstName} ${this.medicalGuardian1LastName} - Medical Guardian for Patient #${id}`
          }
        },
        {
          target: {
            reference: `RelatedPerson/${this.medicalGuardian2HashedId}`,
            display: `${this.medicalGuardian2FirstName} ${this.medicalGuardian2LastName} - Medical Guardian for Patient #${id}`
          }
        }
      ],
      extension: [
        {
          url: "arca/extensions/employment-status",
          valueString: this.employmentStatus
        },
      ]
    }
  }
}