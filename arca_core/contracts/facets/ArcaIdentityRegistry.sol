// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {LibArcaDiamondStorage as LibADS} from  "../libraries/LibArcaDiamondStorage.sol";


contract ArcaIdentityRegistry{

  LibADS.DiamondStorage internal ds;


  /////////////////////////////////////////////////////////////////
  // MODIFIERS
  modifier onlyAdmin(){
    require(ds.isAdmin[msg.sender] == true, LibADS.AuthorizationError("Not an Arca admin"));
    _;
  }

  function addAdmin()public onlyAdmin{
    ds.isAdmin[msg.sender] = true;
  }

  function removeAdmin()public onlyAdmin{
    ds.isAdmin[msg.sender] = false;
  }

  function registerPatient(bytes32 _registeredAt) public {
    require(ds.accountExists[msg.sender] == false, LibADS.AccountExistsError(msg.sender));
    uint256 patientCount = ds.patientCount;
    patientCount++;
    ds.patientCount = patientCount;
    ds.patientIdentity[patientCount] = LibADS.PatientIdentity({
      primaryAddress: msg.sender,
      linkedAddresses: new address[](0), // an empty address array
      registeredAt: _registeredAt,
      isVerified: false,
      guardians: new address[](0), // an empty address array
      guardiansRequired: 0
    });
    ds.accountExists[msg.sender] = true;
    emit LibADS.PatientRegisteredEvent("Patient registered", ds.patientIdentity[patientCount]);
  }

  // register patient if they want to operate with multiple addresses
  function registerPatientWithLinkedAddresses(
    address[] memory _linkedAddresses, 
    bytes32 _registeredAt
    ) public {
    require(ds.accountExists[msg.sender] == false, LibADS.AccountExistsError(msg.sender));
    uint256 patientCount = ds.patientCount;
    patientCount++;
    ds.patientCount = patientCount;
    ds.patientIdentity[patientCount] = LibADS.PatientIdentity({
      primaryAddress: msg.sender,
      linkedAddresses: _linkedAddresses,
      registeredAt: _registeredAt,
      isVerified: false,
      guardians: new address[](0), // an empty address array
      guardiansRequired: 0
    });
    ds.accountExists[msg.sender] = true;
    emit LibADS.PatientRegisteredEvent("Patient registered", ds.patientIdentity[patientCount]);
  }

  // register patients with social recovery guardians
  function registerPatientWithLinkedAddressAndGuardians(
    address [] memory _linkedAddresses, 
    uint8 _guardiansRequired,
    address[] memory _guardians,
    bytes32 _registeredAt
  ) public {
    require(ds.accountExists[msg.sender] == false, LibADS.AccountExistsError(msg.sender));
    require(_guardians.length == _guardiansRequired, LibADS.IncorrectGuardianCountMatchError("Number of guardian address must equal guardians required"));
    address[] memory linkedAddresses;
    if(_linkedAddresses.length == 0){
      linkedAddresses = new address[](0);
    }
    else{
      linkedAddresses = _linkedAddresses;
    }
    uint256 patientCount = ds.patientCount;
    patientCount++;
    ds.patientCount = patientCount;
    ds.patientIdentity[patientCount] = LibADS.PatientIdentity({
      primaryAddress: msg.sender,
      linkedAddresses: linkedAddresses,
      registeredAt: _registeredAt,
      isVerified: false,
      guardians: _guardians,
      guardiansRequired: _guardiansRequired
    });
    ds.accountExists[msg.sender] = true;
    emit LibADS.PatientRegisteredEvent("Patient registered", ds.patientIdentity[patientCount]);
  }


  function getPatientIdentity(address _patientAddress)public returns(LibADS.PatientIdentity memory){
    LibADS.PatientIdentity memory patient = ds.patientAccount[_patientAddress];
    emit LibADS.PatientIdentityFetchedEvent("Patient identity fetched", patient);
    return patient;
  }


  function verifyPatientIdentity(address _patientAddress)public onlyAdmin{
    LibADS.PatientIdentity storage patient = ds.patientAccount[_patientAddress];
    patient.isVerified = true;
    emit LibADS.PatientIdentityVerifiedEvent("Patient identity verified", patient);
  }

  function getIdentityCount()public view returns(uint256 _patientCount, uint256 _providerCount){
    _patientCount = ds.patientCount;
    _providerCount = ds.providerCount;
    return (_patientCount, _providerCount);
  }

}