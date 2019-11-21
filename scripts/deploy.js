const util = require('util')
const ethers = require('ethers')
const fs = require('fs')
const verifier = require('sol-verifier')

const path = require('path')
require('dotenv').config({ path: path.join('/.env') })
const root = path.resolve('.')

// Contract ABI & Bytecode
const galaxiaBuild = require(path.join(root, '/build/Galaxia.json'))
const contractPath = path.join(root, '/src/contracts/tokens/Galaxia.sol')

// Environment variables
const INFURA_KEY = process.env.INFURA
const NETWORK = process.env.NETWORK
const MNEMONIC = process.env.PRIVATE_KEY
const ETHERSCAN = process.env.ETHERSCAN_API

const readFile = util.promisify(fs.readFile)

if (!MNEMONIC || !INFURA_KEY || !NETWORK || !ETHERSCAN) {
  console.error('Please set a mnemonic, infura key, and network,')
  process.exit(1)
}

const etherscanVerify = async (deployedAddress, constructorParams) => {
  const data = {
    key: ETHERSCAN, // Etherscan API key (required)
    path: contractPath, // Contract file path(required)
    contractAddress: deployedAddress, // Contract address (required)
    network: NETWORK, // Ethereum network used (required)
    contractName: 'Galaxia', // Contract name, only if contract file has more than one contracts
    cvalues: constructorParams, // constructor values in array, only if contract has constructor
    optimizationFlag: false // Set `true` to enable optimization (Default: false)
  }
  await verifier.verifyContract(data)
  return true
}

async function main () {
  try {
    const infuraProvider = new ethers.providers.InfuraProvider(NETWORK, INFURA_KEY)
    const wallet = new ethers.Wallet(MNEMONIC, infuraProvider)
    console.log('owner ', wallet.address)
    const Galaxia = new ethers.ContractFactory(galaxiaBuild.Galaxia.abi, galaxiaBuild.Galaxia.evm.bytecode, wallet)
    const gasLimit = ethers.utils.bigNumberify(5000000)
    const gasPrice = ethers.utils.bigNumberify(2000000000) // 20 gwei
    const tokenName = 'Galaxia'
    const symbol = 'GAX'
    const galaxia = await Galaxia.deploy(tokenName, symbol, { gasLimit: gasLimit, gasPrice: gasPrice })
    console.log('galaxia address ', galaxia.address)
    console.log('deploy transaction ', galaxia.deployTransaction)
    const encoder = ethers.utils.defaultAbiCoder
    const constructorHex = encoder.encode(['string', 'string'], [tokenName, symbol])
    console.log('contructor args ', constructorHex)
    const tx = await galaxia.deployed()
    // const constructorParams = [tokenName, symbol]
    // const verified = await etherscanVerify(galaxia.address, constructorParams)
    // if (!verified) return ('couldnt verify tx check etherscan ', galaxia.address)
    // console.log('transaction complete ', tx)
    return ('contract at ', galaxia.address)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

console.log(main())
