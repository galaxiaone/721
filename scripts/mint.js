const HDWalletProvider = require("truffle-hdwallet-provider")
const web3 = require('web3')
const NFT_ABI = require('../build/contracts/Galaxia.json');
const asset_info = require('../assets/deployed-assets.json');
const fs = require('fs');

require('dotenv').config({ path: '../.env' });
const MNEMONIC = process.env.MNEMONIC
const INFURA_KEY = process.env.INFURA_KEY
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS
const OWNER_ADDRESS = process.env.OWNER_ADDRESS
const NETWORK = process.env.NETWORK



const NUM_PLANETS = asset_info.length;

if (!MNEMONIC || !INFURA_KEY || !OWNER_ADDRESS || !NETWORK) {
  console.error("Please set a mnemonic, infura key, owner, network, and contract address.")
  return
}

async function main() {
  try {
    const provider = new HDWalletProvider(MNEMONIC, `https://${NETWORK}.infura.io/v3/${INFURA_KEY}`)
    const web3Instance = new web3(provider)
    if (NFT_CONTRACT_ADDRESS) {
      const nftContract = new web3Instance.eth.Contract(NFT_ABI.abi, NFT_CONTRACT_ADDRESS, { gasLimit: "1000000" });
      let alreadyMinted = Number(await nftContract.methods.totalSupply().call());
      console.log("Already minted ", alreadyMinted);
      console.log("Number to mint ", NUM_PLANETS);
      if (Number(alreadyMinted) >= Number(NUM_PLANETS)) {
        console.log("ALL PLANETS ARE ALREADY MINTED");
        return false;
      }
      const start = alreadyMinted;
      // Planets issued directly to the owner.
      console.log("start ", start);
      asset_info.forEach(async asset => {
        // console.log("asset ", asset); 
        if (asset.id < start) {
          console.log("alredy minted ", asset.name);
        } else {
          console.log("minting ", asset.name);
          const receipt = await nftContract.methods.mintTo(asset.metadata, OWNER_ADDRESS).send({ from: OWNER_ADDRESS });
          console.log("Minted planet ", asset.name, " token id ", asset.id, " at ", receipt.transactionHash);
        }
      })
    }
  } catch (err) {
    console.log(err);
    return;
  }

}

main()