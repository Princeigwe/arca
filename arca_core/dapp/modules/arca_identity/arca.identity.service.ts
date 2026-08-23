import { EncryptionMetadata, IpfsEnvelope, IdentityRsaMasterKey } from "./entities/ipfs.patient.entity.type";
import { FhirPatient } from "./entities/fhir.patient.resource";
import { Gender } from "./enums/gender.enum";
import { EmploymentStatus } from "./enums/employment.status.enum";
import { IpfsOperator } from "../../utils/ipfs.operator";
import { SymmetricEncryptDecrypt } from "../../utils/symmetric.encrypt.decrypt";
import {
  TestWallet,
  testWallets,
  testConnects,
} from "../../test.wallets.contract.connects";
import { ContractConnect } from "../../test.wallets.contract.connects";
import { ethers } from "ethers";
import { arca_diamond_abi } from "../../abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "../../abis/arca.identity.facet.abi";
import { RsaEncryptDecrypt } from "../../utils/rsa.encrypt.decrypt";
import { IdentityEthersOnchain } from "./identity.ethers.onchain";
import { isTemplateExpression } from "typescript";
import { IdentityType } from "./enums/identity.type.enum";
import { FhirPerson, generateCompositeId } from "./entities/fhir.person.resource";
import { FhirRelatedPerson, generateId } from "./entities/fhir.related.person.resource";
import { FhirMedicalGuardianRelationshipRoleType } from "./enums/fhir.personal.relationship.role.type.enum";

// const dotenv = require("dotenv");
// const path = require("path");

// dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// const arcaDiamondAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const combinedABIs = [...arca_diamond_abi, ...arca_identity_facet_abi];

const ipfsOperator = new IpfsOperator();

const fhirPatientStorageType = FhirPatient.name;
const fhirPersonStorageType = FhirPerson.name;
const fhirRelatedPersonStorageType = FhirRelatedPerson.name;


const SED = new SymmetricEncryptDecrypt();
const RED = new RsaEncryptDecrypt();

export class ArcaIdentityService {
  constructor(private identityEthersOnchain: IdentityEthersOnchain) {}

  async getIdentityCount(wallet: ethers.Wallet) {
    try {
      return await this.identityEthersOnchain.getIdentityCount(wallet);
    } catch (error) {
      throw new Error(
        `Error getting identity count from onchain identity facet: ${error}`,
      );
    }
  }


  async addAdmin(wallet: ethers.Wallet, contractConnect: ethers.Contract, newAdminAddress: string) {
    try {
      await this.identityEthersOnchain.addAdmin(wallet, contractConnect, newAdminAddress);
    } catch (error) {
      throw new Error(`Error adding admin: ${error}`);
    }
  }


  async checkIsAdmin(wallet: ethers.Wallet){
    try {
      return await this.identityEthersOnchain.checkIsAdmin(wallet);
    } catch (error) {
      throw new Error(`Error checking if admin: ${error}`);
    }
  }

  async checkIsMedicalGuardianOfPatient(medicalGuardianWallet: ethers.Wallet, patientAddress: string){
    try {
      return await this.identityEthersOnchain.checkIsMedicalGuardianOfPatient(medicalGuardianWallet, patientAddress)
    } catch (error) {
      throw new Error(`Error checking if medical guardian of patient: ${error}`)
    }
  }

  async createAdminMsgAndSig(
    message: string,
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
  ) {
    try {
      return await this.identityEthersOnchain.saveAdminInitializationMessageHash(
        message,
        wallet,
        contractConnect,
      );
    } catch (error) {
      throw new Error(`Error creating admin message and signature: ${error}`);
    }
  }

  async getAdminMsgAndSigs(wallet: ethers.Wallet) {
    try {
      return await this.identityEthersOnchain.getAdminInitializationMessageHashesAndSignatures(
        wallet,
      );
    } catch (error) {
      throw new Error(`Error getting admin message and signature: ${error}`);
    }
  }

  async isRegisteredPatient(wallet: ethers.Wallet, patientAddress: string) {
    try {
      return await this.identityEthersOnchain.isRegisteredPatient(wallet, patientAddress);
    } catch (error) {
      throw new Error(`Error checking if registered patient: ${error}`)
    }
  }


  async isRegisteredMedicalGuardian(wallet: ethers.Wallet, medicalGuardianAddress: string){
    try {
      return await this.identityEthersOnchain.isRegisteredMedicalGuardian(wallet, medicalGuardianAddress);
    } catch (error) {
      throw new Error(`Error checking if registered medical guardian: ${error}`)
    }
  }

  async registerPatient(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    gender: Gender,
    homeAddress: string,
    cityOfResidence?: string,
    stateOfResidence?: string,
    countryOfResidence?: string,
    employmentStatus?: EmploymentStatus,
    telephone?: string,
    email?: string
  ) {
    try {
      // check if there are admin init msg and sigs
      const adminMsgAndSigs =
        await this.identityEthersOnchain.getAdminInitializationMessageHashesAndSignatures(
          wallet,
        );
      if (!adminMsgAndSigs || adminMsgAndSigs.length === 0) {
        throw new Error("No admin initialization hashes found.");
      }
      let identityData = new FhirPatient(
        wallet.address,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        homeAddress,
        cityOfResidence,
        stateOfResidence,
        countryOfResidence,
        employmentStatus,
        telephone,
        email
      )

      const fhirPatientResource = identityData.constructResource()

      const plainIdentityJsonData = JSON.stringify(fhirPatientResource);
      // secret key encryption of plain data
      const { encryptedData, iv, dek } = (await SED.encryptData(
        plainIdentityJsonData,
      ))!;

      console.log("Encrypted data: ", encryptedData);
      console.log("IV: ", iv);

      const senderPk = wallet.signingKey.publicKey;

      //** getting the recovered public key and signature of a random admin from the onchain facet to encrypt the dek with the admin's public key and for registering the patient onchain with the admin's signature as proof of authorization of the patient registration by an admin */
      const { adminRecoveredPublicKey, adminMessageSignature } = await this.identityEthersOnchain.selectRandomAdminPublicKeyAndSignature(
          wallet,
        );
      const computedAdminAddress = ethers.computeAddress(adminRecoveredPublicKey!)

      console.log("Admin Recovered Public Key: ", adminRecoveredPublicKey)
      console.log("Admin computed address: ", computedAdminAddress)
      const rsaEncryptedKeys = RED.dualKeyEncryption(
        dek,
        wallet.address,
        senderPk,
        adminRecoveredPublicKey!,
        computedAdminAddress
      )!;
      const encryptionMetadata: EncryptionMetadata = {
        dekIv: iv,
        rsaKeys: rsaEncryptedKeys,
      };
      const data: IpfsEnvelope = {
        storageType: fhirPatientStorageType,
        primaryWalletAddress: wallet.address,
        uploadedAt: new Date(),
        encryptedData,
        encryptionMetaData: encryptionMetadata,
      };
      const jsonData = JSON.stringify(data);

      const fileName: string = `${wallet.address}-fhir-patient.json`; // using the wallet address as file key
      const { cid, uploadRequest } = await ipfsOperator.uploadJsonData(
        fileName,
        jsonData,
      );
      console.log("Filebase upload response: ", uploadRequest);

      // registering patient onchain
      await this.identityEthersOnchain.registerPatientOnChain(
        wallet,
        contractConnect,
        cid!,
        adminMessageSignature,
        rsaEncryptedKeys[0].rsaEncryptedMasterDEK,
      );
      console.log("Patient registration successful");
    } catch (error) {
      throw new Error(`Error registering patient: ${error}`);
    }
  }

  async decryptAndReadIPFSPatientData(
    privateKey: string,
    encryptedDekForAdmin: string,
    encryptedPatientData: string,
    iv: string,
  ) {
    try {
      const decryptedRsaDEK = RED.decryptData(privateKey, encryptedDekForAdmin);
      const decryptedPatientData = SED.decryptData(
        encryptedPatientData,
        decryptedRsaDEK,
        iv,
      );
      console.log("Decrypted patient data:", decryptedPatientData);
    } catch (error) {
      throw new Error(
        `Error decrypting and reading IPFS patient data: ${error}`,
      );
    }
  }

  async verifyPatient(wallet: ethers.Wallet, patientAddress: string) {
    try {
      await this.identityEthersOnchain.verifyOnchainPatient(
        wallet,
        patientAddress,
      );
    } catch (error) {
      throw new Error(`Error verifying patient: ${error}`);
    }
  }

  async readPatientOnchainData(
    wallet: ethers.Wallet,
    patientAddress: string,
  ) {
    try {
      return await this.identityEthersOnchain.getPatientDataOnChain(
        wallet,
        patientAddress,
      );
    } catch (error) {
      throw new Error(`Error reading patient on chain data: ${error}`);
    }
  }


  async verifyAdminSenderInitSigForPatientIpfsData(
    wallet: ethers.Wallet, 
    patientAddress: string, 
    adminInitMessage: string
  ){
    try {
      const senderIsAdmin = await this.checkIsAdmin(wallet)
      if(senderIsAdmin){
        const patient = await this.readPatientOnchainData(wallet, patientAddress)
        const adminInitSig = patient.adminInitializationSignature

        const adminInitMsgHash = ethers.hashMessage(adminInitMessage)
        const recoveredAdminAddress = ethers.recoverAddress(adminInitMsgHash, adminInitSig)

        if(recoveredAdminAddress == wallet.address){
          return true;
        }
        else{
          return false;
        }
      }
      throw new Error("Sender is not an admin, cannot verify initialization signature for patient IPFS data")
    } catch (error) {
      throw new Error(`Error verifying admin initialization signature for patient IPFS data: ${error}`)
    }
  }


  async readPatientIpfsData(
    wallet: ethers.Wallet, 
    patientAddress: string,
    adminInitMessage: string
  ){
    try {
      const senderIsAdmin = await this.checkIsAdmin(wallet)
      const senderIsMedicalGuardianOfPatient = await this.checkIsMedicalGuardianOfPatient(wallet, patientAddress)
      if(senderIsAdmin){
         //* verifying patient IPFS data was encrypted with the appropriate admin signature before any further operation
        const isAppropriateAdmin = await this.verifyAdminSenderInitSigForPatientIpfsData(wallet, patientAddress, adminInitMessage)
        if(!isAppropriateAdmin){
          throw new Error("The signature of the admin sender cannot be verified to have initialized the patient data, hence cannot be authorized to read the patient IPFS data")
        }
        const patientCid = await this.identityEthersOnchain.getCidOfPatientAddress(wallet, patientAddress)
        const ipfsDataEnvelope = await ipfsOperator.getFileByCid(patientCid)
        let jsonIPFSDataEnvelope: IpfsEnvelope = JSON.parse(ipfsDataEnvelope)

        const adminRsaEncryptedDEK = jsonIPFSDataEnvelope.encryptionMetaData?.rsaKeys.find(item=> item.identityType == IdentityType.ADMIN)?.rsaEncryptedMasterDEK

        const decryptedDekForAdmin = RED.decryptData(
          wallet.privateKey, 
          adminRsaEncryptedDEK!
        )

        const decryptedPatientData = await SED.decryptData(
          JSON.parse(ipfsDataEnvelope).encryptedData,
          decryptedDekForAdmin,
          JSON.parse(ipfsDataEnvelope).encryptionMetaData.dekIv,
        )
        console.log("Decrypted patient data:", decryptedPatientData);
        return decryptedPatientData;
      }


      // else if sender is medical guardian
      else if(senderIsMedicalGuardianOfPatient){
        const patientCid = await this.identityEthersOnchain.getCidOfPatientAddress(wallet, patientAddress)
        // const patientOnchainData = await this.readPatientOnchainData(wallet, patientAddress)


        const ipfsDataEnvelope = await ipfsOperator.getFileByCid(patientCid)
        let jsonIPFSDataEnvelope: IpfsEnvelope = JSON.parse(ipfsDataEnvelope)

        const medicalGuardianRsaEncryptedDEK = jsonIPFSDataEnvelope.encryptionMetaData?.rsaKeys.find(item=> item.identityType == IdentityType.MEDICAL_GUARDIAN && item.wallet == wallet.address)?.rsaEncryptedMasterDEK
        const decryptedDekForMedicalGuardian = RED.decryptData(
          wallet.privateKey, 
          medicalGuardianRsaEncryptedDEK!
        )

        const decryptedPatientData = SED.decryptData(
          JSON.parse(ipfsDataEnvelope).encryptedData,
          decryptedDekForMedicalGuardian,
          JSON.parse(ipfsDataEnvelope).encryptionMetaData.dekIv,
        )

        console.log("Decrypted patient data:", decryptedPatientData);
        return decryptedPatientData;
      }

      // else sender is patient
      else{
        const patientCid = await this.identityEthersOnchain.getCidOfPatientAddress(wallet, patientAddress)
        // const patientOnchainData = await this.readPatientOnchainData(wallet, patientAddress)

        const ipfsDataEnvelope = await ipfsOperator.getFileByCid(patientCid)
        let jsonIPFSDataEnvelope: IpfsEnvelope = JSON.parse(ipfsDataEnvelope)

        // allowing either the main patient address or linked secondary address to read the data
        const patientRsaEncryptedDEK = jsonIPFSDataEnvelope.encryptionMetaData?.rsaKeys.find(item=> item.wallet == wallet.address)?.rsaEncryptedMasterDEK
        const decryptedDekForSender = RED.decryptData(
          wallet.privateKey, 
          patientRsaEncryptedDEK!
        )

        const decryptedPatientData = SED.decryptData(
          JSON.parse(ipfsDataEnvelope).encryptedData,
          decryptedDekForSender,
          JSON.parse(ipfsDataEnvelope).encryptionMetaData.dekIv,
        )

        console.log("Decrypted patient data:", decryptedPatientData);
        return decryptedPatientData;
      }

    } catch (error) {
      throw new Error(`Error reading patient IPFS data: ${error}`);
    }
  }


  async readMedicalGuardianFhirPersonIpfsData(wallet: ethers.Wallet, medicalGuardianAddress: string){
    try {
      const medicalGuardianFhirPersonCid = await this.identityEthersOnchain.getMedicalGuardianFhirPersonCid(wallet, medicalGuardianAddress)
      const ipfsDataEnvelope = await ipfsOperator.getFileByCid(medicalGuardianFhirPersonCid)
      let jsonIPFSDataEnvelope: IpfsEnvelope = JSON.parse(ipfsDataEnvelope)
      
      const encryptedFhirData = jsonIPFSDataEnvelope.encryptedData
      const decryptedFhirData = RED.decryptData(wallet.privateKey, encryptedFhirData)
      console.log("Decrypted FHIR person resource: ", decryptedFhirData)
      return decryptedFhirData
    } catch (error) {
      throw new Error(`Error reading medical guardian FhirPerson IPFS data: ${error}`)
    }
  }

  // async convertBytesToString(rsaMasterKeyBytes: string) {
  //   try {
  //     const stringKey = ethers.toUtf8String(rsaMasterKeyBytes);
  //     return stringKey;
  //   } catch (error) {
  //     throw new Error(`Error converting RSA master key to string: ${error}`);
  //   }
  // }

  async linkAddressRequest(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    patientAddress: string,
    linkMessage: string,
  ) {
    try {
      return await this.identityEthersOnchain.linkAddressRequest(
        wallet,
        contractConnect,
        patientAddress,
        linkMessage,
      );
    } catch (error) {
      throw new Error(`Error sending request for linking address: ${error}`);
    }
  }

  async approveLinkAddressRequest(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    secondaryAddress: string,
    approvalMessage: string,
  ) {
    try {

      await this.identityEthersOnchain.approveLinkAddressRequest(
        wallet,
        contractConnect,
        secondaryAddress,
        approvalMessage,
      );

    } catch (error) {
      throw new Error(`Error approving link address request: ${error}`);
    }
  }

  // onchain operation
  async storeRsaMasterDekForLinkedAccount(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    requestHash: string,
    requestSignature: string,
  ) {
    try {
      const walletAddress = await wallet.getAddress();
      const patient = await this.readPatientOnchainData(
        wallet,
        walletAddress,
      );
      const patientRsaMasterDEKs = patient.rsaMasterDEKs;
      const mainItemRsaData = patientRsaMasterDEKs.find(
        (item) => item.identity === patient.primaryAddress,
      );
      const mainRsaKey = mainItemRsaData!.rsaMasterDEK // already converted from bytes to string

      let decryptedMainRsaKey = mainRsaKey;
      if (mainRsaKey.length > 100) {
        decryptedMainRsaKey = RED.decryptData(wallet.privateKey, mainRsaKey);
      }

      const recoveredPublicKey = ethers.SigningKey.recoverPublicKey(
        requestHash,
        requestSignature,
      );
      const recoveredAddress = ethers.recoverAddress(
        requestHash,
        requestSignature,
      );
      console.log("Linked Account Recovered public key: ", recoveredPublicKey);
      console.log("Linked Account Recovered address: ", recoveredAddress);

      const linkedAccountRsaMasterDek = RED.encryptData(
        recoveredPublicKey,
        decryptedMainRsaKey,
      );
      await this.identityEthersOnchain.storeRsaMasterDekForLinkedAddressOnChain(
        wallet,
        contractConnect,
        recoveredAddress,
        linkedAccountRsaMasterDek,
      );

      //* storing the linked master key in IPFS data
      await this.addLinkedSecondaryRsaMasterKeysIpfsPatientProfileData(wallet, recoveredAddress, linkedAccountRsaMasterDek)

      console.log("RSA master dek for linked account stored successfully")
    } catch (error) {
      throw new Error(
        `Error storing RSA master dek for linked account: ${error}`,
      );
    }
  }

  async getAddressCidOfCurrentPatientSender(wallet: ethers.Wallet) {
    try {
      const cid = await this.identityEthersOnchain.getAddressCidOfPatientSender(wallet)
      console.log("Address CID:", cid)
      return cid
    } catch (error) {
      throw new Error(`Error fetching sender's cid: ${error}`)
    }
  }


  // offchain operation
  async addLinkedSecondaryRsaMasterKeysIpfsPatientProfileData( wallet: ethers.Wallet, secondaryAddress: string, linkedRsaMasterDEK: string){
    try {
      const oldCid = await this.getAddressCidOfCurrentPatientSender(wallet)
      const oldData = JSON.parse(await ipfsOperator.getFileByCid(oldCid))
      let newData = oldData

      const walletToRsaMasterDEK: IdentityRsaMasterKey = {
        wallet: secondaryAddress,
        rsaEncryptedMasterDEK: linkedRsaMasterDEK,
        identityType: IdentityType.PATIENT_LINKED_ADDRESS
      }
      newData.encryptionMetaData!.rsaKeys.push(walletToRsaMasterDEK)
      const jsonData = JSON.stringify(newData);

      const fileName: string = `${wallet.address}-fhir-patient.json`; // using the wallet address as file key
      const { cid, uploadRequest } = await ipfsOperator.uploadJsonData(
        fileName,
        jsonData,
      );

      console.log("Filebase upload response: ", uploadRequest)
      await this.identityEthersOnchain.updateAddressCid(wallet, cid!)

    } catch (error) {
      throw new Error(`Error replacing profile data to add linked secondary address on Filebase pinning service: ${error}`)
    }
  }


  async unlinkSecondaryAddress(wallet: ethers.Wallet, secondaryAddress: string){
    try{
      const updatedCid = await this.removeLinkedSecondaryRsaMasterKeysIpfsPatientProfileData(wallet, secondaryAddress)

      await this.identityEthersOnchain.unlinkSecondaryAddress(wallet, secondaryAddress, updatedCid)
      console.log("Successful disconnection on linked address")
    }
    catch(error){
      throw new Error(`Error disconnecting secondary address: ${error}`)
    }
  }

  async removeLinkedSecondaryRsaMasterKeysIpfsPatientProfileData(wallet: ethers.Wallet, secondaryAddress: string){
    try {
      const oldCid = await this.getAddressCidOfCurrentPatientSender(wallet)
      const oldData = JSON.parse(await ipfsOperator.getFileByCid(oldCid))
      let newData = oldData

      let senderKeys: IdentityRsaMasterKey[] = newData.encryptionMetaData!.rsaKeys.rsaEncryptedMasterDEKsForSender

      const secondaryAddressExists = senderKeys.some(item => item.wallet === secondaryAddress)

      if (!secondaryAddressExists) {
        throw new Error(`Secondary address ${secondaryAddress} does not exist in the linked addresses list`)
      }

      let reservedMasterSenderDEKsForSender = senderKeys.filter(senderKeys => senderKeys.wallet !== secondaryAddress)

      newData.encryptionMetaData!.rsaKeys.rsaEncryptedMasterDEKsForSender = reservedMasterSenderDEKsForSender

      const jsonData = JSON.stringify(newData);

      const fileName: string = `${wallet.address}-fhir-patient.json`; // using the wallet address as file key
      const { cid, uploadRequest } = await ipfsOperator.uploadJsonData(
        fileName,
        jsonData,
      );
      
      console.log("Filebase upload response: ", uploadRequest)
      
      return cid

    } catch (error) {
      throw new Error(`Error replacing profile data to remove linked secondary address on Filebase pinning service: ${error}`)
    }
  }


  async generatePrimaryMedicalGuardianConnectionSignature(
    guardianWallet: ethers.Wallet,
    patientAddress: string
  ){
    try {
      const connectionMessage = `I, ${guardianWallet.address}, agree to be connected as a medical guardian to patient with address ${patientAddress}`;
      const connectionSignature = await guardianWallet.signMessage(connectionMessage); // pass raw string
      console.log("Medical guardian connection signature: ", connectionSignature);
      return connectionSignature;
    } catch (error) {
      throw new Error(`Error generating medical guardian connection signature: ${error}`)
    }
  }


  async verifyPrimaryMedicalGuardianConnectionSignature(
    medicalGuardianAddress: string,
    patientAddress: string,
    expectedSignature: string
  ){
    try {
      const connectionMessage = `I, ${medicalGuardianAddress}, agree to be connected as a medical guardian to patient with address ${patientAddress}`
      const connectionMessageHash = ethers.hashMessage(connectionMessage);

      console.log("Medical Guardian Address (passed in):", medicalGuardianAddress);
      console.log("Connection Message:", connectionMessage);
      console.log("Connection Message Hash:", connectionMessageHash);
      console.log("Expected Signature:", expectedSignature);

      const recoveredMedicalGuardianPublicKey = ethers.SigningKey.recoverPublicKey(
        connectionMessageHash,
        expectedSignature,
      );
      const recoveredAddress = ethers.recoverAddress(
        connectionMessageHash,
        expectedSignature,
      ); 
      if(recoveredAddress == ethers.getAddress(medicalGuardianAddress)){
        return{
          isVerifiedSignature: true,
          recoveredMedicalGuardianPublicKey
        }
      }
      return{
        isVerifiedSignature: false,
        recoveredMedicalGuardianPublicKey: null
      }
    } catch (error) {
      throw new Error(`Error verifying medical guardian connection signature: ${error}`)
    }
  }


  //* there is no reason for medical guardian verification by Arca admin, so data is not shared between both parties
  //* in this case ECIES/RSA encryption is only executed my the key-pair of the medical guardian
  async registerMedicalGuardian(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    gender: Gender,
    homeAddress?: string,
    cityOfResidence?: string,
    stateOfResidence?: string,
    countryOfResidence?: string,
    employmentStatus?: EmploymentStatus,
    telephone?: string,
    email?: string
  ){
    try {

      const isRegisteredMedicalGuardian = await this.isRegisteredMedicalGuardian(wallet, wallet.address)
      if(isRegisteredMedicalGuardian){
        throw new Error("Medical guardian is already registered")
      }
      const senderPk = wallet.signingKey.publicKey

      let identityData = new FhirPerson(
        wallet.address,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        homeAddress,
        cityOfResidence,
        stateOfResidence,
        countryOfResidence,
        employmentStatus,
        telephone,
        email
      )

      const fhirPersonResource = identityData.constructResource()
      const plainIdentityData = JSON.stringify(fhirPersonResource)

      const encryptedData = RED.encryptData(senderPk, plainIdentityData)

      const data: IpfsEnvelope = {
        storageType: fhirPersonStorageType,
        primaryWalletAddress: wallet.address,
        uploadedAt: new Date(),
        encryptedData
      };

      const jsonData = JSON.stringify(data);

      const fileName: string = `${wallet.address}-fhir-person.json`; // using the wallet address as file key
      const { cid, uploadRequest } = await ipfsOperator.uploadJsonData(
        fileName,
        jsonData,
      );

      console.log("Filebase upload response: ", uploadRequest);

      await this.identityEthersOnchain.registerMedicalGuardianOnChain(
        wallet,
        contractConnect,
        cid!,
      )
      console.log("Medical guardian registration successful")
    } catch (error) {
      throw new Error(`Error registering medical guardian: ${error}`)
    }
  }



  // todo: still a work in progress
  async updateAndUploadMedicalGuardianFhirResourcesToIpfs(medicalGuardianWallet: ethers.Wallet, minorPatientAddress: string){
    try {
      const guardianPublicKey = medicalGuardianWallet.signingKey.publicKey
      const existingMedicalGuardianFhirPersonIpFsData = await this.readMedicalGuardianFhirPersonIpfsData(medicalGuardianWallet, medicalGuardianWallet.address)
      const existingMedicalGuardianFhirPersonResource = JSON.parse(existingMedicalGuardianFhirPersonIpFsData)

      const walletAddress = existingMedicalGuardianFhirPersonResource.identifier[0].value.replace("did:ethr:", "");

      const firstName = existingMedicalGuardianFhirPersonResource.name[0].given[0];
      const lastName = existingMedicalGuardianFhirPersonResource.name[0].family;

      const gender = existingMedicalGuardianFhirPersonResource.gender;
      const employmentStatus = existingMedicalGuardianFhirPersonResource.extension[0].valueString
      const birthDate = existingMedicalGuardianFhirPersonResource.birthDate;

      const telephone = existingMedicalGuardianFhirPersonResource.telecom.find(
        (t: any) => t.system === "phone"
      )?.value;

      const email = existingMedicalGuardianFhirPersonResource.telecom.find(
        (t: any) => t.system === "email"
      )?.value;

      const homeAddress =  existingMedicalGuardianFhirPersonResource .address[0].text;
      const cityOfResidence = existingMedicalGuardianFhirPersonResource.address[0].city;
      const stateOfResidence = existingMedicalGuardianFhirPersonResource.address[0].state;
      const countryOfResidence = existingMedicalGuardianFhirPersonResource.address[0].country;

      const fhirPerson = new FhirPerson(
        walletAddress,
        firstName,
        lastName,
        birthDate,
        gender,
        homeAddress,
        cityOfResidence,
        stateOfResidence,
        countryOfResidence,
        employmentStatus,
        telephone,
        email
      )

      const fhirResources = fhirPerson.updateAndAddRelatedPersonResourceReference(walletAddress, minorPatientAddress, existingMedicalGuardianFhirPersonResource)
      console.log("FHIR Person Resources: ", fhirResources)

      //* processing updated FHIR person resource of the medical guardian to be uploaded
      const plainFhirPersonIdentityData = JSON.stringify(fhirResources.updatedFhirPersonResource)
      const encryptedFhirPersonData = RED.encryptData(guardianPublicKey, plainFhirPersonIdentityData)

      const fhirPersonIpfsData: IpfsEnvelope = {
        storageType: fhirPersonStorageType,
        primaryWalletAddress: medicalGuardianWallet.address,
        uploadedAt: new Date(),
        encryptedData: encryptedFhirPersonData
      }

      const fhirPersonJsonData = JSON.stringify(fhirPersonIpfsData);
      const updatedFhirPersonFileName = `${medicalGuardianWallet.address}-fhir-person.json`

      const { cid, uploadRequest } = await ipfsOperator.uploadJsonData(
        updatedFhirPersonFileName,
        fhirPersonJsonData,
      )
      const updatedFhirPersonCid = cid
      console.log("Filebase fhir-person upload response: ", uploadRequest)


      //* processing FHIR related person resource of the medical guardian to be uploaded
      const plainFhirRelatedPersonIdentityData = JSON.stringify(fhirResources.relatedPersonResource)
      const encryptedFhirRelatedPersonData = RED.encryptData(guardianPublicKey, plainFhirRelatedPersonIdentityData)

      const fhirRelatedPersonIpfsData: IpfsEnvelope = {
        storageType: fhirRelatedPersonStorageType,
        primaryWalletAddress: medicalGuardianWallet.address,
        uploadedAt: new Date(),
        encryptedData: encryptedFhirRelatedPersonData
      }

      const fhirRelatedPersonJsonData = JSON.stringify(fhirRelatedPersonIpfsData)
      const fhirRelatedPersonFileName = `${medicalGuardianWallet.address}-${minorPatientAddress}-fhir-related-person.json`

      const fhirRelatedPersonUpload = await ipfsOperator.uploadJsonData(
        fhirRelatedPersonFileName,
        fhirRelatedPersonJsonData,
      )

      const fhirRelatedPersonCid = fhirRelatedPersonUpload.cid
      console.log("Filebase fhir-related-person upload response: ", fhirRelatedPersonUpload.uploadRequest)

      return{
        updatedFhirPersonCid,
        fhirRelatedPersonCid
      }

    } catch (error) {
      throw new Error(`Error processing FhirRelatedPerson resource from FhirPerson resource: ${error}`)
    }    
  }


  async parseMedicalGuardianFhirPerson(wallet: ethers.Wallet, medicalGuardianAddress: string){
    const existingMedicalGuardianFhirPersonIpFsData = await this.readMedicalGuardianFhirPersonIpfsData(wallet, medicalGuardianAddress)

    const existingMedicalGuardianFhirPersonResource = JSON.parse(existingMedicalGuardianFhirPersonIpFsData)

    const walletAddress = existingMedicalGuardianFhirPersonResource.identifier[0].value.replace("did:ethr:", "");

    const firstName = existingMedicalGuardianFhirPersonResource.name[0].given[0];
    const lastName = existingMedicalGuardianFhirPersonResource.name[0].family;

    const gender = existingMedicalGuardianFhirPersonResource.gender;
    const birthDate = existingMedicalGuardianFhirPersonResource.birthDate;

    const telephone = existingMedicalGuardianFhirPersonResource.telecom.find(
      (t: any) => t.system === "phone"
    )?.value;

    const email = existingMedicalGuardianFhirPersonResource.telecom.find(
      (t: any) => t.system === "email"
    )?.value;

    const homeAddress =  existingMedicalGuardianFhirPersonResource .address[0].text;
    const cityOfResidence = existingMedicalGuardianFhirPersonResource.address[0].city;
    const stateOfResidence = existingMedicalGuardianFhirPersonResource.address[0].state;
    const countryOfResidence = existingMedicalGuardianFhirPersonResource.address[0].country;
    
    const computedMedicalGuardianHashedId = generateId(medicalGuardianAddress)

    return{
      walletAddress,
      firstName,
      lastName,
      gender,
      birthDate,
      telephone,
      email,
      homeAddress,
      cityOfResidence,
      stateOfResidence,
      countryOfResidence,
      computedMedicalGuardianHashedId
    }
  }


  async registerMinorPatient(
    medicalGuardianWallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    gender: Gender,
    homeAddress: string,
    relationshipToMinorPatient: FhirMedicalGuardianRelationshipRoleType,
    // medicalGuardianConnectionSignature: string, 
    cityOfResidence?: string,
    stateOfResidence?: string,
    countryOfResidence?: string,
    employmentStatus?: EmploymentStatus,
    telephone?: string,
    email?: string
  ){
    try {
      const adminMsgAndSigs =
        await this.identityEthersOnchain.getAdminInitializationMessageHashesAndSignatures(
          medicalGuardianWallet,
        );
      if (!adminMsgAndSigs || adminMsgAndSigs.length === 0) {
        throw new Error("No admin initialization hashes found.");
      }

      const medicalGuardianData = await this.parseMedicalGuardianFhirPerson(medicalGuardianWallet, medicalGuardianWallet.address)

      const {address, publicKey, privateKey, mnemonicPhrase} = await this.identityEthersOnchain.generateWallet()
      const patientAddress = address
      const patientPublicKey = publicKey
      let minorPatientIdentityData = new FhirPatient(
        patientAddress,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        homeAddress,
        cityOfResidence,
        stateOfResidence,
        countryOfResidence,
        employmentStatus,
        telephone,
        email,
        medicalGuardianData.computedMedicalGuardianHashedId,
        medicalGuardianData.firstName,
        medicalGuardianData.lastName,
        medicalGuardianData.telephone,
        relationshipToMinorPatient,
        medicalGuardianData.homeAddress,
        medicalGuardianData.cityOfResidence,
        medicalGuardianData.stateOfResidence,
        medicalGuardianData.countryOfResidence
      )

      const fhirPatientResource = minorPatientIdentityData.constructResource()
      const plainIdentityJsonData = JSON.stringify(fhirPatientResource)

      // secret key encryption of plain data
      const { encryptedData, iv, dek } = (await SED.encryptData(
        plainIdentityJsonData,
      ))!

      console.log("Encrypted data: ", encryptedData);
      console.log("IV: ", iv);

      //** getting the recovered public key and signature of a random admin from the onchain facet to encrypt the dek with the admin's public key and for registering the patient onchain with the admin's signature as proof of authorization of the patient registration by an admin */
      const { adminRecoveredPublicKey, adminMessageSignature } = await this.identityEthersOnchain.selectRandomAdminPublicKeyAndSignature(
          medicalGuardianWallet,
        );
      const computedAdminAddress = ethers.computeAddress(adminRecoveredPublicKey!)
      console.log("Admin Recovered Public Key: ", adminRecoveredPublicKey)
      console.log("Admin computed address: ", computedAdminAddress)

      const rsaEncryptedKeys = RED.dualKeyEncryption(
        dek,
        patientAddress,
        patientPublicKey,
        adminRecoveredPublicKey,
        computedAdminAddress,
        medicalGuardianWallet.signingKey.publicKey,
        medicalGuardianWallet.address
      )

      const encryptionMetadata: EncryptionMetadata = {
        dekIv: iv,
        rsaKeys: rsaEncryptedKeys,
      }

      const data: IpfsEnvelope = {
        storageType: fhirPatientStorageType,
        primaryWalletAddress: patientAddress,
        uploadedAt: new Date(),
        encryptedData,
        encryptionMetaData: encryptionMetadata,
      }

      const jsonData = JSON.stringify(data);

      const patientIpfsFileName: string = `${patientAddress}-fhir-patient.json`; // using the wallet address as file key
      const { cid, uploadRequest } = await ipfsOperator.uploadJsonData(
        patientIpfsFileName,
        jsonData,
      )
      console.log("Filebase fhirPatient upload response: ", uploadRequest)

      //* calculating date of majority
      const dateOfAgeOfMajority = new Date(dateOfBirth);
      dateOfAgeOfMajority.setFullYear(dateOfAgeOfMajority.getFullYear() + 18)

      const fhirPatientCid = cid
      const guardianCids = await this.updateAndUploadMedicalGuardianFhirResourcesToIpfs(medicalGuardianWallet, patientAddress)

      console.log("Interacting with onchain smart contract")
      await this.identityEthersOnchain.registerMinorPatient(
        medicalGuardianWallet,
        contractConnect,
        dateOfAgeOfMajority,
        fhirPatientCid,
        guardianCids.updatedFhirPersonCid,
        guardianCids.fhirRelatedPersonCid,
        adminMessageSignature,
        rsaEncryptedKeys[0].rsaEncryptedMasterDEK, // master DEK for minor patient
        rsaEncryptedKeys[2].rsaEncryptedMasterDEK,  // master DEK for medical guardian
        patientAddress
      )

    } catch (error) {
      throw new Error(`Error registering minor patient: ${error}`)
    }
  }


  async getMedicalGuardians(wallet: ethers.Wallet, patientAddress: string){
    try {
      const medicalGuardians = await this.identityEthersOnchain.getMedicalGuardians(wallet, patientAddress);
      return medicalGuardians;
    } catch (error) {
      throw new Error(`Error getting medical guardians: ${error}`);
    }
  }


  async fetchPaginatedPatientCids(wallet: ethers.Wallet, cursor: number, howMany: number){
    try {
      await  this.identityEthersOnchain.fetchPaginatedPatientCids(wallet, cursor, howMany)
    } catch (error) {
      throw new Error(`Error getting paginated medical permissions: ${error}`);
    }
  }


  async generateWallet(){
    return await this.identityEthersOnchain.generateWallet()
  }

  async generateSignature(wallet: ethers.Wallet, message: string){
    return await this.identityEthersOnchain.generateSignature(wallet, message)
  }

  // async dummyReadPatientData(encryptedData: string, dek: string, iv: string) {
  //   const decryptedData = await SED.decryptData(encryptedData, dek, iv);
  //   const decryptedJsonData = JSON.parse(decryptedData!);
  //   console.log("Decrypted Json data: ", decryptedJsonData);
  // }
}

//////* TESTINGS *////////

const identityEthersOnchain = new IdentityEthersOnchain();
const arcaIdentityService = new ArcaIdentityService(identityEthersOnchain);

let patient1Wallet = testWallets[1];
let patient1ContractConnect = testConnects[1];


let admin2Wallet = testWallets[3];
let admin2ContractConnect = testConnects[3];

const primaryGuardianWallet = testWallets[4];
const primaryGuardianContractConnect = testConnects[4];

const secondGuardianWallet = testWallets[5];

const generatedWallet = testWallets[6]

const minorPatientGeneratedWallet = testWallets[7]




// arcaIdentityService.isRegisteredPatient(patient1Wallet, patient1Wallet.address)
// arcaIdentityService.isRegisteredMedicalGuardian(patient1Wallet, primaryGuardianWallet.address)

// arcaIdentityService.registerPatient(
//   patient1Wallet,
//   patient1ContractConnect,
//   "John",
//   "Doe",
//   new Date(),
//   Gender.MALE,
//   "123 Main St",
//   "Lagos",
//   "Lagos",
//   "Nigeria",
//   EmploymentStatus.STUDENT,
//   "+2349058858858",
//   "testprince@gmail.com",
// );

const iv = "89c16532618816bd38342b9170d5f9b4";
const dek = "d49d0fd9328b899ae38204c8c23fd492e6d742529acecc99e62ae4b2d06f7766";
const encryptedData =
  "f8cdc73b1d534d15aecad5fdab488c265faf5c77913950d011ec6084354743e4b3b5f8f34cdf42151c451b38e7827f6880ba7f526cacf563d7a03b2022d5ad3adab145cb32630b9189b1fa8c868ba6c9daabcce415602446b9aa3ba04baa3402abca3b3e6a21265f0f6e640f00c904bc7ee1bc93ead9497d070dd7f290bad45796aa5a9db9375491100498b8edd251d173b0dcda8ce2239d07a911dc4c4c6d0b6d3ff1d76cb41073935231e846318764376401fb6bb5f6a9673411b9f7ffe67f";

// arcaIdentityService.dummyReadPatientData(encryptedData, dek, iv)

let ownerWallet = testWallets[0];
let ownerContractConnect = testConnects[0];


// arcaIdentityService.generateWallet()

// arcaIdentityService.getIdentityCount(ownerWallet);
// arcaIdentityService.addAdmin(ownerWallet, ownerContractConnect, admin2Wallet.address)
// arcaIdentityService.checkIsAdmin(ownerWallet)

const adminInitMessage = "I am an Arca admin";
arcaIdentityService.createAdminMsgAndSig(adminInitMessage, ownerWallet, ownerContractConnect)
// arcaIdentityService.getAdminMsgAndSigs(ownerWallet);

const ownerSecretKey = ownerWallet.signingKey.privateKey;
const encryptedDekForAdmin =
  "BPOSV3gSjd3U+E+cBu6BjimUEZur4OuqMv8CR9GGnj7yiHsWfdfQzyKfqFjAcJN3L8cfwR0X5ZEjw8ymjmmdh2Kv5WlHxia9LdFxuM4fMEC3oGEONCCXAKxbxZh3vY8jfusY9mw4idLvs/htpt1Egd9lyCfBFtV0L2MqMwK2rNU+xU8TWrHLZcPQAL9cQY7L1Npy4IyTMuTl/VBlWwVZQlQ=";
const encryptedPatientData =
  "920cdd0b2b041d44e1ba4f7385e688d9c603b94a9f2cb40fe806f18023928be026e375910f6a8f652e4371405a1cbace799784a1c3ff70d8949c3504d50fc6cb763cb4774200de259f089a06fcdfe96c9883becc43b08786da1ce6d3fbf59eeb9cb756f6db39eae767d1b7e274c00448fc02f35f427f464af006f5ba8a79b8de65af851434afb4b8f723a624271ef3456dc173f75ce347ef42be75ee91c3ad9dfe9f65e6bd2cf610fcfe7af4b1a9a12287f2b362384f851bd16981df9b3f485e";
const dekIv = "790845267e816c1bae50ab7ce235b816";

// arcaIdentityService.decryptAndReadIPFSPatientData(
//   ownerSecretKey,
//   encryptedDekForAdmin,
//   encryptedPatientData,
//   dekIv
// )

// arcaIdentityService.verifyPatient(ownerWallet, patient1Wallet.address)

// arcaIdentityService.readPatientOnchainData(
//   // ownerWallet,
//   patient1Wallet,
//   patient1Wallet.address,
// );

const patient1SecondaryWallet = testWallets[2];
const patient1SecondaryContractConnect = testConnects[2];
const linkRequestMessage = "Request for unified access";

// arcaIdentityService.linkAddressRequest(
//   patient1SecondaryWallet,
//   patient1SecondaryContractConnect,
//   patient1Wallet.address,
//   linkRequestMessage
// )

const approvalMessage = "I approve the request for unified access";
// arcaIdentityService.approveLinkAddressRequest(
//   patient1Wallet,
//   patient1ContractConnect,
//   patient1SecondaryWallet.address,
//   approvalMessage,
// );


// arcaIdentityService.storeRsaMasterDekForLinkedAccount(
//   patient1Wallet,
//   patient1ContractConnect,
//   "0xb786411fa0e5f61e565b234f19b74afe01e1026fbb48bbcd7f3949bdafaf37b8",
//   "0xc5a7d10b07d96f878e1fcb3750d1427d17fe50a80cf60bd095845f7ccbd39bc4202aecf23748c0df0f9a740a09f5a0e1a88a6f14a16e8fb1bd6590f6d16c8b4d1b"
// )


// arcaIdentityService.unlinkSecondaryAddress(
//   patient1Wallet, 
//   patient1SecondaryWallet.address
// )


// arcaIdentityService. getAddressCidOfCurrentSender(patient1Wallet)



// arcaIdentityService.readPatientIpfsData(
//   // patient1Wallet,
//   minorPatientGeneratedWallet,
//   // generatedWallet,
//   // patient1SecondaryWallet,
//   // ownerWallet,
//   // primaryGuardianWallet, // primary medical guardian trying to read the patient IPFS data 
//   // secondGuardianWallet, // second medical guardian trying to read the patient IPFS data
//   // patient1Wallet.address,
//   minorPatientGeneratedWallet.address,
//   // generatedWallet.address,
//   adminInitMessage
// )


// arcaIdentityService.generatePrimaryMedicalGuardianConnectionSignature(
//   primaryGuardianWallet,
//   patient1Wallet.address
// )

// arcaIdentityService.registerMedicalGuardian(
//   primaryGuardianWallet,
//   primaryGuardianContractConnect,
//   "Matthew",
//   "Male",
//   new Date('1980-01-01'),
//   Gender.MALE,
//   "123 Main St",
//   "Lagos",
//   "Lagos",
//   "Nigeria",
//   EmploymentStatus.SELF_EMPLOYED,
//   "+2349058858858",
//   "matthewsmith@gmail.com"
// )


// arcaIdentityService.readMedicalGuardianFhirPersonIpfsData(primaryGuardianWallet, primaryGuardianWallet.address)


// arcaIdentityService.registerMinorPatient(
//   primaryGuardianWallet,
//   primaryGuardianContractConnect,
//   "Samantha",
//   "Cole",
//   new Date('2022-03-02'),
//   Gender.FEMALE,
//   "123 Main St",
//   FhirMedicalGuardianRelationshipRoleType.FAMMEMB,
//   "Lagos",
//   "Lagos",
//   "Nigeria",
//   EmploymentStatus.STUDENT,
//   "+2349059959955",
//   "testsamantha@gmail.com",
// )


// arcaIdentityService.getMedicalGuardians(
//   patient1Wallet, 
//   // patient1SecondaryWallet,
//   patient1Wallet.address
// )

// arcaIdentityService.fetchPaginatedPatientCids(primaryGuardianWallet, 0, 3)


// arcaIdentityService.generateSignature(
//   patient1Wallet,
//   "I am a user in Arca's system"
// )