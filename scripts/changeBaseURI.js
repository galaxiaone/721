const HDWalletProvider = require("truffle-hdwallet-provider")
const Web3 = require('web3')
const NFT_ABI = require('../build/contracts/Galaxia.json');

require('dotenv').config({ path: '../.env' });
const MNEMONIC = process.env.MNEMONIC
const INFURA_KEY = process.env.INFURA_KEY
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS
const OWNER_ADDRESS = process.env.OWNER_ADDRESS
const NETWORK = process.env.NETWORK

const NEW_BASE = "http://165.22.77.204:8080/ipfs/";
const GAS_PRICE = '20';

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
            const currentBase = await nftContract.methods.baseTokenURI().call();
            const galaxiaOwner = await nftContract.methods.owner().call();
            const gasPrice = web3.utils.toWei(GAS_PRICE, 'gwei');
            const gas = await nftContract.methods.changeBaseURI(NEW_BASE).estimateGas({ from: OWNER_ADDRESS });
            if (currentBase !== NEW_BASE && galaxiaOwner === OWNER_ADDRESS) {
                console.log("changing base uri to ", NEW_BASE); 
                const tx = await nftContract.methods.changeBaseURI(NEW_BASE)
                    .send({ from: OWNER_ADDRESS, gas: (gas + 21000), gasPrice: gasPrice })
                    .on('confirmation', function (confNumber, receipt) {
                        if (confNumber === 3) {
                            console.log("nft ", nft.name, " metadata has been upgraded to ", nft.metadata);
                            process.stdin.resume();
                        }
                    })
                    .on('error', function (error) {
                        console.log(error);
                        process.exit(1);
                    })
            } else {
                console.log("base uri is the same or active account isnt owner");
                console.log("old base uri ", currentBase, " new base uri ", NEW_BASE);
                console.log("galaxia owner ", galaxiaOwner, " active account ", OWNER_ADDRESS); 
                process.exit(1); 
            }

        } else {
            console.log("invalid contract address ", NFT_CONTRACT_ADDRESS); 
            process.exit(1); 
        }

    } catch(err){
        console.log(err);
        process.exit(1); 
    }
}

main();