const HDWalletProvider = require("truffle-hdwallet-provider")
const web3 = require('web3')
const NFT_ABI = require('../build/contracts/Galaxia.json');
const URIS = require('../assets/deployed-assets.json');
require('dotenv').config({ path: '../.env' });

const MNEMONIC = process.env.MNEMONIC
const INFURA_KEY = process.env.INFURA_KEY
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS
const OWNER_ADDRESS = process.env.OWNER_ADDRESS
const NETWORK = process.env.NETWORK



if (!MNEMONIC || !INFURA_KEY || !OWNER_ADDRESS || !NETWORK) {
    console.error("Please set a mnemonic, infura key, owner, network, and contract address.")
    return
}

async function main() {
    const provider = new HDWalletProvider(MNEMONIC, `https://${NETWORK}.infura.io/v3/${INFURA_KEY}`)
    const web3Instance = new web3(provider)
    if (NFT_CONTRACT_ADDRESS) {
        const nftContract = new web3Instance.eth.Contract(NFT_ABI.abi, NFT_CONTRACT_ADDRESS, { gasLimit: "1000000" })
        const totalSupply = await nftContract.methods.totalSupply().call();
        const baseURI = await nftContract.methods.baseTokenURI().call();
        console.log("Total supply ", totalSupply);
        console.log("Base URI ", baseURI);
        let i = 1;
        for (let i = 0; i < URIS.length; i++){ 
            try {
                console.log("tokenID: ", i);
                const asset = URIS[i];
                const tokenURI = await nftContract.methods.tokenURI(i).call();
                const ipfsHash = await nftContract.methods.ipfsURI(i).call();
                console.log("Token URI for ", asset.name, " is ", tokenURI, " base ", baseURI, " token ", ipfsHash);
                const ownerOfToken = await nftContract.methods.ownerOf(i).call();
                console.log("Owner of token ", ownerOfToken);
            } catch (err) {
                console.log(err);
            }
        }
    }
}


main();