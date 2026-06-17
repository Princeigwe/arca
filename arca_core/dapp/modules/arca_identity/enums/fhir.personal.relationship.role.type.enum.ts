// Reference: https://terminology.hl7.org/7.2.0/en/ValueSet-v3-PersonalRelationshipRoleType.html


// medical guardian relationship to minor patient
export enum FhirMedicalGuardianRelationshipRoleType {
  FAMMEMB = 'family member',
  AUNT = 'aunt',
  UNCLE = 'uncle',
  FTH = 'father',
  MTH = 'mother',
  GRFTH = 'grandfather',
  GRMTH = 'grandmother',
}


export enum FhirMinorPatientGuardianRelationshipRoleType {
  DAU = 'daughter',
  SONC = 'son',
  SONADOPT = 'adopted son',
  DAUADOPT = 'adopted daughter',
  COUSN = 'cousin',
  NEPHEW = 'nephew',
  NIECE = 'niece',
  SIB = 'sibling',
  STEPSIB = 'step sibling',
}