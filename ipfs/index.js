require('dotenv').config()
const fs = require('fs')
const IPFS = require('ipfs')
// TODO: Organize deployments better than this
const IMAGES_DIR = './assets/images/v1/'
const METADATA_DIR = './assets/metadata/v1/'
const util = require('util')

const main = async () => {
  // Initiate IPFS
  const ipfs = new IPFS()
  // All asset data, used to output json file of ipfs hashes + asset names
  const assetData = []

  const readDir = util.promisify(fs.readdir)
  const readFile = util.promisify(fs.readFile)

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

  // Reads image and metadata directories, pulls data buffers for each and adds each file buffer to ipfs
  ipfs.once('ready', async () => {
    try {
      console.log('IPFS node is ready ')
      // TODO: For loop folders v1, v2
      // TODO: check total supply + initial id
      const gifFiles = await getFileDir(IMAGES_DIR)
      const metadataFiles = await getFileDir(METADATA_DIR)
      checkParity(gifFiles, metadataFiles)
      // loop through planets
      for (let i = 0; i < gifFiles.length; i++) {
        const GIF = gifFiles[i]
        const Metadata = metadataFiles[i]
        const assetName = GIF.slice(0, GIF.length - 4)
        const nameCheck = Metadata.slice(0, Metadata.length - 5)
        if (assetName !== nameCheck) {
          console.log('asset image/metadata mismatch. Check asset folder')
          console.log('image ', assetName, ' metadata: ', nameCheck)
          process.exit(1)
        }
        const data = { id: '', imageHash: '', metadata: '' }
        const gifLocation = `${IMAGES_DIR}/${GIF}`
        const metadataLocation = `${METADATA_DIR}${Metadata}`
        data.id = i
        data.name = assetName

        // upload gif image
        const gifData = await getFileData(gifLocation)
        const imageBuffer = Buffer.from(gifData)
        const ipfsGif = await ipfs.add(imageBuffer, { pin: true })
        data.imageHash = ipfsGif[0].hash

        // Upload metadata
        const metadataData = await getFileData(metadataLocation)
        const metadataBuffer = Buffer.from(metadataData)
        const ipfsMetadata = await ipfs.add(metadataBuffer, { pin: true })
        data.metadata = ipfsMetadata[0].hash
        // Save data and go to next asset
        console.log(data.name, 'image hash: ', data.imageHash, ' metadata hash: ', data.metadata)
        assetData.push(data)
      } // close for loop

      // console.log(assetData);

      // NOTE: uncomment to update metadata/imagehash file
      // const outputFile = './assets/deployed-assets.json'
      // const jsonData = JSON.stringify(assetData)
      // fs.writeFile(outputFile, jsonData, function (err) {
      //   if (err) {
      //     console.log(err)
      //     process.exit(1)
      //   }
      //   console.log('The file was saved!')
      // })
      process.exit()
    } catch (err) {
      console.log(err)
      process.exit(1)
    }
  })
}

main()
