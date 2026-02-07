export const arca_identity_facet_abi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "identity",
          "type": "address"
        }
      ],
      "name": "AccountDoesNotExistError",
      "type": "error"
    },
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
      "inputs": [],
      "name": "ECDSAInvalidSignature",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "length",
          "type": "uint256"
        }
      ],
      "name": "ECDSAInvalidSignatureLength",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "s",
          "type": "bytes32"
        }
      ],
      "name": "ECDSAInvalidSignatureS",
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
      "name": "LinkRequestApprovalError",
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
          "components": [
            {
              "internalType": "bytes32",
              "name": "messageHash",
              "type": "bytes32"
            },
            {
              "internalType": "bytes",
              "name": "messageSignature",
              "type": "bytes"
            }
          ],
          "indexed": false,
          "internalType": "struct LibArcaDiamondStorage.AdminInitializationMessageHashAndSignature",
          "name": "",
          "type": "tuple"
        }
      ],
      "name": "AdminInitializationMessageHashWrittenEvent",
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
          "indexed": false,
          "internalType": "address",
          "name": "primary",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "secondary",
          "type": "address"
        }
      ],
      "name": "LinkAccountRequestApprovalEvent",
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
          "name": "requester",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        }
      ],
      "name": "LinkAccountRequestEvent",
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
              "internalType": "uint256",
              "name": "registeredAt",
              "type": "uint256"
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
              "internalType": "bytes",
              "name": "cid",
              "type": "bytes"
            },
            {
              "internalType": "bytes",
              "name": "adminInitializationSignature",
              "type": "bytes"
            },
            {
              "components": [
                {
                  "internalType": "address",
                  "name": "identity",
                  "type": "address"
                },
                {
                  "internalType": "bytes",
                  "name": "rsaMasterDEK",
                  "type": "bytes"
                }
              ],
              "internalType": "struct LibArcaDiamondStorage.IdentityRSAMasterDEK[]",
              "name": "rsaMasterDEKs",
              "type": "tuple[]"
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
              "internalType": "uint256",
              "name": "registeredAt",
              "type": "uint256"
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
              "internalType": "bytes",
              "name": "cid",
              "type": "bytes"
            },
            {
              "internalType": "bytes",
              "name": "adminInitializationSignature",
              "type": "bytes"
            },
            {
              "components": [
                {
                  "internalType": "address",
                  "name": "identity",
                  "type": "address"
                },
                {
                  "internalType": "bytes",
                  "name": "rsaMasterDEK",
                  "type": "bytes"
                }
              ],
              "internalType": "struct LibArcaDiamondStorage.IdentityRSAMasterDEK[]",
              "name": "rsaMasterDEKs",
              "type": "tuple[]"
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
              "internalType": "uint256",
              "name": "registeredAt",
              "type": "uint256"
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
              "internalType": "bytes",
              "name": "cid",
              "type": "bytes"
            },
            {
              "internalType": "bytes",
              "name": "adminInitializationSignature",
              "type": "bytes"
            },
            {
              "components": [
                {
                  "internalType": "address",
                  "name": "identity",
                  "type": "address"
                },
                {
                  "internalType": "bytes",
                  "name": "rsaMasterDEK",
                  "type": "bytes"
                }
              ],
              "internalType": "struct LibArcaDiamondStorage.IdentityRSAMasterDEK[]",
              "name": "rsaMasterDEKs",
              "type": "tuple[]"
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
          "name": "_secondaryAddress",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_timestamp",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_nonce",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "_hash",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "_signature",
          "type": "bytes"
        }
      ],
      "name": "approveLinkAddressRequest",
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
      "name": "getAdminInitializationMessageHashesAndSignatures",
      "outputs": [
        {
          "components": [
            {
              "internalType": "bytes32",
              "name": "messageHash",
              "type": "bytes32"
            },
            {
              "internalType": "bytes",
              "name": "messageSignature",
              "type": "bytes"
            }
          ],
          "internalType": "struct LibArcaDiamondStorage.AdminInitializationMessageHashAndSignature[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCurrentNonce",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
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
          "internalType": "bytes",
          "name": "_signature",
          "type": "bytes"
        }
      ],
      "name": "getMessageHashOfAdminInitializationSignature",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
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
              "internalType": "uint256",
              "name": "registeredAt",
              "type": "uint256"
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
              "internalType": "bytes",
              "name": "cid",
              "type": "bytes"
            },
            {
              "internalType": "bytes",
              "name": "adminInitializationSignature",
              "type": "bytes"
            },
            {
              "components": [
                {
                  "internalType": "address",
                  "name": "identity",
                  "type": "address"
                },
                {
                  "internalType": "bytes",
                  "name": "rsaMasterDEK",
                  "type": "bytes"
                }
              ],
              "internalType": "struct LibArcaDiamondStorage.IdentityRSAMasterDEK[]",
              "name": "rsaMasterDEKs",
              "type": "tuple[]"
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
          "name": "_hash",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "_signature",
          "type": "bytes"
        }
      ],
      "name": "isSignatureValid",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_primaryAddress",
          "type": "address"
        }
      ],
      "name": "linkAddressRequest",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_registeredAt",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "_cid",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "_adminInitializationSignatureUsed",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "_rsaMasterDEK",
          "type": "bytes"
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
        },
        {
          "internalType": "bytes",
          "name": "_signature",
          "type": "bytes"
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
          "name": "_secondaryAddress",
          "type": "address"
        },
        {
          "internalType": "bytes",
          "name": "_rsaMasterDEK",
          "type": "bytes"
        }
      ],
      "name": "storeRsaMasterDekForLinkedAccount",
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
              "internalType": "uint256",
              "name": "registeredAt",
              "type": "uint256"
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
              "internalType": "bytes",
              "name": "cid",
              "type": "bytes"
            },
            {
              "internalType": "bytes",
              "name": "adminInitializationSignature",
              "type": "bytes"
            },
            {
              "components": [
                {
                  "internalType": "address",
                  "name": "identity",
                  "type": "address"
                },
                {
                  "internalType": "bytes",
                  "name": "rsaMasterDEK",
                  "type": "bytes"
                }
              ],
              "internalType": "struct LibArcaDiamondStorage.IdentityRSAMasterDEK[]",
              "name": "rsaMasterDEKs",
              "type": "tuple[]"
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