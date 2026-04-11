// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {LibArcaDiamondStorage as LibADS} from  "../libraries/LibArcaDiamondStorage.sol";


/// @title THe Access Control Facet of Arca.
/// @author Prince Igwenagha
/// @notice  Responsible for managing access control to on-chain data
contract ArcaAccessControl {

  function arcaIdentityRegistryFacetRegisterMedicalGuardian(address _guardianAddress, uint256 _addedAt, address _addedBy) public {
    (bool success, ) = address(this).call(abi.encodeWithSignature("registerMedicalGuardian(address,uint256,address)", _guardianAddress, _addedAt, _addedBy));
    if(!success){
      revert("Something went wrong with registering medical guardian to identity registry facet");
    }
  }
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

  /// @notice This add function to assign a medical guardian to a minor patient. (the sender must be a primary medical guardian).
  /// @param _medicalGuardian The address of the medical guardian to be assigned to the primary patient address. 
  /// @param _mainPatientAddress The primary patient address.
  /// @param _role The medical guardian role to be assigned.
  /// @param _canGrantProviderAccess permission.
  /// @param _canGrantGuardianAccess permission.
  /// @param _canRevokeProviderAccess permission.
  /// @param _canRevokeGuardianAccess permission.
  /// @param _canUploadRecords permission.
  /// @param _canReadRecords permission.
  /// @param _canDeleteRecords permission.
  /// @param _rsaMasterDekForMedicalGuardian the RSA master DEK for the new medical guardian
  /// @param _cid the updated IPFS content identifier of the patient's data
  function assignMedicalGuardian(
    address _medicalGuardian,
    address _mainPatientAddress,
    LibADS.MedicalGuardianRole _role,
    bool _canGrantProviderAccess,
    bool _canGrantGuardianAccess,
    bool _canRevokeProviderAccess,
    bool _canRevokeGuardianAccess,
    bool _canUploadRecords,
    bool _canReadRecords,
    bool _canDeleteRecords,
    bytes memory _rsaMasterDekForMedicalGuardian, 
    bytes memory _cid
  )public{
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.accountExists[_mainPatientAddress], LibADS.AccountDoesNotExistError(_mainPatientAddress));
    require(
      ds.medicalGuardianExists[msg.sender], 
      LibADS.AuthorizationError('Error assigning medical guardian: Medical guardian entity does not exist for this sender')
    );
    require(
      ds.isMedicalGuardianOfPatient[msg.sender][_mainPatientAddress], 
      LibADS.AuthorizationError("Error assigning medical guardian: Sender is not a medical guardian to the patient")
    );
    require(
      ds.medicalGuardianPermissionsOnPatient[msg.sender][_mainPatientAddress].role == LibADS.MedicalGuardianRole.PRIMARY,
      LibADS.AuthorizationError("Error assigning medical guardian: Sender is not a primary medical guardian to the patient")
    );
    if(_role !=  LibADS.MedicalGuardianRole.PRIMARY && (
      _canGrantProviderAccess ||
      _canGrantGuardianAccess ||
      _canRevokeProviderAccess ||
      _canRevokeGuardianAccess ||
      _canUploadRecords ||
      _canDeleteRecords
      // _canReadRecords  // this permission is allowed for a secondary medical guardian
    )){
      revert LibADS.AuthorizationError("Error assigning medical guardian to patient: Secondary guardian is not allowed to perform delicate action(s)");
    }

    // creating medical guardian entity if not already created for the medical guardian address
    if(!ds.medicalGuardianExists[_medicalGuardian]){
      arcaIdentityRegistryFacetRegisterMedicalGuardian(_medicalGuardian, block.timestamp, msg.sender);
    } 

    ds.isMedicalGuardianOfPatient[_medicalGuardian][_mainPatientAddress] = true;
    ds.patientMedicalGuardians[_mainPatientAddress].push(ds.medicalGuardianAccount[_medicalGuardian]);
    ds.medicalGuardianPermissionsOnPatient[_medicalGuardian][_mainPatientAddress] = LibADS.MedicalGuardianPermission({
      role: _role,
      guardian: _medicalGuardian,
      patient: _mainPatientAddress,
      canGrantProviderAccess: _canGrantProviderAccess,
      canGrantGuardianAccess: _canGrantGuardianAccess,
      canRevokeProviderAccess: _canRevokeProviderAccess,
      canRevokeGuardianAccess: _canRevokeGuardianAccess,
      canUploadRecords: _canUploadRecords,
      canReadRecords: _canReadRecords,
      canDeleteRecords: _canDeleteRecords
    });

    ds.medicalGuardianPermissions[_medicalGuardian].push(ds.medicalGuardianPermissionsOnPatient[_medicalGuardian][_mainPatientAddress]);

    // storing RSA encrypted DEK of the assigned medical guardian
    ds.patientAccount[_mainPatientAddress].rsaMasterDEKsForMedicalGuardians.push(LibADS.IdentityRSAMasterDEK({
      identity: _medicalGuardian,
      rsaMasterDEK: _rsaMasterDekForMedicalGuardian
    }));

    ds.addressCid[_mainPatientAddress] = _cid;

    emit LibADS.MedicalGuardianAssignedToPatientEvent(
      "Medical guardian assigned to patient", 
      _medicalGuardian, 
      _mainPatientAddress
    );
  }

  /// @notice This function is used to update medical guardian permissions on patient identity. (the sender is a primary medical guardian)
  /// @param _medicalGuardian The address of the medical guardian for which permissions are to be updated. 
  /// @param _mainPatientAddress The primary patient address.
  /// @param _role The medical guardian role to be assigned.
  /// @param _canGrantProviderAccess permission.
  /// @param _canGrantGuardianAccess permission.
  /// @param _canRevokeProviderAccess permission.
  /// @param _canRevokeGuardianAccess permission.
  /// @param _canUploadRecords permission.
  /// @param _canReadRecords permission.
  /// @param _canDeleteRecords permission.
  function updateMedicalGuardianPermission(
    address _medicalGuardian,
    address _mainPatientAddress,
    LibADS.MedicalGuardianRole _role,
    bool _canGrantProviderAccess,
    bool _canGrantGuardianAccess,
    bool _canRevokeProviderAccess,
    bool _canRevokeGuardianAccess,
    bool _canUploadRecords,
    bool _canReadRecords,
    bool _canDeleteRecords
  ) public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.accountExists[_mainPatientAddress], LibADS.AccountDoesNotExistError(_mainPatientAddress));
    require(
      ds.medicalGuardianExists[msg.sender], 
      LibADS.AuthorizationError('Error updating medical guardian permissions: Medical guardian entity does not exist for this sender')
    );
    require(
      ds.isMedicalGuardianOfPatient[msg.sender][_mainPatientAddress], 
      LibADS.AuthorizationError("Error updating medical guardian permissions: Sender is not a medical guardian to the patient")
    );
    require(
      ds.medicalGuardianPermissionsOnPatient[msg.sender][_mainPatientAddress].role == LibADS.MedicalGuardianRole.PRIMARY,
      LibADS.AuthorizationError("Error updating medical guardian permissions: Sender is not a primary medical guardian to the patient")
    );

    if(_role !=  LibADS.MedicalGuardianRole.PRIMARY && (
      _canGrantProviderAccess ||
      _canGrantGuardianAccess ||
      _canRevokeProviderAccess ||
      _canRevokeGuardianAccess ||
      _canUploadRecords ||
      _canDeleteRecords
      // _canReadRecords  // this permission is allowed for a secondary medical guardian
    )){
      revert LibADS.AuthorizationError("Error updating medical guardian permissions: Secondary guardian is not allowed to perform delicate action(s)");
    }

    ds.medicalGuardianPermissionsOnPatient[_medicalGuardian][_mainPatientAddress] = LibADS.MedicalGuardianPermission({
      role: _role,
      guardian: _medicalGuardian,
      patient: _mainPatientAddress,
      canGrantProviderAccess: _canGrantProviderAccess,
      canGrantGuardianAccess: _canGrantGuardianAccess,
      canRevokeProviderAccess: _canRevokeProviderAccess,
      canRevokeGuardianAccess: _canRevokeGuardianAccess,
      canUploadRecords: _canUploadRecords,
      canReadRecords: _canReadRecords,
      canDeleteRecords: _canDeleteRecords
    });

    emit LibADS.MedicalGuardianAssignedToPatientEvent(
      "Update on medical guardian permission to patient", 
      _medicalGuardian, 
      _mainPatientAddress
    );
  }

  //todo: add function to revoke/remove medical guardian access to patient identity. (the sender is a primary medical guardian)
  function revokeMedicalGuardianPermission(address _medicalGuardian, address _mainPatientAddress, bytes memory _cid) public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.accountExists[_mainPatientAddress], LibADS.AccountDoesNotExistError(_mainPatientAddress));
    require(
      ds.medicalGuardianExists[msg.sender], 
      LibADS.AuthorizationError('Error updating medical guardian permissions: Medical guardian entity does not exist for this sender')
    );
    require(
      ds.isMedicalGuardianOfPatient[msg.sender][_mainPatientAddress], 
      LibADS.AuthorizationError("Error updating medical guardian permissions: Sender is not a medical guardian to the patient")
    );
    require(
      ds.medicalGuardianPermissionsOnPatient[msg.sender][_mainPatientAddress].role == LibADS.MedicalGuardianRole.PRIMARY,
      LibADS.AuthorizationError("Error updating medical guardian permissions: Sender is not a primary medical guardian to the patient")
    );

    // locating the medical guardian to be removed
    LibADS.MedicalGuardian[] storage patientMedicalGuardians = ds.patientMedicalGuardians[_mainPatientAddress];
    uint256 medicalGuardianIndex;
    bool medicalGuardianFound = false;

    for(uint256 i = 0; i < patientMedicalGuardians.length; i++){
      if(patientMedicalGuardians[i].guardianAddress == _medicalGuardian){
        medicalGuardianIndex = i;
        medicalGuardianFound = true;
        break;
      }
    }
    require(medicalGuardianFound, LibADS.AccountDoesNotExistError(_medicalGuardian));
    // removing the medical guardian from the patient's medical guardians array
    patientMedicalGuardians[medicalGuardianIndex] = patientMedicalGuardians[patientMedicalGuardians.length - 1];
    patientMedicalGuardians.pop();

    // locating the permission to be removed
    LibADS.MedicalGuardianPermission[] storage medicalGuardianPermissions = ds.medicalGuardianPermissions[_medicalGuardian];
    uint256 medicalGuardianPermissionIndex;
    bool medicalGuardianPermissionFound = false;

    for(uint256 i = 0; i < medicalGuardianPermissions.length; i++){
      if(medicalGuardianPermissions[i].patient == _mainPatientAddress){
        medicalGuardianPermissionIndex = i;
        medicalGuardianPermissionFound = true;
        break;
      }
    }
    require(medicalGuardianPermissionFound, LibADS.MedicalGuardianPermissionDoesNotExistError(_medicalGuardian));
    // removing the permission from the medical guardian's permissions array
    medicalGuardianPermissions[medicalGuardianPermissionIndex] = medicalGuardianPermissions[medicalGuardianPermissions.length - 1];
    medicalGuardianPermissions.pop();

    // locating the RSA master DEK to be removed
    LibADS.IdentityRSAMasterDEK[] storage rsaMasterDEKsForMedicalGuardians = ds.patientAccount[_mainPatientAddress].rsaMasterDEKsForMedicalGuardians;
    uint256 medicalGuardianDekIndex;
    bool medicalGuardianDekFound = false;

    for(uint256 i = 0; i < rsaMasterDEKsForMedicalGuardians.length; i++){
      if(rsaMasterDEKsForMedicalGuardians[i].identity == _medicalGuardian){
        medicalGuardianDekIndex = i;
        medicalGuardianDekFound = true;
        break;
      }
    }
    require(medicalGuardianDekFound, "Error revoking medical guardian permission: RSA master DEK for medical guardian not found");
    // removing the RSA master DEK from the patient's account
    rsaMasterDEKsForMedicalGuardians[medicalGuardianDekIndex] = rsaMasterDEKsForMedicalGuardians[rsaMasterDEKsForMedicalGuardians.length - 1];
    rsaMasterDEKsForMedicalGuardians.pop();


    // medical guardian entity in not a medical guardian to the patient
    ds.isMedicalGuardianOfPatient[_medicalGuardian][_mainPatientAddress] = false;
    // deleting the permission that the medical guardian has on the patient identity
    delete ds.medicalGuardianPermissionsOnPatient[_medicalGuardian][_mainPatientAddress];

    ds.addressCid[_mainPatientAddress] = _cid;

    emit LibADS.MedicalGuardianPermissionRevokedEvent(
      "Medical guardian is no longer assigned to patient", 
      _medicalGuardian, 
      _mainPatientAddress
    );
  }


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