// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {LibArcaDiamondStorage as LibADS} from  "../libraries/LibArcaDiamondStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Address.sol";


/// @title The Identity Registry Facet of Arca.
/// @author Prince Igwenagha
/// @notice Responsible for handling the identity registry of entities (Patient, Medical Provider, Medical Guardian).
contract ArcaIdentityRegistry{

  using ECDSA for bytes32;


  /////////////////////////////////////////////////////////////////
  // MODIFIERS
  modifier onlyAdmin(){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.isAdmin[msg.sender] == true, LibADS.AuthorizationError("Not an Arca admin"));
    _;
  }

  modifier onlyAdminWithInitTxnHash(){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.isAdmin[msg.sender] == true, LibADS.AuthorizationError("Not an Arca admin"));
    require(ds.hasAdminInitializationMessageHashAndSignature[msg.sender] == true, LibADS.AuthorizationError("Admin must have initialization transaction hash to perform this action"));
    _;
  }

  /// @notice A function that adds an address a a contract admin. This can only be executed by an existing contract admin.
  /// @param _newAdmin The address to be added as an admin.
  function addAdmin(address _newAdmin)public onlyAdmin{
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    ds.isAdmin[_newAdmin] = true;
    emit LibADS.AdminAddedEvent(_newAdmin, "Admin added");
  }

  /// @notice This function removes an exsiting contract admin. The contract owner cannont be removed, and this can only be accomplished as a contract admin.
  /// @param _admin The address to be removed from the admin group.
  function removeAdmin(address _admin)public onlyAdmin{
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(_admin != ds.contractOwner, LibADS.AuthorizationError("Cannot remove contract owner"));
    ds.isAdmin[_admin] = false;
    emit LibADS.AdminRemovedEvent(_admin, "Admin removed");
  }

  /// @notice This function checks if the provided address is an admin.
  /// @param _addr The address to check if it's and admin. 
  function checkIsAdmin(address _addr)public view returns(bool _isAdmin){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    _isAdmin = ds.isAdmin[_addr];
  }


  /// @notice This function checks if an address is a medical guardian to a patient. To be used by ethers.js
  /// @param _medicalGuardianAddress The address of the medical guardian.
  /// @param _patientAddress The address of the patient.
  function checkIsMedicalGuardianOfPatient(
    address _medicalGuardianAddress, 
    address _patientAddress
  )public view returns(bool _isMedicalGuardian){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    _isMedicalGuardian = ds.isMedicalGuardianOfPatient[_medicalGuardianAddress][_patientAddress];
  }
  

  /// @notice This function calls the Access Control facet of Arca to verify access to patient's identity data.
  /// @param _requester The address of the requester.
  /// @param _mainPatientAddress The main address of the patient.
  function arcaAccessControlFacetVerifyAccessToPatientIdentityData(address _requester, address _mainPatientAddress)public returns(bool){
    // address for ArcaAccessControl facet to verify grant access, but in the context of the diamond contract 
    (bool success, bytes memory returnedData) = address(this).call(abi.encodeWithSignature("verifyAccessToPatientIdentityData(address,address)", _requester, _mainPatientAddress));
    if(!success){
      revert("Something went wrong when verifying access to patient identity data");
    }
    (bool hasAccess) = abi.decode(returnedData, (bool)); // decoding the returned data to get the boolean value of hasAccess
    return hasAccess;
  }

  /// @notice This function enables the admin to save a transaction hash; generated off-chain, that will be used in public key encryption for IPFS data.
  /// @param _messageHash The hash of the admin initialization message.
  /// @param _signature The signature of the admin address on the message.
  function saveAdminInitializationMessageHash(bytes32 _messageHash, bytes memory _signature)public onlyAdmin{
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(!ds.hasAdminInitializationMessageHashAndSignature[msg.sender], LibADS.AuthorizationError("Admin already has initialization transaction hash"));
    LibADS.AdminInitializationMessageHashAndSignature memory messageHashAndSignature = LibADS.AdminInitializationMessageHashAndSignature({
      messageHash: _messageHash,
      messageSignature: _signature
    });
    ds.adminInitializationMessageHashAndSignature[msg.sender] = messageHashAndSignature;
    ds.hasAdminInitializationMessageHashAndSignature[msg.sender] = true;
    ds.messageHashOfAdminInitializationSignature[_signature] = _messageHash;

    ds.adminInitializationMessageHashesAndSignatures.push(messageHashAndSignature);

    emit LibADS.AdminInitializationMessageHashWrittenEvent(msg.sender, "Admin initialization transaction hash saved", messageHashAndSignature);
  }

  
  /// @notice This function get the message hash to an admin's signature.
  /// @param _signature The signature of the admin.
  function getMessageHashOfAdminInitializationSignature(bytes memory _signature) public view returns (bytes32) {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    return ds.messageHashOfAdminInitializationSignature[_signature];
  }


  /// @notice This gets all admin's initialized message hashes and their signatures. Used when an identity is being registered for verification. 
  function getAdminInitializationMessageHashesAndSignatures() public view returns (LibADS.AdminInitializationMessageHashAndSignature[] memory) {
    return LibADS.diamondStorage().adminInitializationMessageHashesAndSignatures;
  }


  function isRegisteredPatient(address _address) public view returns (bool) {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    return ds.patientExists[_address];
  }

  function isRegisteredMedicalGuardian(address _address) public view returns (bool) {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    return ds.medicalGuardianExists[_address];
  }


  /// @notice This function registers a patient identity. It records the content identifier of the patient's IPFS data, the admin initialization signature used to register the identity,and the RSA-encrypted DataEncryptionKey.
  /// @param _registeredAt The Unix timestamp at which the patient registered.
  /// @param _cid The Content Identifier of the patient's IPFS data.
  /// @param _adminInitializationSignatureUsed The admin initialization signature used to register the patient.
  /// @param _rsaMasterDEK The RSA encrypted Data Encryption Key, which is used by patient to decrypt encrypted off-chain data.
  function registerPatient(
    uint256 _registeredAt, 
    bytes memory _cid, 
    bytes memory _adminInitializationSignatureUsed,
    bytes memory _rsaMasterDEK
    ) public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.patientExists[msg.sender] == false, LibADS.PatientExistsError(msg.sender));
    uint256 patientCount = ds.patientCount;
    patientCount++;
    ds.patientCount = patientCount;

    ds.patientExists[msg.sender] = true;

    LibADS.PatientIdentity storage newPatient = ds.patientIdentity[patientCount];
    newPatient.primaryAddress = msg.sender;
    newPatient.registeredAt = _registeredAt;
    newPatient.isVerified = false;
    newPatient.adminInitializationSignature = _adminInitializationSignatureUsed;
    newPatient.rsaMasterDEKs.push(LibADS.IdentityRSAMasterDEK({
      identity: msg.sender,
      rsaMasterDEK: _rsaMasterDEK,
      identityType: LibADS.RsaIdentityType.PATIENT
    }));

    ds.patientAddressCid[msg.sender] = _cid;

    ds.patientAccount[msg.sender] = newPatient;
    emit LibADS.PatientRegisteredEvent(msg.sender, "Patient registration successful");
  }


  /// @notice This function gets the IPFS Content Identifier of the registered patient
  /// @param _address The patient's address
  function getPatientAddressCid(address _address)public returns(bytes memory){
    bool hasAccess = arcaAccessControlFacetVerifyAccessToPatientIdentityData(msg.sender, _address);
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.patientExists[_address], LibADS.PatientDoesNotExistError(_address));
    require(hasAccess, LibADS.AuthorizationError("Access denied to content identifier data"));
    return ds.patientAddressCid[_address];
  }


  function getMedicalGuardianFhirPersonCid(address _medicalGuardianAddress)public view returns(bytes memory){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.medicalGuardianExists[_medicalGuardianAddress], LibADS.MedicalGuardianDoesNotExistError(_medicalGuardianAddress));
    return ds.medicalGuardianFhirPersonCid[_medicalGuardianAddress];
  }


  /// @notice This function is meant to update the recorded Content Identifier of the patient after each change on patient's data.
  /// @param _address The address of the patient.
  /// @param _cid  The new Content Identifier.
  function updatePatientAddressCid(address _address, bytes memory _cid) public{
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.patientExists[_address], LibADS.PatientDoesNotExistError(_address));
    require(_address == msg.sender, LibADS.AuthorizationError("CID does not belong to sender"));
    ds.patientAddressCid[_address] = _cid;
  }

  /// @notice This function (for a secondary-address-to-be) makes a request for a patient primary address to link the sender for a unified data access.
  /// @param _primaryAddress The patient's address.
  /// @param _requestHash The hash of the request message.
  /// @param _requestSignature The signature of the secondary-address-to-be. 
  function linkAddressRequest(
    address _primaryAddress, 
    bytes32 _requestHash, 
    bytes memory _requestSignature
    ) public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(_primaryAddress != address(0), "Recipient must be a valid address");
    require(ds.patientExists[_primaryAddress], LibADS.PatientDoesNotExistError(_primaryAddress));
    ds.sentLinkRequest[msg.sender][_primaryAddress] = true;
    emit LibADS.LinkAccountRequestEvent(
      msg.sender,
      _primaryAddress,
      "Incoming request to link to primary address",
      _requestHash,
      _requestSignature
    );
  }


  /// @notice This function gets the current nonce, to be used to prevent replay attack.
  function getCurrentNonce()public view returns(uint256){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    return ds.internalNonce;
  }


  /// @notice This is used to check on-chain if a signature is valid. It verifies that the signature is valid and that the signer is the sender of the transaction. It is used to validate the authenticity of the approval on the link address request
  /// @param _hash The hash of the message.
  /// @param _signature The signature of the address to be verified
  function isSignatureValid(bytes32 _hash, bytes memory _signature) public view returns (bool) {
    address signer = _hash.recover(_signature);
    return (signer == msg.sender);
  }


  /// @notice This approves link request for secondary to patient's identity profile.  a maximum of 2 secondary addresses can be linked to the patient identity.
  /// @param _secondaryAddress The secondary address that requested for unified connection on patient identity. 
  /// @param _timestamp The Unix timestamp, at which the request was approved. Used to test against replay attack.
  /// @param _nonce The current internal nonce from (getCurrentNonce()). Used to test against replay attack.
  /// @param _requestHash The hash of the request message.
  /// @param _requestSignature The signature of the secondary address that sent the request. 
  function approveLinkAddressRequest(
    address _secondaryAddress,
    uint256 _timestamp,
    uint256 _nonce,
    bytes32 _requestHash, 
    bytes memory _requestSignature
    ) public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(
      ds.patientExists[msg.sender],
      LibADS.PatientDoesNotExistError(msg.sender)
    );
    require(
      ds.primaryAccountOf[_secondaryAddress] == address(0), 
      LibADS.LinkRequestApprovalError("Account already linked to a primary account")
    );
    require(
      ds.sentLinkRequest[_secondaryAddress][msg.sender], 
      LibADS.LinkRequestApprovalError("No previous link request from secondary account")
    );
    require(
      _nonce == ds.internalNonce,
      LibADS.LinkRequestApprovalError("Invalid nonce")
    );
    require(
      ds.secondaryAddressConnectionCount[msg.sender] < 2,
      LibADS.MaximumSecondaryAddressConnectionReachError('Patient has reached a connection limit of 2 secondary addresses')
    );

    bool isSigValid = isSignatureValid(_requestHash, _requestSignature);
    require(isSigValid, LibADS.LinkRequestApprovalError("Invalid signature"));

    uint256 currentTimestamp = block.timestamp;
    uint256 timeDeadline = currentTimestamp + 10 minutes;

    if(_timestamp >= timeDeadline){
      revert LibADS.LinkRequestApprovalError("Expired approval request");
    }
    ds.internalNonce++;
    ds.primaryAccountOf[_secondaryAddress] = msg.sender;
    ds.patientAccount[msg.sender].linkedAddresses.push(_secondaryAddress);
    ds.secondaryAddressConnectionCount[msg.sender] +=1;

    // making this false for validation check when storing rsaMasterDEK for linked account. To avoid double request
    ds.sentLinkRequest[_secondaryAddress][msg.sender] = false;

    emit LibADS.LinkAccountRequestApprovalEvent(
      msg.sender,
      _secondaryAddress,
      "Account link request approved"
    );
  }


  /// @notice This function stores RSA-encrypted DataEncryptionKey for the linked secondary address on patient identity. To be used after approval on link request.
  /// @param _secondaryAddress The approved secondary address.
  /// @param _rsaMasterDEK  The RSA-encrypted DataEncryptionKey to be used by secondary address to decrypted encrypted IPFS patient identity data. 
  function storeRsaMasterDekForLinkedAddress(
    address _secondaryAddress,
    bytes memory _rsaMasterDEK
    )public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(
      ds.primaryAccountOf[_secondaryAddress] == msg.sender, 
      LibADS.AuthorizationError('Secondary address is not linked to main account')
    );
    require(
      !ds.sentLinkRequest[_secondaryAddress][msg.sender],
      LibADS.AuthorizationError('Duplicate request to settle RSA master DEK for linked account')
    );
    ds.patientAccount[msg.sender].rsaMasterDEKs.push(LibADS.IdentityRSAMasterDEK({
      identity: _secondaryAddress,
      rsaMasterDEK: _rsaMasterDEK,
      identityType: LibADS.RsaIdentityType.PATIENT_LINKED_ADDRESS
    }));
    ds.sentLinkRequest[_secondaryAddress][msg.sender] = true;
    emit LibADS.PatientIdentityUpdateEvent(_secondaryAddress, "RSA master DEK stored for linked account");
  }


  /// @notice This function unlinks secondary account to from patient's on-chain identity profile.
  /// @param _secondaryAddress The secondary address to be disconnected.
  /// @param _cid The updated Content Identifier after secondary address is removed from IPFS data.
  function unlinkSecondaryAddress(address _secondaryAddress, bytes memory _cid) public  {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.patientExists[msg.sender], LibADS.PatientDoesNotExistError(msg.sender));
    bool isLinkedSecondaryAddress = false;
    // LibADS.PatientIdentity storage patient = ds.patientAccount[msg.sender];

    for(uint i = 0; i < ds.patientAccount[msg.sender].linkedAddresses.length; i++){
      if(ds.patientAccount[msg.sender].linkedAddresses[i] == _secondaryAddress){
        isLinkedSecondaryAddress = true;
        // swapping address position with the last linked address
        ds.patientAccount[msg.sender].linkedAddresses[i] = ds.patientAccount[msg.sender].linkedAddresses[ds.patientAccount[msg.sender].linkedAddresses.length - 1];
        // removing the last address
        ds.patientAccount[msg.sender].linkedAddresses.pop();
        ds.primaryAccountOf[_secondaryAddress] = address(0);
        // todo: remove rsa Master DEK for linked address
        removeStoredRsaMasterDekForLinkedAddress(msg.sender, _secondaryAddress);
        break;
      }
    }

    if(!isLinkedSecondaryAddress){
      revert LibADS.NotLinkedSecondaryAddress(_secondaryAddress);
    }

    ds.secondaryAddressConnectionCount[msg.sender] -=1;
    ds.patientAddressCid[msg.sender] = _cid;

    emit LibADS.SuccessfulSecondaryAddressDisconnectionEvent(_secondaryAddress);
  }

  
  /// @notice This function should be called immediately after the (unlinkSecondaryAddress) function, as it removes the stored RSA-encrypted DataEncryptionKey for the disconnected secondary address.
  /// @param _primaryAddress The main address of the patient's identity profile.
  /// @param _secondaryAddress The disconnected secondary address.
  function removeStoredRsaMasterDekForLinkedAddress(address _primaryAddress, address _secondaryAddress) public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(
      ds.patientExists[_primaryAddress], 
      LibADS.PatientDoesNotExistError(msg.sender)
    );
    require(
      ds.primaryAccountOf[_secondaryAddress] == address(0), 
      LibADS.InvalidRsaMasterDEKRemovalError("Provided secondary address is linked to a patient identity")
    );
    bool isValidSecondaryAddress = false;
    // LibADS.PatientIdentity storage patient = ds.patientAccount[msg.sender];

    for(uint i = 0; i < ds.patientAccount[msg.sender].rsaMasterDEKs.length; i++){
      if(ds.patientAccount[msg.sender].rsaMasterDEKs[i].identity == _secondaryAddress){
        isValidSecondaryAddress = true;
        // swapping RSA master key position of the secondary address with the last master key
        ds.patientAccount[msg.sender].rsaMasterDEKs[i] = ds.patientAccount[msg.sender].rsaMasterDEKs[ds.patientAccount[msg.sender].rsaMasterDEKs.length - 1];
        // deleting the last RSA master key
        ds.patientAccount[msg.sender].rsaMasterDEKs.pop();
        break;
      }
    }

    if(!isValidSecondaryAddress){
      revert LibADS.InvalidRsaMasterDEKRemovalError("Provided secondary address was never linked to patient identity");
    }
  }


  /// @notice This function gets the count of secondary addresses linked to a patient identity profile.
  function getSecondaryAddressConnectionCount()public view returns(uint8){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.patientExists[msg.sender], LibADS.PatientDoesNotExistError(msg.sender));
    return ds.secondaryAddressConnectionCount[msg.sender];
  }


  /// @notice This get the patient identity of the primary patient's address. 
  /// @param _patientAddress The primary patient's address.
  function getPatientIdentity(address _patientAddress)public returns(LibADS.PatientIdentity memory){
    bool hasAccess = arcaAccessControlFacetVerifyAccessToPatientIdentityData(msg.sender, _patientAddress);
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(hasAccess == true, LibADS.AuthorizationError("Access denied to patient identity data"));
    LibADS.PatientIdentity memory patient = ds.patientAccount[_patientAddress];
    emit LibADS.PatientIdentityFetchedEvent(_patientAddress, "Patient identity fetched");
    return patient;
  }


  /// @notice This is used by the admin to mark a patient's onchain identity as verified after successful IPFS verification.
  /// @param _patientAddress The primary address of the patient. 
  function verifyPatientIdentity(address _patientAddress)public onlyAdmin onlyAdminWithInitTxnHash{
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    LibADS.PatientIdentity storage patient = ds.patientAccount[_patientAddress];
    patient.isVerified = true;
    emit LibADS.PatientIdentityVerifiedEvent(_patientAddress, "Patient identity verified");
  }

  /// @notice This returns the count of identity types registered.
  /// @return _patientCount Count of registered patient.
  /// @return _providerCount Count of registered medical providers. 
  /// @return _medicalGuardianCount Count of registered medical guardians.
  function getIdentityCount()public view returns(uint256 _patientCount, uint256 _providerCount, uint256 _medicalGuardianCount){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    _patientCount = ds.patientCount;
    _providerCount = ds.providerCount;
    _medicalGuardianCount = ds.medicalGuardianCount;
    return (_patientCount, _providerCount, _medicalGuardianCount);
  }


  /// @notice This registers a medical guardian.
  /// @param _registeredAt The Unix timestamp at when registration was initialized off-chain.
  function registerMedicalGuardian(uint256 _registeredAt, bytes memory _cid) public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(!ds.medicalGuardianExists[msg.sender], LibADS.MedicalGuardianExistsError(msg.sender));
    uint256 medicalGuardianCount = ds.medicalGuardianCount;
    medicalGuardianCount++;
    ds.medicalGuardianCount = medicalGuardianCount;

    LibADS.MedicalGuardian storage newMedicalGuardian = ds.medicalGuardianAccount[msg.sender];
    newMedicalGuardian.guardianAddress = msg.sender;
    newMedicalGuardian.registeredAt = _registeredAt;

    ds.medicalGuardianExists[msg.sender] = true;
    ds.medicalGuardianAccount[msg.sender] = newMedicalGuardian;

    ds.medicalGuardianFhirPersonCid[msg.sender] = _cid;

    emit LibADS.MedicalGuardianRegisteredEvent(msg.sender, "Medical-guardian registration successful");
  }


  /// @notice Called by medical guardian, this enables them to enroll a minor patient 
  /// @param _patientRegisteredAt The Unix timestamp at when registration was initialized off-chain.
  /// @param _ageOfMajority The age of majority of the patient. This will be used to track majority age and disconnect access from medical guardian when due.
  /// @param _fhirPatientCid The content identifier of the IPFS envelope holding the FHIR Patient resource.
  /// @param _updatedFhirPersonCid The content identifier of the IPFS envelope holding the updated FHIR Person resource of the medical guardian.
  /// @param _fhirRelatedPersonCid  The content identifier of the IPFS envelope holding the FHIR RelatedPerson resource of the medical guardian to the patient.
  /// @param _adminInitializationSignatureUsed The admin initialization signature used to register the patient.
  /// @param _rsaMasterDEKforPatient The RSA encrypted Data Encryption Key, which will be used by patient to decrypt encrypted off-chain data.
  /// @param _rsaMasterDEKforMedicalGuardian The RSA encrypted Data Encryption Key, which will be used by medical guardian to decrypt encrypted off-chain data.
  /// @param _patientAddress The newly generated address of the minor patient
  function registerMinorPatient(
    uint256 _patientRegisteredAt,
    uint256 _ageOfMajority,
    bytes memory _fhirPatientCid, 
    bytes memory _updatedFhirPersonCid,
    bytes memory _fhirRelatedPersonCid,
    bytes memory _adminInitializationSignatureUsed,
    bytes memory _rsaMasterDEKforPatient,
    bytes memory _rsaMasterDEKforMedicalGuardian,
    address _patientAddress
  )public{
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.medicalGuardianExists[msg.sender], LibADS.MedicalGuardianDoesNotExistError(msg.sender));
    require(!ds.patientExists[_patientAddress], LibADS.PatientExistsError(_patientAddress));

    uint256 patientCount = ds.patientCount;
    patientCount++;
    ds.patientCount = patientCount;

    ds.patientExists[_patientAddress] = true;

    // creating the minor patient's identity=
    LibADS.PatientIdentity storage newPatient = ds.patientIdentity[patientCount];
    newPatient.primaryAddress = _patientAddress;
    newPatient.registeredAt = _patientRegisteredAt;
    newPatient.isVerified = false;
    newPatient.adminInitializationSignature = _adminInitializationSignatureUsed;
    newPatient.ageOfMajority = _ageOfMajority;

    newPatient.rsaMasterDEKs.push(LibADS.IdentityRSAMasterDEK({
      identity: _patientAddress,
      rsaMasterDEK: _rsaMasterDEKforPatient,
      identityType: LibADS.RsaIdentityType.PATIENT
    }));

    newPatient.rsaMasterDEKs.push(LibADS.IdentityRSAMasterDEK({
      identity: msg.sender,
      rsaMasterDEK: _rsaMasterDEKforMedicalGuardian,
      identityType: LibADS.RsaIdentityType.MEDICAL_GUARDIAN
    }));

    ds.patientAddressCid[_patientAddress] = _fhirPatientCid;
    ds.medicalGuardianFhirPersonCid[msg.sender] = _updatedFhirPersonCid;
    ds.medicalGuardianFhirRelatedPersonCid[msg.sender][_patientAddress] = _fhirRelatedPersonCid;

    ds.patientAccount[_patientAddress] = newPatient;
    emit LibADS.PatientRegisteredEvent(_patientAddress, "Minor patient registration successful");

    ds.isMedicalGuardianOfPatient[msg.sender][_patientAddress] = true;
    ds.patientMedicalGuardians[_patientAddress].push(ds.medicalGuardianAccount[msg.sender]);

    LibADS.MedicalGuardianPermission storage medicalGuardianPermission = ds.medicalGuardianPermissionsOnPatient[msg.sender][_patientAddress];
    medicalGuardianPermission.role = LibADS.MedicalGuardianRole.PRIMARY;
    medicalGuardianPermission.guardian = msg.sender;
    medicalGuardianPermission.patient = _patientAddress;
    medicalGuardianPermission.canGrantProviderAccess = true;
    medicalGuardianPermission.canGrantGuardianAccess = true;
    medicalGuardianPermission.canRevokeProviderAccess = true;
    medicalGuardianPermission.canRevokeGuardianAccess = true;
    medicalGuardianPermission.canUploadRecords = true;
    medicalGuardianPermission.canReadRecords = true;
    medicalGuardianPermission.canDeleteRecords = true;

    ds.medicalGuardianPermissions[msg.sender].push(medicalGuardianPermission);

    emit LibADS.MedicalGuardianAssignedToPatientEvent(
      msg.sender, 
      _patientAddress,
      "Primary medical guardian assigned to minor patient"
    );
  }

  /// @notice This function is used to see patient medical guardians attached to a minor patient.
  /// @param _patientAddress The primary address of the minor patient.
  function getMedicalGuardians(address _patientAddress) public returns(LibADS.MedicalGuardian[] memory _medicalGuardians) {
    require(_patientAddress != address(0), LibADS.AuthorizationError("Patient address must be a valid address"));
    bool hasAccess = arcaAccessControlFacetVerifyAccessToPatientIdentityData(msg.sender, _patientAddress);
    require(hasAccess == true, LibADS.AuthorizationError("Access denied to patient identity data"));
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    _medicalGuardians = ds.patientMedicalGuardians[_patientAddress];
  }
  

  /// @notice This function is designed to fetch paginated medical permissions that a medical guardian has 
  /// @param _cursor The index of the first element to return (inclusive).
  /// @param _howMany The maximum number of elements to return.
  /// @return _values An array of MedicalGuardianPermission structs.
  /// @return newCursor The index of the next element to return (inclusive).
  function fetchPaginatedMedicalPermissions(uint256 _cursor, uint256 _howMany) public view returns (LibADS.MedicalGuardianPermission[] memory _values,uint256 newCursor) {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.medicalGuardianExists[msg.sender], LibADS.MedicalGuardianDoesNotExistError(msg.sender));

    uint256 totalPermissionsCount = ds.medicalGuardianPermissions[msg.sender].length;

    if (_cursor >= totalPermissionsCount) {
      return (new LibADS.MedicalGuardianPermission[](0), totalPermissionsCount);
    }

    uint256 length = _howMany;
    uint256 remaining = totalPermissionsCount - _cursor;
    if (length > remaining) {
      length = remaining;
    }
    _values = new LibADS.MedicalGuardianPermission[](length);
    for (uint256 i = 0; i < length; i++) {
      _values[i] = ds.medicalGuardianPermissions[msg.sender][_cursor + i];
    }

    return (_values, _cursor + length);
  }


}