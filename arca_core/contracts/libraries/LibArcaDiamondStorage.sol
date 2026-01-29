// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import '../interfaces/IDiamondCut.sol';
import '../interfaces/IDiamondLoupe.sol';

library LibArcaDiamondStorage{
  bytes32 constant ARCA_STRUCT_STORAGE_POSITION = keccak256("arca.main.diamond.storage");

  // this holds details of a particular function selector; showing the facet address it belongs to,
  // and the position of the selector FacetAddressPositionAndFunctionSelectors.functionSelectors array
  struct FacetAddressAndFunctionSelectorPosition{
    address facetAddress;
    uint16 functionSelectorPosition; // position of the function selector in the FacetAddressPositionAndFunctionSelectors.functionSelectors array
  }

  // this holds details of the position of a facet address in the facetAddresses array,
  // along with the function selectors of that facet
  struct FacetAddressPositionAndFunctionSelectors{
    bytes4[] functionSelectors;
    uint16 facetAddressPosition; // position of the facet address in the facetAddresses array
  }

  //** FACETS EVENTS 
  event PatientRegisteredEvent(string message, PatientIdentity);
  event PatientIdentityVerifiedEvent(string message, PatientIdentity);
  event PatientIdentityFetchedEvent(string message, PatientIdentity);
  event AdminAddedEvent(string message, address admin);
  event AdminRemovedEvent(string message, address admin);
  event AdminInitializationTxnHashWrittenEvent(string message, address writer, bytes32 txnHash);
  event AdminInitializationTxnHashesEvent(string message, bytes32[] txnHashes);



  //** FACETS ERRORS
  error AccountExistsError(address caller);
  error IncorrectGuardianCountMatchError(string);
  error AuthorizationError(string);

  //** FACETS ENUMS
  enum ProviderType{
    GENERAL_PRACTITIONER,
    SPECIALIST,
    NURSE,
    PHARMACIST,
    THERAPIST,
    EMERGENCY_SERVICES,
    RESEARCHER
  }


  //* FACETS STRUCTS
  struct PatientIdentity{
    address primaryAddress;
    address[] linkedAddresses; //optional input on identity registration
    bytes32 registeredAt;
    bool isVerified;
    address[] guardians; //optional input on identity registration
    uint8 guardiansRequired; //optional input on identity registration
    bytes32 cid;
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
    bytes32 cid;
  }

  // the main storage of Arca diamond contract
  struct DiamondStorage{
    mapping(bytes4 => FacetAddressAndFunctionSelectorPosition) selectorToFacetAddressAndFunctionSelectorPosition;
    mapping(address => FacetAddressPositionAndFunctionSelectors) addressToFacetAddressPositionAndFunctionSelectors;
    address[] facetAddresses;
    address contractOwner;


    //* FACETS STATE VARIABLES
    // these hashes will be used for public key cryptography on IPFS data
    bytes32[] adminInitializationMessageHashes;
    mapping(address => bool) hasAdminInitializationMessageHash;
    mapping(address => bool) isAdmin;
    mapping(address => bytes32) adminInitializationMessageHash;
    uint256 patientCount;
    uint256 providerCount;
    ProviderType providerType;
    mapping (address => PatientIdentity) patientAccount;
    mapping (address => bool) accountExists;
    mapping(uint256 => PatientIdentity) patientIdentity;
    mapping(uint256 => ProviderIdentity) providerIdentity;
  }

  event OwnershipTransferredEvent(address indexed previousOwner, address indexed newOwner);
  event DiamondCutEvent(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata);


  // this set the diamond storage if not already set, and fetches it
  function diamondStorage() internal pure returns (DiamondStorage storage ds){
    bytes32 position = ARCA_STRUCT_STORAGE_POSITION;
    assembly{
      ds.slot := position
    }
  }


  function setContractOwner(address _newOwner)internal{
    DiamondStorage storage ds = diamondStorage();
    address previousOwner = ds.contractOwner;
    ds.contractOwner = _newOwner;
    ds.isAdmin[_newOwner] = true;
    emit OwnershipTransferredEvent(previousOwner, _newOwner);
  }

  // this returns the current diamond contract owner
  function contractOwner()internal view returns(address _contractOwner){
    _contractOwner = diamondStorage().contractOwner;
  }

  function enforceIsContractOwner()internal view{
    require(msg.sender == diamondStorage().contractOwner, "LibArcaDiamondStorage: Must be contract owner to perform this action");
  }


  // this is the function that makes changes to the registry holding the facets and their function selectors
  function diamondCut(
    IDiamondCut.FacetCut[] memory _diamondCut,
    address _init,
    bytes memory _calldata
  )internal{
    for(uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++){
      IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;
      if(action == IDiamondCut.FacetCutAction.Add){
        // code for adding a facet with its function selectors
        addFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
      }
      else if(action == IDiamondCut.FacetCutAction.Replace){
        // code for replacing a facet with its function selectors
        replaceFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
      }
      else if(action == IDiamondCut.FacetCutAction.Remove){
        // code for removing a facet with its function selectors
        removeFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
      }
      else{
        revert("LibArcaDiamondCut: Invalid facet cut action");
      }
    }

    emit DiamondCutEvent(_diamondCut, _init, _calldata);
    initializeDiamondCut(_init, _calldata);
  }


  function initializeDiamondCut(address _init, bytes memory _calldata)internal{
    if(_init == address(0)){
      require(_calldata.length == 0, "LibArcaDiamondCut: _init is zero address, but _calldata is not empty");
    }else{
      require(_calldata.length > 0, "LibArcaDiamondCut: _init is not zero address, but _calldata is empty");
      if(_init != address(this)){
        enforceHasContractCode(_init, "LibArcaDiamondCut: _init address has no code");
      }
      (bool success, bytes memory error) = _init.delegatecall(_calldata);
      if(!success){
        if(error.length > 0){
          revert(string(error));
        }else{
          revert("LibArcaDiamondCut: _init failed to execute");
        }
      }
    }
  }


  // this function ensures that the smart contract address being called upon is not an empty code
  function enforceHasContractCode(address _contract, string memory _errorMessage)internal view{
    uint256 contractSize;
    // getting the size of the contract code
    assembly{
      contractSize := extcodesize(_contract)
    }
    require(contractSize > 0, _errorMessage);
  }


  //**  diamondCut Action functions */

  function addFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal{
    require(_functionSelectors.length > 0, "LibArcaDiamondCut: No selectors found in facet");
    require(_facetAddress != address(0), "LibArcaDiamondCut: Facet to add cannot be a zero address");
    DiamondStorage storage ds = diamondStorage();

    // getting the number of function selectors in the facet and casting it to uint16
    uint16 selectorPosition = uint16(ds.addressToFacetAddressPositionAndFunctionSelectors[_facetAddress].functionSelectors.length);

    // if the uint16 casted value is zero, check if it an empty code
    // the facet address then becomes first on the facetAddress array in the DiamondStorage
    if(selectorPosition == 0){
      enforceHasContractCode(_facetAddress, "LibArcaDiamondCut: New facet has no code");
      ds.addressToFacetAddressPositionAndFunctionSelectors[_facetAddress].facetAddressPosition = uint16(ds.facetAddresses.length);
      ds.facetAddresses.push(_facetAddress);
    }


    // registering the selectors of the new facet address
    for(uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++){
      bytes4 selector = _functionSelectors[selectorIndex];
      address oldFacetAddress = ds.selectorToFacetAddressAndFunctionSelectorPosition[selector].facetAddress;
      require(oldFacetAddress == address(0), "LibArcaDiamondCut: Function selector already exists");
      ds.addressToFacetAddressPositionAndFunctionSelectors[_facetAddress].functionSelectors.push(selector);
      ds.selectorToFacetAddressAndFunctionSelectorPosition[selector].facetAddress = _facetAddress;
      ds.selectorToFacetAddressAndFunctionSelectorPosition[selector].functionSelectorPosition = selectorPosition;
      selectorPosition++;
    }
  }


  // this is used in cases where a function was modified without changing its identifier
  function replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal{
    require(_functionSelectors.length > 0, "LibArcaDiamondCut: No selectors found in facet");
    require(_facetAddress != address(0), "LibArcaDiamondCut: Facet to replace cannot be a zero address");

    DiamondStorage storage ds = diamondStorage();
    uint16 selectorPosition = uint16(ds.addressToFacetAddressPositionAndFunctionSelectors[_facetAddress].functionSelectors.length);
    if(selectorPosition == 0){
      enforceHasContractCode(_facetAddress, "LibArcaDiamondCut: New facet has no code");
      ds.addressToFacetAddressPositionAndFunctionSelectors[_facetAddress].facetAddressPosition = uint16(ds.facetAddresses.length);
      ds.facetAddresses.push(_facetAddress);
    }

    for(uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++){
      bytes4 selector = _functionSelectors[selectorIndex];

      // getting the old facet address that has the same function identifier selector
      address oldFacetAddress = ds.selectorToFacetAddressAndFunctionSelectorPosition[selector].facetAddress;
      require(oldFacetAddress != _facetAddress, "LibArcaDiamondCut: Function selector already exists");
      removeFunction(oldFacetAddress, selector);
      
      // add new function from new smart contract
      ds.selectorToFacetAddressAndFunctionSelectorPosition[selector].functionSelectorPosition = selectorPosition;
      ds.addressToFacetAddressPositionAndFunctionSelectors[_facetAddress].functionSelectors.push(selector);
      ds.selectorToFacetAddressAndFunctionSelectorPosition[selector].facetAddress = _facetAddress;
      selectorPosition++;
    }
  }


  function removeFunction(address _facetAddress, bytes4 _functionSelector) internal{
    require(_facetAddress != address(0), "LibArcaDiamondCut: Facet to remove cannot be a zero address");
    require(_facetAddress != address(this), "LibArcaDiamondCut: Facet to remove cannot be the diamond contract");
    DiamondStorage storage ds = diamondStorage();

    uint256 selectorPosition = ds.selectorToFacetAddressAndFunctionSelectorPosition[_functionSelector].functionSelectorPosition;
    uint256 lastSelectorPosition = ds.addressToFacetAddressPositionAndFunctionSelectors[_facetAddress].functionSelectors.length - 1;

    // if the function selector is not the last one, swap the position of the selector with the last one
    if(selectorPosition != lastSelectorPosition){
      bytes4 lastSelector = ds.addressToFacetAddressPositionAndFunctionSelectors[_facetAddress].functionSelectors[lastSelectorPosition];
      ds.addressToFacetAddressPositionAndFunctionSelectors[_facetAddress].functionSelectors[selectorPosition] = lastSelector;
      ds.selectorToFacetAddressAndFunctionSelectorPosition[lastSelector].functionSelectorPosition = uint16(selectorPosition);
    }

    // deleting the last selector
    ds.addressToFacetAddressPositionAndFunctionSelectors[_facetAddress].functionSelectors.pop();
    delete ds.selectorToFacetAddressAndFunctionSelectorPosition[_functionSelector];

    // deleting the facet address if it has no more selectors
    if(lastSelectorPosition == 0){
      uint256 lastFacetAddressPosition = ds.facetAddresses.length - 1;
      uint256 facetAddressPosition = ds.addressToFacetAddressPositionAndFunctionSelectors[_facetAddress].facetAddressPosition;
      if(facetAddressPosition != lastFacetAddressPosition){
        address lastFacetAddress = ds.facetAddresses[lastFacetAddressPosition];
        ds.facetAddresses[facetAddressPosition] = lastFacetAddress;
        ds.addressToFacetAddressPositionAndFunctionSelectors[lastFacetAddress].facetAddressPosition = uint16(facetAddressPosition);
      }

      ds.facetAddresses.pop();
      delete ds.addressToFacetAddressPositionAndFunctionSelectors[_facetAddress].facetAddressPosition;
    }
  }

  // this removes all the selectors, leading to total deletion of the facet
  function removeFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal{
    require(_functionSelectors.length > 0, "LibArcaDiamondCut: No selectors found in facet");
    require(_facetAddress == address(0), "LibArcaDiamondCut: Facet to remove must be a zero address");
    DiamondStorage storage ds = diamondStorage();
    for(uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++){
      bytes4 selector = _functionSelectors[selectorIndex];
      address oldFacetAddress = ds.selectorToFacetAddressAndFunctionSelectorPosition[selector].facetAddress;
      removeFunction(oldFacetAddress, selector);
    }
  }


  //* IMPLEMENTING DIAMONDLOUPE FUNCTIONS

  function facets() internal view returns(IDiamondLoupe.Facet[] memory _facets){
    DiamondStorage storage ds = diamondStorage();
    // address[] memory facetAddresses = ds.facetAddresses;
    _facets = new IDiamondLoupe.Facet[](ds.facetAddresses.length);
    for (uint i; i < ds.facetAddresses.length; i++ ){
      bytes4[] memory selectors = ds.addressToFacetAddressPositionAndFunctionSelectors[ds.facetAddresses[i]].functionSelectors;
      _facets[i] = IDiamondLoupe.Facet({facetAddress: ds.facetAddresses[i], functionSelectors: selectors});
    }
  }


  function facetFunctionSelectors(address _facetAddress) internal view returns (bytes4[] memory _functionSelectors){
    DiamondStorage storage ds = diamondStorage();
    _functionSelectors = ds.addressToFacetAddressPositionAndFunctionSelectors[_facetAddress].functionSelectors;
  }


  function facetAddresses() internal view returns (address[] memory _facetAddresses){
    DiamondStorage storage ds = diamondStorage();
    _facetAddresses = ds.facetAddresses;
  }


  function facetAddressOfFunctionSelector(bytes4 _functionSelector) internal view returns (address _facetAddress){
    DiamondStorage storage ds = diamondStorage();
    _facetAddress = ds.selectorToFacetAddressAndFunctionSelectorPosition[_functionSelector].facetAddress;
  }
}