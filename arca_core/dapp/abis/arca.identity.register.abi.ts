export const arca_identity_registry_abi = [
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
              "internalType": "uint32",
              "name": "registeredAt",
              "type": "uint32"
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
            }
          ],
          "indexed": false,
          "internalType": "struct ArcaIdentityRegistry.PatientIdentity",
          "name": "",
          "type": "tuple"
        }
      ],
      "name": "PatientRegisteredEvent",
      "type": "event"
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
          "internalType": "uint32",
          "name": "_registeredAt",
          "type": "uint32"
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
          "internalType": "uint32",
          "name": "_registeredAt",
          "type": "uint32"
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
          "internalType": "uint32",
          "name": "_registeredAt",
          "type": "uint32"
        }
      ],
      "name": "registerPatientWithLinkedAddresses",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]