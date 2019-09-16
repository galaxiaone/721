const HDWalletProvider = require('truffle-hdwallet-provider')
const Web3 = require('web3')
const assetInfo = require('../ipfs/assets/deployed-assets.json')
var path = require('path')
console.log(require('dotenv').config())
require('dotenv').config({ path: path.join('/.env') })

// Contract ABI & Bytecode
const NFT_ABI = require('./src/build/Galaxia.json')
const MNEMONIC = process.env.PRIVATE_KEY
const INFURA_KEY = process.env.INFURA
const NFT_CONTRACT_ADDRESS = process.env.CONTRACT
const NETWORK = process.env.NETWORK

const NUM_PLANETS = assetInfo.length

if (!MNEMONIC || !INFURA_KEY || !NETWORK || !NFT_CONTRACT_ADDRESS) {
  console.log('mnemonic, key, network, address, ', MNEMONIC, INFURA_KEY, NETWORK, NFT_CONTRACT_ADDRESS)
  console.error('Please set a mnemonic, infura key, owner, network, and contract address.')
  process.exit(1)
}

async function main () {
  const provider = new HDWalletProvider(MNEMONIC, `https://${NETWORK}.infura.io/v3/${INFURA_KEY}`)
  const web3Instance = new Web3(provider)
  let account
  let galaxia
  let start
  try {
    console.log(await web3Instance.eth.accounts._provider.addresses[0])
    account = await web3Instance.eth.accounts._provider.addresses[0]
    if (!account) return 'Couldnt initialize owner account'
  } catch (err) {
    return err
  }
  try {
    if (!NFT_CONTRACT_ADDRESS) return 'Contract address not set in .env file'
    galaxia = new web3Instance.eth.Contract(NFT_ABI, NFT_CONTRACT_ADDRESS, { gasLimit: '1000000' })
    const alreadyMinted = Number(await galaxia.methods.totalSupply().call())
    if (Number(alreadyMinted) >= Number(NUM_PLANETS)) {
      console.log('ALL PLANETS ARE ALREADY MINTED')
      return false
    }
    start = alreadyMinted
  } catch (err) {
    return err
  }
  // Planets issued directly to the owner.
  for (const asset of assetInfo) {
    try {
      // console.log("asset ", asset);
      if (asset.id < start) {
        console.log('alredy minted ', asset.name)
      } else {
        console.log('minting.', asset.name, ' tokenID: ', asset.id)
        // TODO: add confirmation input
        const receipt = await galaxia.methods.mint(account, asset.metadata).send({ from: account })
        console.log('Minted planet ', asset.name, ' token id ', asset.id, ' at ', receipt.transactionHash)
      }
    } catch (err) {
      return err
    }
  }
}

console.log(main())
