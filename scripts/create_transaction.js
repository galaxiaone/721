const ethers = require('ethers')
var path = require('path')
const root = path.resolve('.')
require('dotenv').config({ path: path.join(root, '/.env') })

const MNEMONIC = process.env.PRIVATE_KEY
const INFURA_KEY = process.env.INFURA
const NFT_CONTRACT_ADDRESS = process.env.CONTRACT
const NETWORK = process.env.NETWORK

const CHAIN_IDS = { mainnet: 1, ropsten: 3, rinkeby: 4 }

const OK = (value) => {
  return { err: null, result: value }
}

const ERR = (msg) => {
  return { err: msg, result: null }
}

const checkErr = (result) => {
  if (result.err) {
    console.log(result.err)
    process.exit(1)
  }
}

if (!MNEMONIC || !INFURA_KEY || !NETWORK || !NFT_CONTRACT_ADDRESS) {
  console.log('mnemonic, key, network, address, ', MNEMONIC, INFURA_KEY, NETWORK, NFT_CONTRACT_ADDRESS)
  console.error('Please set a mnemonic, infura key, owner, network, and contract address.')
  process.exit(1)
}

class TransactionBuilder {
  constructor (to, gasLimit, gasPrice, value) {
    this.infuraProvider = new ethers.providers.InfuraProvider(NETWORK, INFURA_KEY)
    this.wallet = new ethers.Wallet(MNEMONIC, this.infuraProvider)
    if (!this.wallet) return ERR('couldnt initialize wallet')
    // Required unless deploying a contract (in which case omit)
    this.tx = {
      to: to, // the target address or ENS name
      // These are optional/meaningless for call and estimateGas
      gasLimit: gasLimit, // the maximum gas this transaction may spend
      gasPrice: gasPrice, // the price (in wei) per unit of gas
      // These are always optional (but for call, data is usually specified)
      data: '', // extra data for the transaction, or input for call
      value: value, // the amount (in wei) this transaction is sending
      chainId: CHAIN_IDS[NETWORK], // the network ID; usually added by a signer
      nonce: 0
    }
  }

  // To replay last transaction set index to -1
  async setNonce (index) {
    try {
      this.tx.nonce = await this.wallet.getTransactionCount('latest') + index
      if (this.tx.nonce < 0) return ERR('Nonce cant be below 0')
      console.log('nonce ', this.tx.nonce)
      return OK(true)
    } catch (err) {
      // return ERR(err)
      return ERR('Couldnt get current nonce for account ')
    }
  }

  // methodString should contain parameter types also -> ie. transfer(address,address,uint256)
  setCalldata (methodString, types, paramData) {
    const methodID = ethers.utils.id(methodString).slice(0, 10)
    console.log('methodID ', methodID.slice(0, 10))
    const encodeParams = ethers.utils.defaultAbiCoder.encode(types, paramData).slice(2)
    this.tx.data = methodID + encodeParams
    return OK(true)
  }

  async getBalance () {
    try {
      const balance = await this.wallet.getBalance('latest')
      return OK(balance)
    } catch (err) {
      return ERR('Couldnt get balance of wallet ')
    }
  }
}

const main = async () => {
  const gasLimit = ethers.utils.bigNumberify('1000000')
  const gasPrice = ethers.utils.bigNumberify('15000000000')

  const tx = new TransactionBuilder(NFT_CONTRACT_ADDRESS, gasLimit, gasPrice, 0)
  console.log('address ', tx.wallet.address)
  // construct mint() call
  const method = {
    types: ['address', 'string'],
    data: [tx.wallet.address, 'QmQ8RrnVwkwwvNoRMEcR49EKtQAni1wzc8suZZZBZApjBo'],
    signature: 'mint(address,string)'
  }
  checkErr(await tx.setNonce(0))
  console.log(tx.tx.nonce)
  checkErr(tx.setCalldata(method.signature, method.types, method.data))
  const receipt = await tx.wallet.sendTransaction(tx.tx)
  console.log(receipt)
//   console.log(tx)
}

main()
