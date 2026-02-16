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