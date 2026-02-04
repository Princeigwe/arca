// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

contract ArcaProxy{
 //* PROXY GATEWAY GLOBAL VARIABLES
  mapping(address => bool) isAdmin;
  address immutable proxyAdmin;
  address arcaIdentityRegistryImplementationAddress;

  //////////////////////////////////////////////////////

  //* ARCA_IDENTITY_REGISTRY STORAGE VARIABLES

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

  ////////////////////////////////////////////////////////////////////


  constructor(address _proxyAdmin){
    proxyAdmin = _proxyAdmin;
  }

  fallback(bytes calldata data)external returns(bytes memory){
    if(msg.sender == proxyAdmin){
      // logic to switch to new version of implementation contract
    }
    else{
      // delegatecall to implementation contract
    }
  }
}