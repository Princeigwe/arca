// here, the fhir person resource type is used to hold references to related-person resource type, 
// where each related-person resource shows medical-care authority over minor patient, as a medical-guardian

import { Gender } from "../enums/gender.enum";
import { EmploymentStatus } from "../enums/employment.status.enum";
import crypto from "crypto";
import { FhirRelatedPerson } from "./fhir.related.person.resource";


export class FhirPerson{
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
    email?: string,
  ){
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

  generateId(walletAddress: string) {
    const input = `${walletAddress}`;
  
    const hash = crypto
      .createHash("sha256")
      .update(input)
      .digest("hex");
  
    return hash.slice(0, 16);
  }

  generateCompositeId(medicalGuardianAddress: string, patientWalletAddress: string){
    const input = `${medicalGuardianAddress}-${patientWalletAddress}`
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
      link: [] // this holds references to RelatedPerson resource type
      // todo: add extension attribute to hold employment status, if needed in future
    }
  }

  // this method adds a RelatedPerson resource type reference to the link
  updateAndAddRelatedPersonResourceReference(medicalGuardianAddress: string, patientWalletAddress: string, existingFhirData: any){
    const compositeId = this.generateCompositeId(medicalGuardianAddress, patientWalletAddress)
    const hashedPatientId = this.generateId(patientWalletAddress)

    const fhirRelatedPerson = new FhirRelatedPerson(
      this.walletAddress,
      this.firstName,
      this.lastName,
      this.dateOfBirth,
      this.gender,
      hashedPatientId,
      this.homeAddress,
      this.cityOfResidence,
      this.stateOfResidence,
      this.countryOfResidence,
      this.employmentStatus,
      this.telephone,
      this.email
    )

    const fhirRelatedPersonResource = fhirRelatedPerson.constructResource()

    // creating the related-person resource type reference
    const relatedPersonReference = {
      target: {
        reference: `RelatedPerson/${compositeId}`,
        display: `${this.firstName} ${this.lastName} - Medical Guardian for Patient #${hashedPatientId}`
      }
    }

    // adding the related-person resource type reference to 'link' attribute
    existingFhirData.link.push(relatedPersonReference)

    return{
      updatedFhirPersonResource: existingFhirData,
      relatedPersonResource: fhirRelatedPersonResource
    }
  }
}