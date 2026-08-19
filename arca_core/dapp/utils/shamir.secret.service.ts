import { split, combine } from "shamir-secret-sharing";
import crypto from "crypto"

export class ShamirSecretService{

  async splitSecret(secret: string){
    try {
      const normalizedSecret = secret.normalize('NFKC')
      const bufferedSecret = Buffer.from(normalizedSecret, 'utf-8')

      // splitting secret into 3 parts, with 2 (threshold) required to reconstruct the secret
      const [share1, share2, share3] = await split(new Uint8Array(bufferedSecret), 3, 2)

      // console.log("share1: ", share1)
      // console.log("share2: ", share2)
      // console.log("share3: ", share3)

      const share1String = Buffer.from(share1).toString('hex')
      const share2String = Buffer.from(share2).toString('hex')
      const share3String = Buffer.from(share3).toString('hex')

      console.log("share1String: ", share1String)
      console.log("share2String: ", share2String)
      console.log("share3String: ", share3String)

      return {
        share1String,
        share2String,
        share3String
      }
    } catch (error) {
      throw new Error(`Error splitting secret: ${error}`)
    }
  }


  async combineSecrets(share1String: string, share2String: string){
    try {
      const share1Array: Uint8Array = new Uint8Array(Buffer.from(share1String, 'hex'))
      const share2Array: Uint8Array = new Uint8Array(Buffer.from(share2String, 'hex'))

      const restoredSecret = await combine([share1Array, share2Array])
      const originalSecret = Buffer.from(restoredSecret).toString('utf-8')

      console.log("original secret from combine: ", originalSecret)
      return{
        restoredSecret: originalSecret
      }
    } catch (error) {
      throw new Error(`Error combining secrets: ${error}`)
    }
  }


  async verifyCombined(testAgainstSecret: string, share1String: string, share2String: string){
    try {
      const share1Array: Uint8Array = new Uint8Array(Buffer.from(share1String, 'hex'))
      const share2Array: Uint8Array = new Uint8Array(Buffer.from(share2String, 'hex'))

      const restoredSecret = await combine([share1Array, share2Array])
      const originalSecret = Buffer.from(restoredSecret).toString('utf-8')

      console.log("Combined Secret test valid: ", originalSecret === testAgainstSecret)

      // return{
      //   restoredSecret: originalSecret,
      //   isValid: originalSecret === testAgainstSecret
      // }
    } catch (error) {
      throw new Error(`Error combining secrets: ${error}`)
    }
  }

}


//TESTING

const shamirSecretService = new ShamirSecretService()

const testPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

// console.log("--- RUNNING SPLIT TEST ---")
// shamirSecretService.splitSecret(testPrivateKey).then(shares => {
//   console.log("Splitting with '0x' prefix:")
//   console.log("Share 1 length (hex chars):", shares.share1String.length)
// })


// console.log("--- RUNNING COMBINE TEST ---")
// const share1String = "01321d9dc65b7da800668a3cd77a3e6dc89ff64ed86ba6e20037f8b69801da272c91db0b447a820cb1b9045097035bda29b77715573cce83479955392aaeb2b9f9"
// const share2String = "0202d30f2c7dc7eb996add40838e1a79600ebc6581732194c73bc23d0298561d1ff186da2290ccdd3416ca69c8cf7f801f0e88f4794768a42cd17410e92f3011c0"

// shamirSecretService.combineSecrets(share1String, share2String)

// shamirSecretService.verifyCombined(testPrivateKey, share1String, share3String)