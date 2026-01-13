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