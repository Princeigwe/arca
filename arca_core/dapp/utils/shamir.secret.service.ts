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

// const shamirSecretService = new ShamirSecretService()

// const testPrivateKey = "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

// shamirSecretService.splitSecret(testPrivateKey)


// const share1String = "924348f575a636cc094684c0d14922cee1fb37584c738d6815903f25755cf6794afb36576337e708b6de3b6ff9159405ed8050c187e3aeb3897779b89ed96e85b36a57"
// const share2String = "985ee6c4527cead24ddf0f02318cfabee30259773e7292fce7c3c0931a55f5828f6cb3933f6eb9c931f39da237e7acbb4952eef9be61e503cfaa5ef2b7464dd23127e0"
// const share3String = "4f97980a120bd0b01a220a5acf09b6c1d84344db7ae2600be18accc297295ef80a30178647f0fa3aae640fcbf5e11e06e0c9534b9c18831fa3001e0456f67bed480c21"

// shamirSecretService.combineSecrets(share1String, share3String)

// shamirSecretService.verifyCombined(testPrivateKey, share1String, share3String)