const util = require('util')
const ethers = require('ethers')
const fs = require('fs')
console.log(require('dotenv').config())
require('dotenv').config({ path: __dirname + '/.env' })
const projectRoot = __dirname.slice(0, __dirname.length - 7)

// Contract ABI & Bytecode
const GALAXIA_ABI_LOCATION = require(projectRoot + 'src/build/Galaxia.json')
const GALAXIA_BYTECODE_LOCATION = projectRoot + 'src/build/Galaxia.bin'

// Environment variables
const INFURA_KEY = process.env.INFURA
const NETWORK = process.env.NETWORK
const MNEMONIC = process.env.KEY
const GATEWAY = process.env.GATEWAY

const readFile = util.promisify(fs.readFile)

if (!MNEMONIC || !INFURA_KEY || !NETWORK) {
  console.error('Please set a mnemonic, infura key, and network,')
  process.exit(1)
}

async function main () {
  try {
    const infuraProvider = new ethers.providers.InfuraProvider(NETWORK, INFURA_KEY)
    const wallet = new ethers.Wallet(MNEMONIC, infuraProvider)
    console.log('owner ', wallet.address)
    const bytecode = await readFile(GALAXIA_BYTECODE_LOCATION, 'hex')
    const contractFactory = new ethers.ContractFactory(GALAXIA_ABI_LOCATION, bytecode)
    const contractSigned = contractFactory.connect(wallet)
    const gasLimit = ethers.utils.bigNumberify(5000000)
    const proxyAddress = ethers.utils.getAddress()
    const galaxia = await contractSigned.deploy('Galaxia', 'GAX', proxyAddress, { gasLimit: gasLimit })
    console.log('galaxia address ', galaxia.address)
    console.log('tx hash ', galaxia.deployTransaction.hash)
    const tx = await galaxia.deployed()
    console.log('transaction complete ', tx)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

main()
