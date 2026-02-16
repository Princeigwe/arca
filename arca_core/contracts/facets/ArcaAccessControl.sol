// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {LibArcaDiamondStorage as LibADS} from  "../libraries/LibArcaDiamondStorage.sol";


contract ArcaAccessControl {
  // function requestAccessToPatientIdentityData(address _patientAddress, address _providerAddress) public {}

  // function grantAccessToPatientIdentityData() public {}

  // function revokeAccessToPatientIdentityData() public {}

  function verifyAccessToPatientIdentityData(address _requester, address _mainPatientAddress) public view returns(bool){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.accountExists[_mainPatientAddress], LibADS.AccountDoesNotExistError(_mainPatientAddress));
    bool hasAccess = false;
    if(
      ds.isAdmin[_requester] ||
      _requester == _mainPatientAddress || 
      ds.primaryAccountOf[_requester] == _mainPatientAddress
      ){
      hasAccess = true;
    }
    return hasAccess;
  }

  // function preAuthorizeAccessToPatientIdentityData() public {}

  // function usePreAuthorizedAccessToPatientIdentityData() public {}
}