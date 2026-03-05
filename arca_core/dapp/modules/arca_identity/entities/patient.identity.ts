import { Gender } from "../enums/gender.enum";
import { EmploymentStatus } from "../enums/employment.status.enum";

export class PatientIdentity {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  nationalID: string
  homeAddress: string;
  employmentStatus: EmploymentStatus



  constructor(
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    gender: Gender,
    nationalID: string,
    homeAddress: string,
    employmentStatus: EmploymentStatus
  ) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.dateOfBirth = dateOfBirth;
    this.gender = gender;
    this.nationalID = nationalID;
    this.homeAddress = homeAddress;
    this.employmentStatus = employmentStatus;
  }
}