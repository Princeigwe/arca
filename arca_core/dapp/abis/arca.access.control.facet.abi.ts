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