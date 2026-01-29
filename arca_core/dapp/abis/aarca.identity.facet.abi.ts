export const arca_identity_facet_abi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "caller",
          "type": "address"
        }
      ],
      "name": "AccountExistsError",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "name": "AuthorizationError",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "name": "IncorrectGuardianCountMatchError",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "message",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "admin",
          "type": "address"
        }
      ],
      "name": "AdminAddedEvent",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "message",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "writer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "txnHash",
          "type": "bytes32"
        }
      ],
      "name": "AdminInitializationTxnHashWrittenEvent",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "message",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "bytes32[]",
          "name": "txnHashes",
          "type": "bytes32[]"
        }
      ],
      "name": "AdminInitializationTxnHashesEvent",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "message",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "admin",
          "type": "address"
        }
      ],
      "name": "AdminRemovedEvent",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "message",
          "type": "string"
        },
        {
          "components": [
            {
              "internalType": "address",
              "name": "primaryAddress",
              "type": "address"
            },
            {
              "internalType": "address[]",
              "name": "linkedAddresses",
              "type": "address[]"
            },
            {
              "internalType": "bytes32",
              "name": "registeredAt",
              "type": "bytes32"
            },
            {
              "internalType": "bool",
              "name": "isVerified",
              "type": "bool"
            },
            {
              "internalType": "address[]",
              "name": "guardians",
              "type": "address[]"
            },
            {
              "internalType": "uint8",
              "name": "guardiansRequired",
              "type": "uint8"
            },
            {
              "internalType": "bytes32",
              "name": "cid",
              "type": "bytes32"
            }
          ],
          "indexed": false,
          "internalType": "struct LibArcaDiamondStorage.PatientIdentity",
          "name": "",
          "type": "tuple"
        }
      ],
      "name": "PatientIdentityFetchedEvent",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "message",
          "type": "string"
        },
        {
          "components": [
            {
              "internalType": "address",
              "name": "primaryAddress",
              "type": "address"
            },
            {
              "internalType": "address[]",
              "name": "linkedAddresses",
              "type": "address[]"
            },
            {
              "internalType": "bytes32",
              "name": "registeredAt",
              "type": "bytes32"
            },
            {
              "internalType": "bool",
              "name": "isVerified",
              "type": "bool"
            },
            {
              "internalType": "address[]",
              "name": "guardians",
              "type": "address[]"
            },
            {
              "internalType": "uint8",
              "name": "guardiansRequired",
              "type": "uint8"
            },
            {
              "internalType": "bytes32",
              "name": "cid",
              "type": "bytes32"
            }
          ],
          "indexed": false,
          "internalType": "struct LibArcaDiamondStorage.PatientIdentity",
          "name": "",
          "type": "tuple"
        }
      ],
      "name": "PatientIdentityVerifiedEvent",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "message",
          "type": "string"
        },
        {
          "components": [
            {
              "internalType": "address",
              "name": "primaryAddress",
              "type": "address"
            },
            {
              "internalType": "address[]",
              "name": "linkedAddresses",
              "type": "address[]"
            },
            {
              "internalType": "bytes32",
              "name": "registeredAt",
              "type": "bytes32"
            },
            {
              "internalType": "bool",
              "name": "isVerified",
              "type": "bool"
            },
            {
              "internalType": "address[]",
              "name": "guardians",
              "type": "address[]"
            },
            {
              "internalType": "uint8",
              "name": "guardiansRequired",
              "type": "uint8"
            },
            {
              "internalType": "bytes32",
              "name": "cid",
              "type": "bytes32"
            }
          ],
          "indexed": false,
          "internalType": "struct LibArcaDiamondStorage.PatientIdentity",
          "name": "",
          "type": "tuple"
        }
      ],
      "name": "PatientRegisteredEvent",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newAdmin",
          "type": "address"
        }
      ],
      "name": "addAdmin",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_addr",
          "type": "address"
        }
      ],
      "name": "checkIsAdmin",
      "outputs": [
        {
          "internalType": "bool",
          "name": "_isAdmin",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAdminInitializationTxnHashes",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getIdentityCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "_patientCount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_providerCount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_patientAddress",
          "type": "address"
        }
      ],
      "name": "getPatientIdentity",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "primaryAddress",
              "type": "address"
            },
            {
              "internalType": "address[]",
              "name": "linkedAddresses",
              "type": "address[]"
            },
            {
              "internalType": "bytes32",
              "name": "registeredAt",
              "type": "bytes32"
            },
            {
              "internalType": "bool",
              "name": "isVerified",
              "type": "bool"
            },
            {
              "internalType": "address[]",
              "name": "guardians",
              "type": "address[]"
            },
            {
              "internalType": "uint8",
              "name": "guardiansRequired",
              "type": "uint8"
            },
            {
              "internalType": "bytes32",
              "name": "cid",
              "type": "bytes32"
            }
          ],
          "internalType": "struct LibArcaDiamondStorage.PatientIdentity",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_registeredAt",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "cid",
          "type": "bytes32"
        }
      ],
      "name": "registerPatient",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_linkedAddresses",
          "type": "address[]"
        },
        {
          "internalType": "uint8",
          "name": "_guardiansRequired",
          "type": "uint8"
        },
        {
          "internalType": "address[]",
          "name": "_guardians",
          "type": "address[]"
        },
        {
          "internalType": "bytes32",
          "name": "_registeredAt",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "cid",
          "type": "bytes32"
        }
      ],
      "name": "registerPatientWithLinkedAddressAndGuardians",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_linkedAddresses",
          "type": "address[]"
        },
        {
          "internalType": "bytes32",
          "name": "_registeredAt",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "cid",
          "type": "bytes32"
        }
      ],
      "name": "registerPatientWithLinkedAddresses",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_admin",
          "type": "address"
        }
      ],
      "name": "removeAdmin",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_messageHash",
          "type": "bytes32"
        }
      ],
      "name": "saveAdminInitializationMessageHash",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_patientAddress",
          "type": "address"
        }
      ],
      "name": "verifyPatientIdentity",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]