const wget = require('node-wget')
const util = require('util')
// const ethers = require('ethers')
const fs = require('fs')
var path = require('path')
// console.log(require('dotenv').config())
const root = path.resolve('.')
// require('dotenv')

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
    report: []
  },
  {
    name: 'ipfs',
    url: 'https://ipfs.io/ipfs/',
    report: []
  },
  {
    name: 'galaxia',
    url: 'http://159.89.98.184:8080/ipfs/',
    report: []
  },
  {
    name: 'backup',
    url: 'http://165.22.225.147:8080/ipfs/',
    report: []
  }
]

const deadAssets = []

const readDir = util.promisify(fs.readdir)
const readFile = util.promisify(fs.readFile)
const getAsset = util.promisify(wget)
const wait = util.promisify(setTimeout)

function checkDirectoryMatch (imageFiles, metadataFiles) {
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
    const gifFiles = await readDir(IMAGES_DIR)
    const metadataFiles = await readDir(METADATA_DIR)
    checkDirectoryMatch(gifFiles, metadataFiles)
    for (let i = 0; i < 3; i++) {
      await wait(500)
      const data = { id: '', imageHash: '', metadata: '', name: '' }
      let gifLocation
      let metadataLocation
      let ipfsHash
      let iter = 0
      const rand = getRandomInt(gifFiles.length)
      for (const gateway of gatewayBenchmark) {
        console.log('checking asset for gateway ', gateway.name)
        try {
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

          // // TODO: check data hashes
          // const gif_data = await readFile(gifLocation)
          // const meta_data = await readFile(metadataLocation)

          const imageRequest = {
            live: true,
            time: 0,
            asset: data.name,
            type: 'image'
          }
          const responseStart = Date.now()
          try {
            await getAsset({
              url: `${gateway.url}${ipfsHash.imageHash}`,
              dest: '/tmp/', // destination path or path with filenname, default is ./
              timeout: 4000 // duration to wait for request fulfillment in milliseconds, default is 2 seconds
            })
          } catch (err) {
            imageRequest.live = false
            deadAssets.push({ gateway: gateway.name, id: data.id, name: data.name, file: gifLocation, hash: ipfsHash.imageHash })
          } finally {
            imageRequest.time = Date.now() - responseStart
            gatewayBenchmark[iter].report.push(imageRequest)
          }

          const metadataRequest = {
            live: true,
            time: 0,
            asset: data.name,
            type: 'metadata'
          }
          const metadataTime = Date.now()
          try {
            await getAsset({
              url: `${gateway.url}${ipfsHash.imageHash}`,
              dest: '/tmp/', // destination path or path with filenname, default is ./
              timeout: 4000 // duration to wait for request fulfillment in milliseconds, default is 2 seconds
            })
          } catch (err) {
            metadataRequest.live = false
            deadAssets.push({ gateway: gateway.name, id: data.id, name: data.name, file: gifLocation, hash: ipfsHash.imageHash })
          } finally {
            metadataRequest.time = Date.now() - metadataTime
            gatewayBenchmark[iter].report.push(metadataRequest)
          }
          iter++
        } catch (err) {
          console.log(err)
        }
      }
    }
    console.log('dead assets ', deadAssets)
    const gatewaysJson = JSON.stringify(gatewayBenchmark, null, 4)
    console.log('gateways ', gatewaysJson)
    for (const gateway of gatewayBenchmark) {
      let totalTime = 0
      if (!gateway.report) break
      for (const r of gateway.report) {
        totalTime += r.time
      }
      console.log(gateway.name, ' avg time ', (totalTime / gateway.report.length))
    }
    const outputFile = path.join(root, '/output/gateways.json')
    fs.writeFile(outputFile, gatewaysJson, function (err) {
      if (err) {
        console.log(err)
        process.exit(1)
      }
      console.log('The file was saved!')
    })

    // TODO: compare speeds across gateways and notify owners of failed gateways
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

main()
