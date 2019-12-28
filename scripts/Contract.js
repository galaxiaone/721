const ethers = require('ethers')
const { Err } = require('./utils.js')

class Contract {
  constructor (abi, bytecode, provider = null, address = '', deployArgs = [], initArgs) {
    this.address = address
    this.provider = provider
    this.abi = abi
    this.bytecode = bytecode
    this.contract = null
    this.deployArgs = deployArgs
    this.initArgs = initArgs
  }

  connectWallet (wallet) {
    try {
      this.contract = this.contract.connect(wallet)
      return true
    } catch (err) {
      console.log(err)
      return Err(err)
    }
  }

  connectContract (address = '', provider = '') {
    this.provider = provider ? provider : this.provider
    this.address = address ? address : this.address
    if (!this.address || !this.abi || !this.provider) return Err('address, abi, or provider not set')
    try {
      this.contract = new ethers.Contract(this.address, this.abi, this.provider)
      return this.contract
    } catch (err) {
      console.log(err)
      return Err(err)
    }
  }

  isConnected () {
    return (this.contract !== null)
  }

  getContract () {
    if (!this.isConnected()) return Err('No contract initialized')
    return this.contract
  }

  async getEthBalance () {
    try {
      const balance = await this.provider.getBalance(this.contract.address)
      return balance
    } catch (err) {
      return Err('Failed to get balance from provider')
    }
  }
}

module.exports = { Contract }
