import { ethers } from "ethers"
import { testWallets, testConnects } from "../test.wallets.contract.connects"

const arcaDiamondContractOwnerConnect = testConnects[0] // assuming the first wallet is the owner

class ArcaDiamondOpsService{

  async removeFacet(facetAddress: string, functionSelectors: string[]) {
    try {
      const facetCut = [
        {
          facetAddress: facetAddress,
          action: 2,
          functionSelectors: functionSelectors,
        },
      ];
      const response = await arcaDiamondContractOwnerConnect.diamondCut(facetCut);
      await response.wait();
      arcaDiamondContractOwnerConnect.once("DiamondCutEvent", (facetCuts, initAddress, initCalldata) => {
        console.log("DiamondCut event emitted: ", { facetCuts, initAddress, initCalldata });
      })
    } catch (error) {
      console.error("Error removing facet: ", error);
    }
  }


  async addFacet(facetAddress: string, functionSelectors: string[]) {
    try {
      // arcaDiamondContractOwnerConnect.once("DiamondCutEvent", (facetCuts, initAddress, initCalldata) => {
      //   console.log("DiamondCut event emitted: ", { facetCuts, initAddress, initCalldata });
      // })
      const facetCut = [
        {
          facetAddress: facetAddress,
          action: 0,
          functionSelectors: functionSelectors,
        },
      ];
      const response = await arcaDiamondContractOwnerConnect.diamondCut(facetCut);
      await response.wait();
      arcaDiamondContractOwnerConnect.once("DiamondCutEvent", (facetCuts, initAddress, initCalldata) => {
        console.log("DiamondCut event emitted: ", { facetCuts, initAddress, initCalldata });
      })
    } catch (error) {
      console.error("Error adding facet: ", error);
    }
  }


  async  getContractOwner() {
    try {
      const response = await arcaDiamondContractOwnerConnect.getCurrentOwner();
      console.log("Contract owner: ", response);
    } catch (error) {
      console.error("Error fetching Arca Diamond owner: ", error);
    }
  }


  async transferOwnership(address: string) {
    try {
      arcaDiamondContractOwnerConnect.once("OwnershipTransferredEvent", (previousOwner, newOwner) => {
        console.log("OwnershipTransferred event emitted: ", { previousOwner, newOwner });
      })
      await arcaDiamondContractOwnerConnect.transferOwnership(address);
    } catch (error) {
      console.log("Error transferring ownership:", error);
    }
  }


  async getDiamondFacets() {
    try {
      const response = await arcaDiamondContractOwnerConnect.facets();
      console.log("Facets: ", response);
    } catch (error) {
      console.log("Error fetching diamond facets: ", error);
    }
  }

}



const facetToRemove = ethers.ZeroAddress;
const functionSelectorsToRemove = [
  "0x70480275",
  "0xd953689d",
  "0x7c6dcd2e",
  "0x652cec06",
  "0xcfd549f7",
  "0x68761954",
  "0x059611c4",
  "0x36135b30",
  "0x1785f53c",
  "0x5adc56ec",
  "0x63fa311a",
];
// removeFacet(facetToRemove, functionSelectorsToRemove)

// facet address to add
const facetToAdd = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const functionSelectorsToAdd = [
  '0x70480275', '0x8bf6cdd9',
  '0x06644cbd', '0xd953689d',
  '0xcfcd570c', '0xf37aa5d0',
  '0x7c6dcd2e', '0x3a60c386',
  '0x652cec06', '0x8ddc4e68',
  '0xcfd549f7', '0x85c89e3c',
  '0x0892beb7', '0x1b3780d1',
  '0x33523ebe', '0x4576c45a',
  '0x6d8dbf9a', '0x1785f53c',
  '0x3da4cbee', '0x5adc56ec',
  '0xab958ab5', '0x6780826c',
  '0xe47584b1', '0x63fa311a'
];


const arcaDiamondOpsService = new ArcaDiamondOpsService();

arcaDiamondOpsService.addFacet(facetToAdd, functionSelectorsToAdd)
// arcaDiamondOpsService.getDiamondFacets();
