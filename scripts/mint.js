const HDWalletProvider = require('truffle-hdwallet-provider')
const Web3 = require('web3')
var path = require('path')
const root = path.resolve('.')

require('dotenv').config({ path: path.join(root, '/.env') })

// Contract ABI & Bytecode
const NFT_ABI = require(path.join(root, '/src/build/Galaxia.json'))
const assetInfo = require(path.join(root, '/ipfs/assets/deployed-assets.json'))

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
    account = web3Instance.utils.toChecksumAddress(await web3Instance.eth.accounts._provider.addresses[0])
    if (!account) return 'Couldnt initialize owner account'
  } catch (err) {
    console.log(err)
  }
  try {
    if (!NFT_CONTRACT_ADDRESS) {
      console.log('Contract address not set in .env file')
      process.exit(1)
    }
    galaxia = new web3Instance.eth.Contract(NFT_ABI, NFT_CONTRACT_ADDRESS, { gasLimit: '1000000' })
    const galaxiaOwner = await galaxia.methods.owner().call()
    console.log('account, ', account, ' galaxia ownner ', galaxiaOwner)
    if (account !== galaxiaOwner) {
      console.log('Supplied private key doesnt match owner of contract')
      process.exit(1)
    }
    const alreadyMinted = Number(await galaxia.methods.totalSupply().call())
    if (Number(alreadyMinted) >= Number(NUM_PLANETS)) {
      console.log('ALL PLANETS ARE ALREADY MINTED')
      process.exit(1)
    }
    start = alreadyMinted
  } catch (err) {
    console.log(err)
  }
  // Planets issued directly to the owner.
  for (const asset of assetInfo) {
    console.log('about to mint asset')
    try {
      // console.log("asset ", asset);
      if (asset.id < start) {
        console.log('alredy minted ', asset.name)
      } else {
        console.log('minting.', asset.name, ' tokenID: ', asset.id)
        // TODO: add confirmation input
        const gasPrice = '10000000000' // 20 gwei
        const receipt = await galaxia.methods.mint(account, asset.metadata).send({ from: account, gasPrice: gasPrice })
        console.log('Minted planet ', asset.name, ' token id ', asset.id, ' at ', receipt.transactionHash)
      }
    } catch (err) {
      console.log(err)
    }
  }
  return 'Successfully minted all planets'
}

main()
