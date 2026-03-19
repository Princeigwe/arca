// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {LibArcaDiamondStorage as LibADS} from  "../libraries/LibArcaDiamondStorage.sol";


/// @title THe Access Control Facet of Arca.
/// @author Prince Igwenagha
/// @notice  Responsible for managing access control to on-chain data
contract ArcaAccessControl {
  //todo: function requestAccessToPatientIdentityData(address _providerAddress, address _patientAddress) public {}

  //todo: function grantAccessToPatientIdentityData() public {}

  //todo: function revokeAccessToPatientIdentityData() public {}

  /// @notice This verifies if a requester has access to a patient's identity data
  /// @param _requester This is the user making the request to access a patient's identity data
  /// @param _mainPatientAddress THis is the main address of the patient for which data is being request for
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
  function assignMedicalGuardian(
    address _medicalGuardian,
    address _mainPatientAddress,
    bool _canGrantProviderAccess,
    bool _canGrantGuardianAccess,
    bool _canRevokeProviderAccess,
    bool _canRevokeGuardianAccess,
    bool _canUploadRecords,
    bool _canReadRecords,
    bool _canDeleteRecords
  )public{
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(
      ds.isMedicalGuardianOfPatient[msg.sender][_mainPatientAddress], 
      LibADS.AuthorizationError("Error assigning medical guardian: Sender is not a medical guardian to the patient")
    );
  }

  //todo: add function to update medical guardian permissions on patient identity. (the sender is a primary medical guardian)

  //todo: add function to revoke/remove medical guardian access to patient identity. (the sender is a primary medical guardian)

  /// @notice This function is used to see medical guardian permissions on patient identity. It is required that the sender is also a medical guardian to the patient.
  /// @param _medicalGuardian The address of the medical guardian.
  /// @param _patient The primary address of the patient.
  function getMedicalPermission(address _medicalGuardian, address _patient)  public view returns(LibADS.MedicalGuardianPermission memory _medicalGuardianPermission) {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.accountExists[_patient], LibADS.AccountDoesNotExistError(_patient));
    require(
      ds.isMedicalGuardianOfPatient[_medicalGuardian][_patient], 
      LibADS.AuthorizationError('Error getting medical permission: Sender is not a medical guardian to patient')
    );
    _medicalGuardianPermission = ds.medicalGuardianPermissionsOnPatient[_medicalGuardian][_patient]; 
  }


  /// @notice This function is used for a medical guardian(current sender) to see all permissions they have.
  function getMyMedicalGuardianPermissions() public view returns(LibADS.MedicalGuardianPermission[] memory _medicalGuardianPermissions){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(
      ds.medicalGuardianExists[msg.sender], 
      LibADS.AuthorizationError('Error getting current medical guardian permissions: Medical guardian entity does not exist for this sender')
    );
    _medicalGuardianPermissions = ds.medicalGuardianPermissions[msg.sender];
  }
}