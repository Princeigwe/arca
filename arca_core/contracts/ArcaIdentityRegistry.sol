// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;


contract ArcaIdentityRegistry{

  uint256 patientCount;
  uint256 providerCount;

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
    address[] linkedAddresses; //optional input on identity registration
    uint32 registeredAt;
    bool isVerified;
    address[] guardians; //optional input on identity registration
    uint8 guardiansRequired; //optional input on identity registration
  }


  struct ProviderIdentity{
    address primaryAddress;
    address[] linkedAddresses; //optional input on identity registration
    uint32 registeredAt;
    bool isVerified;
    address[] guardians; //optional input on identity registration
    uint8 guardiansRequired;  //optional input on identity registration
    bytes LicenseHash;
    uint32 licenseExpiresAt;
    bool licenseIsExpired;
  }


  // MAPPINGS
  mapping (address => PatientIdentity) patientAccount;
  mapping (address => bool) accountExists;


  // EVENTS
  event PatientRegisteredEvent(string message, PatientIdentity);


  // ERRORS
  error AccountExistsError(address caller);
  error IncorrectGuardianCountMatchError(string);



  function registerPatient(uint32 _registeredAt) public {
    require(accountExists[msg.sender] == false, AccountExistsError(msg.sender));
    PatientIdentity memory patient = PatientIdentity({
      primaryAddress: msg.sender,
      linkedAddresses: new address[](0), // an empty address array
      registeredAt: _registeredAt,
      isVerified: false,
      guardians: new address[](0), // an empty address array
      guardiansRequired: 0
    });
    emit PatientRegisteredEvent("Patient registered", patient);
  }

  // register patient if they want to operate with multiple addresses
  function registerPatientWithLinkedAddresses(
    address[] memory _linkedAddresses, 
    uint32 _registeredAt
    ) public {
    require(accountExists[msg.sender] == false, AccountExistsError(msg.sender));
    PatientIdentity memory patient = PatientIdentity({
      primaryAddress: msg.sender,
      linkedAddresses: _linkedAddresses,
      registeredAt: _registeredAt,
      isVerified: false,
      guardians: new address[](0), // an empty address array
      guardiansRequired: 0
    });
    emit PatientRegisteredEvent("Patient registered", patient);
  }

  // register patients with social recovery guardians
  function registerPatientWithLinkedAddressAndGuardians(
    address [] memory _linkedAddresses, 
    uint8 _guardiansRequired,
    address[] memory _guardians,
    uint32 _registeredAt
  ) public {
    require(accountExists[msg.sender] == false, AccountExistsError(msg.sender));
    require(_guardians.length == _guardiansRequired, IncorrectGuardianCountMatchError("Number of guardian address must equal guardians required"));
    address[] memory linkedAddresses;
    if(_linkedAddresses.length == 0){
      linkedAddresses = new address[](0);
    }
    else{
      linkedAddresses = _linkedAddresses;
    }
    PatientIdentity memory patient = PatientIdentity({
      primaryAddress: msg.sender,
      linkedAddresses: linkedAddresses,
      registeredAt: _registeredAt,
      isVerified: false,
      guardians: _guardians,
      guardiansRequired: _guardiansRequired
    });
    emit PatientRegisteredEvent("Patient registered", patient);
  }

}