// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;


contract ArcaIdentityRegistry{

  //ENUMS
  enum ProviderType{
    GENERAL_PRACTITIONER,
    SPECIALIST,
    NURSE,
    PHARMACIST,
    THERAPIST,
    EMERGENCY_SERVICES,
    RESEARCHER
  }

  // STRUCTS
  struct PatientIdentity{
    address primaryAddress;
    address[] linkedAddress;
    uint32 registeredAt;
    bool isVerified;
    address guardians;
    address guardiansRequired;
  }


  struct ProviderIdentity{
    address primaryAddress;
    address[] linkedAddress;
    uint32 registeredAt;
    bool isVerified;
    address guardians;
    address guardiansRequired;
    bytes LicenseHash;
    uint32 licenseExpiredAt;
  }


  // EVENTS



  // ERRORS


  function registerPatient() public {}
}