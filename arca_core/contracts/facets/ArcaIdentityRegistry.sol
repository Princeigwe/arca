// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {LibArcaDiamondStorage as LibADS} from  "../libraries/LibArcaDiamondStorage.sol";


contract ArcaIdentityRegistry{




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

    LibADS.diamondStorage().adminInitializationMessageHashesAndSignatures.push(messageHashAndSignature);

    emit LibADS.AdminInitializationMessageHashWrittenEvent("Admin initialization transaction hash saved", msg.sender, messageHashAndSignature);
  }

  function getAdminInitializationMessageHashesAndSignatures() public view returns (LibADS.AdminInitializationMessageHashAndSignature[] memory) {
    return LibADS.diamondStorage().adminInitializationMessageHashesAndSignatures;
  }


  function registerPatient(uint256 _registeredAt, bytes memory _cid) public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
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
      guardiansRequired: 0,
      cid: _cid
    });
    ds.patientAccount[msg.sender] = ds.patientIdentity[patientCount];
    ds.accountExists[msg.sender] = true;
    emit LibADS.PatientRegisteredEvent("Patient registered", ds.patientIdentity[patientCount]);
  }

  // register patient if they want to operate with multiple addresses
  function registerPatientWithLinkedAddresses(
    address[] memory _linkedAddresses, 
    uint256 _registeredAt,
    bytes memory _cid
    ) public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
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
      guardiansRequired: 0,
      cid: _cid
    });
    ds.patientAccount[msg.sender] = ds.patientIdentity[patientCount];
    ds.accountExists[msg.sender] = true;
    emit LibADS.PatientRegisteredEvent("Patient registered", ds.patientIdentity[patientCount]);
  }

  // register patients with social recovery guardians
  function registerPatientWithLinkedAddressAndGuardians(
    address [] memory _linkedAddresses, 
    uint8 _guardiansRequired,
    address[] memory _guardians,
    uint256 _registeredAt,
    bytes memory cid
  ) public {
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
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
      guardiansRequired: _guardiansRequired,
      cid: cid
    });
    ds.patientAccount[msg.sender] = ds.patientIdentity[patientCount];
    ds.accountExists[msg.sender] = true;
    emit LibADS.PatientRegisteredEvent("Patient registered", ds.patientIdentity[patientCount]);
  }


  function getPatientIdentity(address _patientAddress)public returns(LibADS.PatientIdentity memory){
    LibADS.DiamondStorage storage ds = LibADS.diamondStorage();
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