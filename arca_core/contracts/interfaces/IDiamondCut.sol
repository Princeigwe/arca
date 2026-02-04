// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

// ** This is the interface that adds, replaces and removes facets' functions on the Diamond contract

interface IDiamondCut{
  enum FacetCutAction { Add, Replace, Remove }
  // Add=0, Replace=1, Remove=2

  struct FacetCut{
    address facetAddress;
    FacetCutAction action;
    bytes4[] functionSelectors;
  }

  function diamondCut(
    FacetCut[] calldata _diamondCut,
    address _init,
    bytes calldata _calldata
  ) external;

  event DiamondCutEvent(FacetCut[] _diamondCut, address _init, bytes _calldata);
}