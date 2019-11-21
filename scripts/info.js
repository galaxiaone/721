const HDWalletProvider = require('truffle-hdwallet-provider')
const Web3 = require('web3')
console.log(require('dotenv').config())
require('dotenv').config({ path: __dirname + '/.env' })
const project_root = __dirname.slice(0, __dirname.length - 7)

const NFT_ABI = require(project_root + 'src/build/Galaxia.json')
const URIS = require(project_root + 'ipfs/assets/deployed-assets.json')

const MNEMONIC = process.env.PRIVATE_KEY
const INFURA_KEY = process.env.INFURA
const NFT_CONTRACT_ADDRESS = process.env.CONTRACT
const OWNER_ADDRESS = process.env.OWNER_ADDRESS
const NETWORK = process.env.NETWORK

async function main () {
  if (!MNEMONIC || !INFURA_KEY || !OWNER_ADDRESS || !NETWORK) {
    console.error('Please set a mnemonic, infura key, owner, network, and contract address.')
    return
  }
  const provider = new HDWalletProvider(MNEMONIC, `https://${NETWORK}.infura.io/v3/${INFURA_KEY}`)
  const web3Instance = new Web3(provider)
  if (NFT_CONTRACT_ADDRESS) {
    const nftContract = new web3Instance.eth.Contract(NFT_ABI, NFT_CONTRACT_ADDRESS)
    const totalSupply = await nftContract.methods.totalSupply().call()
    const baseURI = await nftContract.methods.ipfsGateway().call()
    console.log('Total supply ', totalSupply)
    console.log('Base URI ', baseURI)
    const i = 1
    for (let i = 0; i < URIS.length; i++) {
      try {
        console.log('tokenID: ', i)
        const asset = URIS[i]
        const tokenURI = await nftContract.methods.tokenURI(i).call()
        const ipfsHash = await nftContract.methods.idToUri(i).call()
        console.log('Token URI for ', asset.name, ' is ', tokenURI, ' base ', baseURI, ' token ', ipfsHash)
        const ownerOfToken = await nftContract.methods.ownerOf(i).call()
        console.log('Owner of token ', ownerOfToken)
      } catch (err) {
        console.log(err)
      }
    }
  }
}

main()
