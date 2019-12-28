const { Err } = require('./utils.js')
const { ethers } = require('ethers')
const { password } = require('./config')

class Deployer {
    constructor(keystore, network, infuraKey) {
        this.keystore = keystore
        this.network = network
        this.infuraKey = infuraKey
        this.provider = null
        this.wallet = null
    }


    getGasPrice = async () => {
        try {
            if (!this.provider) {
                this.provider = await this.connectProvider()
                if (this.provider.err) return Err('Failed to connect to provider')
            }
            const gasPrice = await this.provider.getGasPrice()
            return gasPrice
        } catch (err) {
            return Err('Failed to get current gas price')
        }
    }

    getWallet = () => {
        return this.wallet
    }

    deployerBalance = async () => {
        try {
            return await this.wallet.getBalance()
        } catch (err) {
            return Err('Failed to get account balance')
        }
    }

    determineProvider = (nodeType) => {
        try {
            if (nodeType === 'local') {
                return new ethers.providers.JsonRpcProvider()
            } else if (nodeType === 'infura') {
                return new ethers.providers.InfuraProvider(this.network, this.infuraKey)
            } else return Err('Unexpected network provided ', this.network)
        } catch (err) {
            if (nodeType === 'local') {
                return Err('Unexpected Error: Make sure development chain is running')
            }
            return Err('Unexpected Error: Alert tech support')
        }
    }

    connectProvider = async (nodeType) => {
        const provider = this.determineProvider(nodeType)
        if (provider.err) return Err(provider.err)
        const ready = await provider.ready
        // TODO: check that chainId matches provided network
        if (!ready.chainId) return Err('Failed to connect to node provider')
        return provider
    }

    connectWallet = async (wallet) => {
        try {
            return wallet.connect(this.provider)
        } catch (err) {
            return Err('Failed to attach provider to wallet. Check blockchain node')
        }
    }

    decryptKeystore = async () => {
        try {
            return await ethers.Wallet.fromEncryptedJson(JSON.stringify(this.keystore), password)
        } catch (err) {
            return Err('Failed to decrypt wallet from json keystore file')
        }
    }


    connectDeployer = async (nodeType) => {
        try {
            if (!this.keystore) return Err('No keystore set')
            if (!this.infuraKey) return Err('No infura key provided')
            this.provider = await this.connectProvider(nodeType)
            if (this.provider.err) return Err(this.provider.err)
            const decryptedWallet = await this.decryptKeystore()
            if (decryptedWallet.err) return Err(decryptedWallet.err)
            this.wallet = await this.connectWallet(decryptedWallet)
            if (this.wallet.err) return Err(this.wallet.err)
            const connectCheck = await this.getGasPrice()
            if (connectCheck.err) return Err('Failed to connnect to node. Check internet connection')
            return true
        } catch (err) {
            return Err(err)
        }
    }

    deploy = async (contract) => {
        try {
            if (!contract.abi) return Err('No contract ABI provided')
            if (!contract.bytecode) return Err('No bytecode provided')
            const contractFactory = new ethers.ContractFactory(contract.abi, contract.bytecode, this.wallet)
            return await contractFactory.deploy(...contract.deployArgs)
        } catch (err) {
            return Err(err)
        }
    }

    // Checks multisig input, deploys multisig
    deployContract = async (contract) => {
        try {
            // Create contract factory
            this.contractPromise = await this.deploy(contract)
            if (this.contractPromise.err) return Err(this.contractPromise.err)
            this.address = this.contractPromise.address
            this.txHash = this.contractPromise.deployTransaction.hash
            this.gasLimit = this.contractPromise.deployTransaction.gasLimit.toString()
            this.gasPrice = this.contractPromise.deployTransaction.gasPrice.toString()
            return this.txHash
        } catch (err) {
            return Err(err)
        }
    }
}
module.exports = { Deployer }
