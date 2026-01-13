export const arca_diamond_abi = [
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "facetAddress",
              "type": "address"
            },
            {
              "internalType": "enum IDiamondCut.FacetCutAction",
              "name": "action",
              "type": "uint8"
            },
            {
              "internalType": "bytes4[]",
              "name": "functionSelectors",
              "type": "bytes4[]"
            }
          ],
          "internalType": "struct IDiamondCut.FacetCut[]",
          "name": "_diamondCut",
          "type": "tuple[]"
        },
        {
          "components": [
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            }
          ],
          "internalType": "struct ArcaDiamond.DiamondArgs",
          "name": "_args",
          "type": "tuple"
        }
      ],
      "stateMutability": "payable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "facetAddress",
              "type": "address"
            },
            {
              "internalType": "enum IDiamondCut.FacetCutAction",
              "name": "action",
              "type": "uint8"
            },
            {
              "internalType": "bytes4[]",
              "name": "functionSelectors",
              "type": "bytes4[]"
            }
          ],
          "indexed": false,
          "internalType": "struct IDiamondCut.FacetCut[]",
          "name": "_diamondCut",
          "type": "tuple[]"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "_init",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "_calldata",
          "type": "bytes"
        }
      ],
      "name": "DiamondCutEvent",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferredEvent",
      "type": "event"
    },
    {
      "stateMutability": "payable",
      "type": "fallback"
    }
  ]