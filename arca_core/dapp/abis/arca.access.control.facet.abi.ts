export const arca_access_control_facet_abi = [
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
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "name": "AuthorizationError",
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
          "name": "medicalGuardian",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "patient",
          "type": "address"
        }
      ],
      "name": "MedicalGuardianAssignedToPatientEvent",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_guardianAddress",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_addedAt",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_addedBy",
          "type": "address"
        }
      ],
      "name": "arcaIdentityRegistryFacetRegisterMedicalGuardian",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_medicalGuardian",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_mainPatientAddress",
          "type": "address"
        },
        {
          "internalType": "enum LibArcaDiamondStorage.MedicalGuardianRole",
          "name": "_role",
          "type": "uint8"
        },
        {
          "internalType": "bool",
          "name": "_canGrantProviderAccess",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_canGrantGuardianAccess",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_canRevokeProviderAccess",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_canRevokeGuardianAccess",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_canUploadRecords",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_canReadRecords",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_canDeleteRecords",
          "type": "bool"
        },
        {
          "internalType": "bytes",
          "name": "_rsaMasterDekForMedicalGuardian",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "_cid",
          "type": "bytes"
        }
      ],
      "name": "assignMedicalGuardian",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_medicalGuardian",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_patient",
          "type": "address"
        }
      ],
      "name": "getMedicalPermission",
      "outputs": [
        {
          "components": [
            {
              "internalType": "enum LibArcaDiamondStorage.MedicalGuardianRole",
              "name": "role",
              "type": "uint8"
            },
            {
              "internalType": "address",
              "name": "guardian",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "patient",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "canGrantProviderAccess",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "canGrantGuardianAccess",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "canRevokeProviderAccess",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "canRevokeGuardianAccess",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "canUploadRecords",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "canReadRecords",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "canDeleteRecords",
              "type": "bool"
            }
          ],
          "internalType": "struct LibArcaDiamondStorage.MedicalGuardianPermission",
          "name": "_medicalGuardianPermission",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getMyMedicalGuardianPermissions",
      "outputs": [
        {
          "components": [
            {
              "internalType": "enum LibArcaDiamondStorage.MedicalGuardianRole",
              "name": "role",
              "type": "uint8"
            },
            {
              "internalType": "address",
              "name": "guardian",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "patient",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "canGrantProviderAccess",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "canGrantGuardianAccess",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "canRevokeProviderAccess",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "canRevokeGuardianAccess",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "canUploadRecords",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "canReadRecords",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "canDeleteRecords",
              "type": "bool"
            }
          ],
          "internalType": "struct LibArcaDiamondStorage.MedicalGuardianPermission[]",
          "name": "_medicalGuardianPermissions",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_medicalGuardian",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_mainPatientAddress",
          "type": "address"
        },
        {
          "internalType": "enum LibArcaDiamondStorage.MedicalGuardianRole",
          "name": "_role",
          "type": "uint8"
        },
        {
          "internalType": "bool",
          "name": "_canGrantProviderAccess",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_canGrantGuardianAccess",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_canRevokeProviderAccess",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_canRevokeGuardianAccess",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_canUploadRecords",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_canReadRecords",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_canDeleteRecords",
          "type": "bool"
        }
      ],
      "name": "updateMedicalGuardianPermission",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_requester",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_mainPatientAddress",
          "type": "address"
        }
      ],
      "name": "verifyAccessToPatientIdentityData",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]