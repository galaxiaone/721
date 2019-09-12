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
            let alreadyMinted = Number(await nftContract.methods.totalSupply().call());
            for (let i = 0; i < alreadyMinted; i++) {
                const nft = assets[i];
                const ipfsHash = await nftContract.methods.ipfsURI(i).call();
                const upgradeHash = web3.utils.soliditySha3(nft.id, nft.metadata);
                const validUpgrade = await nftContract.methods.validURI(upgradeHash).call();

                // Check that the metadata is different and that an upgrade path doesnt already exist
                if (nft.metadata !== ipfsHash && !validUpgrade) {
                    console.log("asset ", nft.name , "old uri ", ipfsHash, " new uri ", nft.metadata);
                    const gasPrice = web3.utils.toWei('20', 'gwei');
                    const gas = await nftContract.methods.addUpgradePath(nft.id, nft.metadata).estimateGas({ from: OWNER_ADDRESS });
                    const tx = await nftContract.methods.addUpgradePath(nft.id, nft.metadata)
                        .send({ from: OWNER_ADDRESS, gas: (gas + 21000), gasPrice: gasPrice })
                        // .once('transactionHash', function (hash) {
                        //     console.log("tx hash ", hash);
                        // })
                        // .once('receipt', function (receipt) {
                        //     // console.log("receipt ", receipt);
                        // })
                        .on('confirmation', function (confNumber, receipt) {
                            if (confNumber === 3) {
                                console.log("nft ", nft.name, " metadata can be upgraded by owner to ", nft.metadata);
                                return receipt;
                            }
                        })
                        .on('error', function (error) {
                            console.log(error);
                            process.exit(1);
                        })
                    //     .then(function (receipt) {
                    //         // will be fired once the receipt is mined
                    //         console.log("receipt mined ", receipt);
                    //         return receipt;
                    //     });
                    // if (tx) {
                    //     return;
                    // }
                } else {
                    console.log("nft ", nft.name, " is already up to date");
                }
            }
            process.exit();
        }
    } catch (err) {
        console.log(err);
        process.exit(1);
    }

}

main()