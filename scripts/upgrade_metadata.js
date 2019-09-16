const HDWalletProvider = require("truffle-hdwallet-provider")
const Web3 = require('web3')
const assets = require('../assets/deployed-assets.json');
const NFT_ABI = require('../build/contracts/Galaxia.json');

require('dotenv').config({ path: '../.env' });
const MNEMONIC = process.env.MNEMONIC
const INFURA_KEY = process.env.INFURA_KEY
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS
const OWNER_ADDRESS = process.env.OWNER_ADDRESS
const NETWORK = process.env.NETWORK



const NUM_PLANETS = assets.length;

if (!MNEMONIC || !INFURA_KEY || !OWNER_ADDRESS || !NETWORK) {
    console.error("Please set a mnemonic, infura key, owner, network, and contract address.")
    return
}


async function main() {
    try {
        const provider = new HDWalletProvider(MNEMONIC, `https://${NETWORK}.infura.io/v3/${INFURA_KEY}`)
        const web3 = new Web3(provider)

        if (NFT_CONTRACT_ADDRESS) {
            const nftContract = new web3.eth.Contract(NFT_ABI.abi, NFT_CONTRACT_ADDRESS, { gasLimit: "1000000" });
            for (let i = 0; i < NUM_PLANETS; i++) {
                const nft = assets[i];
                const ipfsHash = await nftContract.methods.ipfsURI(nft.id).call();
                const upgradeHash = web3.utils.soliditySha3(nft.id, nft.metadata);
                const validUpgrade = await nftContract.methods.validURI(upgradeHash).call();

                if (nft.metadata !== ipfsHash && validUpgrade && ipfsHash !== '') {
                    console.log("asset ", nft.name , "old uri ", ipfsHash, " new uri ", nft.metadata);
                    const gasPrice = web3.utils.toWei('20', 'gwei');
                    const gas = await nftContract.methods.upgradeMetadata(nft.id, nft.metadata).estimateGas({ from: OWNER_ADDRESS });
                    const ownerOfToken = await nftContract.methods.ownerOf(nft.id).call();
                    if (ownerOfToken === OWNER_ADDRESS) {
                        const tx = await nftContract.methods.upgradeMetadata(nft.id, nft.metadata)
                            .send({ from: OWNER_ADDRESS, gas: (gas + 21000), gasPrice: gasPrice })
                            .on('confirmation', function (confNumber, receipt) {
                                if (confNumber === 3) {
                                    console.log("nft ", nft.name, " metadata has been upgraded to ", nft.metadata);
                                }
                            })
                            .on('error', function (error) {
                                console.log(error);
                                process.exit(1);
                            })
                    } else {
                        console.log("nft ", nft.name, " has upgrade available but this account isnt owner ");
                    }
                }
                else {
                    console.log("nft ", nft.name, " is already up to date", nft.metadata, ipfsHash, validUpgrade);
                }
            } // close for loop
            process.exit();
        }
        else {
            console.log("Contract wasnt properly initialized ", NFT_CONTRACT_ADDRESS);
            process.exit(1);
        }
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

main()