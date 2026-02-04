// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;


import './interfaces/IDiamondCut.sol';
import './interfaces/IDiamondLoupe.sol';
import './libraries/LibArcaDiamondStorage.sol';


contract ArcaDiamond{
  
  struct DiamondArgs{
    address owner;
  }

  constructor(IDiamondCut.FacetCut[] memory _diamondCut, DiamondArgs memory _args) payable{
    LibArcaDiamondStorage.diamondCut(_diamondCut, address(0), new bytes(0));
    LibArcaDiamondStorage.setContractOwner(_args.owner);
  }

  modifier onlyOwner(){
    require(msg.sender == LibArcaDiamondStorage.contractOwner(), LibArcaDiamondStorage.AuthorizationError("Not ArcaDiamond Owner"));
    _;
  }

  event ReceivedEthEvent(address sender, uint256 amount);

  function facets() public view onlyOwner returns(IDiamondLoupe.Facet[] memory _facets){
    _facets = LibArcaDiamondStorage.facets();
  }


  function facetFunctionSelectors(address _facetAddress) public view onlyOwner returns (bytes4[] memory _functionSelectors){
    _functionSelectors = LibArcaDiamondStorage.facetFunctionSelectors(_facetAddress);
  }


  function facetAddresses() public view onlyOwner returns (address[] memory _facetAddresses){
    _facetAddresses = LibArcaDiamondStorage.facetAddresses();
  }


  function facetAddressOfFunctionSelector(bytes4 _functionSelector) public view onlyOwner returns (address _facetAddress){
    _facetAddress = LibArcaDiamondStorage.facetAddressOfFunctionSelector(_functionSelector);
  }

  function transferOwnership(address _newOwner) public onlyOwner{
    LibArcaDiamondStorage.setContractOwner(_newOwner);
  }

  function getCurrentOwner()public view returns(address _contractOwner){
    _contractOwner = LibArcaDiamondStorage.contractOwner();
  }

  function diamondCut(IDiamondCut.FacetCut[] memory _diamondCut) public onlyOwner{
    LibArcaDiamondStorage.diamondCut(_diamondCut, address(0), new bytes(0));
  }


  receive() external payable{
    emit ReceivedEthEvent(msg.sender, msg.value);
  }


  fallback() external payable {
    LibArcaDiamondStorage.DiamondStorage storage ds;
    bytes32 position = LibArcaDiamondStorage.ARCA_STRUCT_STORAGE_POSITION;
    assembly{
      ds.slot := position
    }

    address facet = ds.selectorToFacetAddressAndFunctionSelectorPosition[msg.sig].facetAddress;
    require(facet != address(0), "Diamond: Function does not exist");
    
    assembly{
      calldatacopy(0, 0, calldatasize())
      let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
      returndatacopy(0, 0, returndatasize())

      switch result
        case 0 {
          revert (0, returndatasize())
        }
        default{
          return(0, returndatasize())
        }
    }
  }
}