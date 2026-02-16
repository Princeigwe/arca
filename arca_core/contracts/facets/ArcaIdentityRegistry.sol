// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {LibArcaDiamondStorage as LibADS} from  "../libraries/LibArcaDiamondStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Address.sol";


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

  function addAdmin(address _newAdmin)public onlyAdmin{
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    ds.isAdmin[_newAdmin] = true;
    emit LibADS.AdminAddedEvent("Admin added", _newAdmin);
  }

  function removeAdmin(address _admin)public onlyAdmin{
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(_admin != ds.contractOwner, LibADS.AuthorizationError("Cannot remove contract owner"));
    ds.isAdmin[_admin] = false;
    emit LibADS.AdminRemovedEvent("Admin removed", _admin);
  }

  function checkIsAdmin(address _addr)public view returns(bool _isAdmin){
    LibADS.DiamondStorage storage dsStorage = LibADS.diamondStorage();
    _isAdmin = dsStorage.isAdmin[_addr];
  }

  function arcaAccessControlFacetVerifyAccessToPatientIdentityData(address _requester, address _mainPatientAddress)public returns(bool){
    // address for ArcaAccessControl facet to verify grant access, but in the context of the diamond contract 
    (bool success, bytes memory returnedData) = address(this).call(abi.encodeWithSignature("verifyAccessToPatientIdentityData(address,address)", _requester, _mainPatientAddress));
    if(!success){
      revert("Something went wrong when verifying access to patient identity data");
    }
    (bool hasAccess) = abi.decode(returnedData, (bool)); // decoding the returned data to get the boolean value of hasAccess
    return hasAccess;
  }

  // enables the admin to save a transaction hash; generated off-chain, that will be used in public key encryption for IPFS data
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

    emit LibADS.AdminInitializationMessageHashWrittenEvent("Admin initialization transaction hash saved", msg.sender, messageHashAndSignature);
  }


  function getMessageHashOfAdminInitializationSignature(bytes memory _signature) public view returns (bytes32) {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    return ds.messageHashOfAdminInitializationSignature[_signature];
  }

  function getAdminInitializationMessageHashesAndSignatures() public view returns (LibADS.AdminInitializationMessageHashAndSignature[] memory) {
    return LibADS.diamondStorage().adminInitializationMessageHashesAndSignatures;
  }


  function registerPatient(
    uint256 _registeredAt, 
    bytes memory _cid, 
    bytes memory _adminInitializationSignatureUsed,
    bytes memory _rsaMasterDEK
    ) public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.accountExists[msg.sender] == false, LibADS.AccountExistsError(msg.sender));
    uint256 patientCount = ds.patientCount;
    patientCount++;
    ds.patientCount = patientCount;

    LibADS.PatientIdentity storage newPatient = ds.patientIdentity[patientCount];
    newPatient.primaryAddress = msg.sender;
    newPatient.registeredAt = _registeredAt;
    newPatient.isVerified = false;
    newPatient.guardiansRequired = 0;
    newPatient.adminInitializationSignature = _adminInitializationSignatureUsed;
    newPatient.rsaMasterDEKs.push(LibADS.IdentityRSAMasterDEK({
      identity: msg.sender,
      rsaMasterDEK: _rsaMasterDEK
    }));

    ds.addressCid[msg.sender] = _cid;

    ds.patientAccount[msg.sender] = newPatient;
    ds.accountExists[msg.sender] = true;
    emit LibADS.PatientRegisteredEvent("Patient registered", newPatient);
  }


  function getAddressCid(address _address)public view returns(bytes memory){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.accountExists[_address], LibADS.AccountDoesNotExistError(_address));
    return ds.addressCid[_address];
  }


  function updateAddressCid(address _address, bytes memory _cid) public{
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(ds.accountExists[_address], LibADS.AccountDoesNotExistError(_address));
    require(_address == msg.sender, LibADS.AuthorizationError("CID does not belong to sender"));
    ds.addressCid[_address] = _cid;
  }

  // this sends a request for a primary address to link the sender for a unified data access
  function linkAddressRequest(
    address _primaryAddress, 
    bytes32 _requestHash, 
    bytes memory _requestSignature
    ) public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(_primaryAddress != address(0), "Recipient must be a valid address");
    require(ds.accountExists[_primaryAddress], LibADS.AccountDoesNotExistError(_primaryAddress));
    ds.sentLinkRequest[msg.sender][_primaryAddress] = true;
    emit LibADS.LinkAccountRequestEvent(
      "Incoming request to link to primary address",
      msg.sender,
      _requestHash,
      _requestSignature,
      _primaryAddress
    );
  }


  function getCurrentNonce()public view returns(uint256){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    return ds.internalNonce;
  }

  // verifies that the signature is valid and that the signer is the sender of the transaction. 
  // this is used to validate the authenticity of the approval on the link address request
  function isSignatureValid(bytes32 _hash, bytes memory _signature) public view returns (bool) {
    address signer = _hash.recover(_signature);
    return (signer == msg.sender);
  }


  function approveLinkAddressRequest(
    address _secondaryAddress,
    uint256 _timestamp,
    uint256 _nonce,
    bytes32 _requestHash, 
    bytes memory _requestSignature
    ) public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(
      ds.accountExists[msg.sender],
      LibADS.AccountDoesNotExistError(msg.sender)
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

    // making this false for validation check when storing rsaMasterDEK for linked account. To avoid double request
    ds.sentLinkRequest[_secondaryAddress][msg.sender] = false;

    emit LibADS.LinkAccountRequestApprovalEvent(
      "Account link request approved",
      msg.sender,
      _secondaryAddress
    );
  }


  function storeRsaMasterDekForLinkedAccount(
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
      rsaMasterDEK: _rsaMasterDEK
    }));
    ds.sentLinkRequest[_secondaryAddress][msg.sender] = true;
    emit LibADS.PatientIdentityUpdateEvent("RSA master DEK stored for linked account");
  }

  // // register patient if they want to operate with multiple addresses
  // function registerPatientWithLinkedAddresses(
  //   address[] memory _linkedAddresses, 
  //   uint256 _registeredAt,
  //   bytes memory _cid
  //   ) public {
  //   LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
  //   require(ds.accountExists[msg.sender] == false, LibADS.AccountExistsError(msg.sender));
  //   uint256 patientCount = ds.patientCount;
  //   patientCount++;
  //   ds.patientCount = patientCount;
  //   ds.patientIdentity[patientCount] = LibADS.PatientIdentity({
  //     primaryAddress: msg.sender,
  //     linkedAddresses: _linkedAddresses,
  //     registeredAt: _registeredAt,
  //     isVerified: false,
  //     guardians: new address[](0), // an empty address array
  //     guardiansRequired: 0,
  //     cid: _cid
  //   });
  //   ds.patientAccount[msg.sender] = ds.patientIdentity[patientCount];
  //   ds.accountExists[msg.sender] = true;
  //   emit LibADS.PatientRegisteredEvent("Patient registered", ds.patientIdentity[patientCount]);
  // }

  // // register patients with social recovery guardians
  // function registerPatientWithLinkedAddressAndGuardians(
  //   address [] memory _linkedAddresses, 
  //   uint8 _guardiansRequired,
  //   address[] memory _guardians,
  //   uint256 _registeredAt,
  //   bytes memory cid
  // ) public {
  //   LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
  //   require(ds.accountExists[msg.sender] == false, LibADS.AccountExistsError(msg.sender));
  //   require(_guardians.length == _guardiansRequired, LibADS.IncorrectGuardianCountMatchError("Number of guardian address must equal guardians required"));
  //   address[] memory linkedAddresses;
  //   if(_linkedAddresses.length == 0){
  //     linkedAddresses = new address[](0);
  //   }
  //   else{
  //     linkedAddresses = _linkedAddresses;
  //   }
  //   uint256 patientCount = ds.patientCount;
  //   patientCount++;
  //   ds.patientCount = patientCount;
  //   ds.patientIdentity[patientCount] = LibADS.PatientIdentity({
  //     primaryAddress: msg.sender,
  //     linkedAddresses: linkedAddresses,
  //     registeredAt: _registeredAt,
  //     isVerified: false,
  //     guardians: _guardians,
  //     guardiansRequired: _guardiansRequired,
  //     cid: cid
  //   });
  //   ds.patientAccount[msg.sender] = ds.patientIdentity[patientCount];
  //   ds.accountExists[msg.sender] = true;
  //   emit LibADS.PatientRegisteredEvent("Patient registered", ds.patientIdentity[patientCount]);
  // }


  function getPatientIdentity(address _patientAddress)public returns(LibADS.PatientIdentity memory){
    bool hasAccess = arcaAccessControlFacetVerifyAccessToPatientIdentityData(msg.sender, _patientAddress);
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    require(hasAccess == true, LibADS.AuthorizationError("Access denied to patient identity data"));
    LibADS.PatientIdentity memory patient = ds.patientAccount[_patientAddress];
    emit LibADS.PatientIdentityFetchedEvent("Patient identity fetched", patient);
    return patient;
  }


  function verifyPatientIdentity(address _patientAddress)public onlyAdmin onlyAdminWithInitTxnHash{
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    LibADS.PatientIdentity storage patient = ds.patientAccount[_patientAddress];
    patient.isVerified = true;
    emit LibADS.PatientIdentityVerifiedEvent("Patient identity verified", patient);
  }

  function getIdentityCount()public view returns(uint256 _patientCount, uint256 _providerCount){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
    _patientCount = ds.patientCount;
    _providerCount = ds.providerCount;
    return (_patientCount, _providerCount);
  }

}