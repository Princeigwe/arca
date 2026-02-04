// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;


interface IDiamondLoupe{

  // hold detail about a facet and its selectors
  struct Facet{
    address facetAddress;
    bytes4[] functionSelectors;
  }

  // return all facets together with their function selectors
  function facets() external view returns (Facet[] memory _facets);

  // return all function selectors of a particular facet
  function facetFunctionSelectors(address _facetAddress) external view returns (bytes4[] memory _functionSelectors);

  // return all facet addresses
  function facetAddresses() external view returns (address[] memory _facetAddresses);

  // return the facet address of a particular function selector
  function facetAddressOfFunctionSelector(bytes4 _functionSelector) external view returns (address _facetAddress);

}