// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {LibArcaDiamondStorage as LibADS} from  "../libraries/LibArcaDiamondStorage.sol";


contract ArcaAccessControl {
  // function requestAccessToPatientIdentityData(address _providerAddress, address _patientAddress) public {}

  // function grantAccessToPatientIdentityData() public {}

  // function revokeAccessToPatientIdentityData() public {}

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

  // function preAuthorizeAccessToPatientIdentityData() public {}

  // function usePreAuthorizedAccessToPatientIdentityData() public {}


  //todo: add function to update medical guardian permissions on patient identity

  //todo: add function to revoke medical guardian access to patient identity
}