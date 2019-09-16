const wget = require('node-wget')
const util = require('util')
const ethers = require('ethers')
const fs = require('fs')
require('dotenv')

const GALAXIA_ABI = require('../src/build/Galaxia.json')

// Asset data
const IMAGES_DIR = './ipfs/assets/images/v1/'
const METADATA_DIR = './ipfs/assets/metadata/v1/'
const IPFS_HASHES = require('../ipfs/assets/deployed-assets.json')

// Environment variables
// const INFURA_KEY = process.env.INFURA_KEY
// const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS
// const OWNER_ADDRESS = process.env.OWNER_ADDRESS
// const NETWORK = process.env.NETWORK
// const MNEMONIC = process.env.MNEMONIC

const gatewayBenchmark = [
  {
    name: 'cloudflare',
    url: 'https://cloudflare-ipfs.com/ipfs/',
    live: false,
    speed: 0
  },
  {
    name: 'ipfs',
    url: 'https://ipfs.io/ipfs/',
    live: false,
    speed: 0
  },
  {
    name: 'galaxia',
    url: 'http://159.89.98.184:8080/ipfs/',
    live: false,
    speed: 0
  }
]
const GATEWAYS = ['cloudflare', 'ipfs', 'galaxia']

const assetData = []

const deadAssets = [
  // {
  //     id: 0
  //     gateway: {}
  // }
]

const readDir = util.promisify(fs.readdir)
const readFile = util.promisify(fs.readFile)
const getAsset = util.promisify(wget)

async function getFileData (data) {
  return await readFile(data)
}

async function getFileDir (dir) {
  return await readDir(dir)
}

function checkParity (imageFiles, metadataFiles) {
  if (metadataFiles.length !== imageFiles.length) {
    console.log('Number of metadata files dont match number of image files!')
    process.exit(1)
  }
}

function getRandomInt (max) {
  return Math.floor(Math.random() * Math.floor(max))
}

async function main () {
  try {
    const gifFiles = await getFileDir(IMAGES_DIR)
    const metadataFiles = await getFileDir(METADATA_DIR)
    checkParity(gifFiles, metadataFiles)
    for (let i = 0; i < gifFiles.length; i++) {
      const data = { id: '', imageHash: '', metadata: '', name: '' }
      let gifLocation
      let metadataLocation
      let ipfsHash
      for (const gateway of gatewayBenchmark) {
        try {
        //   const max = gifFiles.length - 1
        //   const k = getRandomInt(max)
        //   const rand = max % k
          const rand = i
          //   console.log('random number ', rand)
          const GIF = gifFiles[rand]
          const Metadata = metadataFiles[rand]
          ipfsHash = IPFS_HASHES[rand]
          const assetName = GIF.slice(0, GIF.length - 4)
          const nameCheck = Metadata.slice(0, Metadata.length - 5)
          if (assetName !== nameCheck) {
            console.log('asset image/metadata mismatch. Check that files are named correctly in asset folder')
            console.log('image ', assetName, ' metadata: ', nameCheck)
            process.exit(1)
          }
          gifLocation = `${IMAGES_DIR}${GIF}`
          metadataLocation = `${METADATA_DIR}${Metadata}`
          data.id = rand
          data.name = assetName

          // upload gif image
          const gif_data = await getFileData(gifLocation)
          const meta_data = await getFileData(metadataLocation)

          const response = await getAsset({
            url: `${gateway.url}${ipfsHash.imageHash}`,
            dest: '/tmp/', // destination path or path with filenname, default is ./
            timeout: 2000 // duration to wait for request fulfillment in milliseconds, default is 2 seconds
          })
          const responseMeta = await getAsset({
            url: `${gateway.url}${ipfsHash.metadata}`,
            dest: '/tmp/', // destination path or path with filenname, default is ./
            timeout: 2000 // duration to wait for request fulfillment in milliseconds, default is 2 seconds
          })
          if (!response) {
            deadAssets.push({ gateway: gateway, id: data.id, name: data.name, file: gifLocation, hash: ipfsHash.imageHash })
            gateway.live = false
            console.log('WARNING: ', gateway.name, ' is not serving file ', gifLocation)
          } else {
            gateway.live = true
            console.log(gateway.name, ' returned asset data properly ', data.name)
          }
          if (!responseMeta) {
            deadAssets.push({ gateway: gateway, id: data.id, name: data.name, file: metadataLocation, hash: ipfsHash.metadata })
            gateway.live = false
            console.log('WARNING: ', gateway.name, ' is not serving file ', metadataLocation)
          } else {
            gateway.live = true
            console.log(gateway.name, ' returned asset data properly ', data.name)
          }
        } catch (err) {
          console.log(err)
          deadAssets.push({ gateway: gateway, id: data.id, name: data.name, file: gifLocation, hash: ipfsHash.imageHash })
        }
      }
    }
    console.log('dead assets ', deadAssets)
  } catch (err) {
    console.log(err)
  }
}

main()
