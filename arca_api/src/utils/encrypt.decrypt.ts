import 'dotenv/config'
import * as AesEncryption from 'aes-encryption'


// console.log("----------------")
// console.log(process.env.ENCRYPTION_SECRET_KEY)
// console.log("----------------")


const aes = new AesEncryption()
aes.setSecretKey(process.env.ENCRYPTION_SECRET_KEY)




export class SymmetricEncryption{

  async encrypt(plainData: string){
    return await aes.encrypt(plainData)
  }

  async decrypt(cipherText: string){
    return await aes.decrypt(cipherText)
  }
}


const sym = new SymmetricEncryption()


sym.encrypt("hello world").then((res) => {
  console.log(res)

sym.decrypt(res).then((res) => {
  console.log(res)
}).catch((err) => {
  console.log(err)
})}
)