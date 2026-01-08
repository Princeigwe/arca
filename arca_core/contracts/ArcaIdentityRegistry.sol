// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;


contract ArcaIdentityRegistry{
  // Proxy Gateway Admin Mapping
  mapping(address => bool) isAdmin;


  //* ArcaIdentityRegistry storage variables

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
    bytes32 registeredAt;
    bool isVerified;
    address[] guardians; //optional input on identity registration
    uint8 guardiansRequired; //optional input on identity registration
  }


  struct ProviderIdentity{
    address primaryAddress;
    address[] linkedAddresses; //optional input on identity registration
    bytes32 registeredAt;
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
  event PatientIdentityVerifiedEvent(string message, PatientIdentity);
  event PatientIdentityFetchedEvent(string message, PatientIdentity);



  // ERRORS
  error AccountExistsError(address caller);
  error IncorrectGuardianCountMatchError(string);
  error AuthorizationError(string);

  /////////////////////////////////////////////////////////////////
  // MODIFIERS
  modifier onlyAdmin(){
    require(isAdmin[msg.sender] == true, AuthorizationError("Not an Arca admin"));
    _;
  }

  function addAdmin()public onlyAdmin{
    isAdmin[msg.sender] = true;
  }

  function removeAdmin()public onlyAdmin{
    isAdmin[msg.sender] = false;
  }

  function registerPatient(bytes32 _registeredAt) public {
    require(accountExists[msg.sender] == false, AccountExistsError(msg.sender));
    PatientIdentity memory patient = PatientIdentity({
      primaryAddress: msg.sender,
      linkedAddresses: new address[](0), // an empty address array
      registeredAt: _registeredAt,
      isVerified: false,
      guardians: new address[](0), // an empty address array
      guardiansRequired: 0
    });
    patientCount++;
    accountExists[msg.sender] = true;
    emit PatientRegisteredEvent("Patient registered", patient);
  }

  // register patient if they want to operate with multiple addresses
  function registerPatientWithLinkedAddresses(
    address[] memory _linkedAddresses, 
    bytes32 _registeredAt
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
    patientCount++;
    accountExists[msg.sender] = true;
    emit PatientRegisteredEvent("Patient registered", patient);
  }

  // register patients with social recovery guardians
  function registerPatientWithLinkedAddressAndGuardians(
    address [] memory _linkedAddresses, 
    uint8 _guardiansRequired,
    address[] memory _guardians,
    bytes32 _registeredAt
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
    patientCount++;
    accountExists[msg.sender] = true;
    emit PatientRegisteredEvent("Patient registered", patient);
  }


  function getPatientIdentity(address _patientAddress)public returns(PatientIdentity memory){
    PatientIdentity memory patient = patientAccount[_patientAddress];
    emit PatientIdentityFetchedEvent("Patient identity fetched", patient);
    return patient;
  }


  function verifyPatientIdentity(address _patientAddress)public onlyAdmin{
    PatientIdentity storage patient = patientAccount[_patientAddress];
    patient.isVerified = true;
    emit PatientIdentityVerifiedEvent("Patient identity verified", patient);
  }

  function getIdentityCount()public view returns(uint256 _patientCount, uint256 _providerCount){
    _patientCount = patientCount;
    _providerCount = providerCount;
    return (_patientCount, _providerCount);
  }

}