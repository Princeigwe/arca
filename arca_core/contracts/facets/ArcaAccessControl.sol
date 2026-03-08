// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {LibArcaDiamondStorage as LibADS} from  "../libraries/LibArcaDiamondStorage.sol";


contract ArcaAccessControl {
  //todo: function requestAccessToPatientIdentityData(address _providerAddress, address _patientAddress) public {}

  //todo: function grantAccessToPatientIdentityData() public {}

  //todo: function revokeAccessToPatientIdentityData() public {}

  function verifyAccessToPatientIdentityData(address _requester, address _mainPatientAddress) public view returns(bool){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.accountExists[_mainPatientAddress], LibADS.AccountDoesNotExistError(_mainPatientAddress));
    bool hasAccess = false;
    if(
      ds.isAdmin[_requester] || // admins have access to all patient identities
      _requester == _mainPatientAddress ||  // patients have access to their own identity
      ds.primaryAccountOf[_requester] == _mainPatientAddress || // secondary accounts have access to the primary patient's identity
      ds.isMedicalGuardianOfPatient[_requester][_mainPatientAddress] // medical guardians have access to a patient's identity
      ){
      hasAccess = true;
    }
    return hasAccess;
  }

  //tod:  function preAuthorizeAccessToPatientIdentityData() public {}

  //todo: function usePreAuthorizedAccessToPatientIdentityData() public {}

  //todo: add function to assign a medical guardian to a minor patient. (the sender is a primary medical guardian)

  //todo: add function to update medical guardian permissions on patient identity

  //todo: add function to revoke medical guardian access to patient identity

  //function to see medical guardian permissions on patient identity
  function getMedicalPermission(address _medicalGuardian, address _patient)  public view returns(LibADS.MedicalGuardianPermission memory _medicalGuardianPermission) {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.accountExists[_patient], LibADS.AccountDoesNotExistError(_patient));
    require(ds.isMedicalGuardianOfPatient[_medicalGuardian][_patient], LibADS.AuthorizationError('Sender is not a medical guardian to patient'));
    _medicalGuardianPermission = ds.medicalGuardianPermissionsOnPatient[_medicalGuardian][_patient]; 
  }

  //** function for a medical guardian to see all permissions they have 
  function getMyMedicalGuardianPermissions() public view returns(LibADS.MedicalGuardianPermission[] memory _medicalGuardianPermissions){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.medicalGuardianExists[msg.sender], LibADS.AuthorizationError('A medical guardian entity does not exist for this sender'));
    _medicalGuardianPermissions = ds.medicalGuardianPermissions[msg.sender];
  }
}