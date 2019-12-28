const config = require('./config.js')
const { readJson, Err } = require('./utils')
const { Contract } = require('./Contract')
const { Deployer } = require('./Deployer')
const { abi, evm } = require('../build/contracts/Galaxia.json')
const { Proxy } = require('../build/contracts/Proxy.json')
const { Wallet } = require('ethers')
const pkey = '0x360792d39a9a8d6772a6ea62a6aef400c278ddeb2b50c05acc90ef92fcdc3e5e'


const getKeystore = async () => {
  if (config.network === 'ropsten') { 
    return readJson('./keystores/ropsten1.json')
  }
  if (config.network === 'development') return privateKeyToKeystore(pkey, 'insecure')
}

const privateKeyToKeystore = (privKey, pass) => {
  const wallet = new Wallet(privKey)
  const keystore = wallet.encrypt(pass)
  return keystore
}

const getDeployer = async () => {
  try {
    const keystoreJson = await getKeystore()
    if (keystoreJson.err) throw keystoreJson.err
    const deployer = new Deployer(keystoreJson, config.network, config.infuraKey)
    console.log(deployer.provider)
    const connect = await deployer.connectDeployer(config.node)
    if (connect.err) throw connect.err
    return deployer
  } catch (err) {
    return Err(err)
  }
}

const deployWithProxy = async () => {
  try {
    const deployer = await getDeployer()
    const galaxia = new Contract(abi, evm.bytecode, deployer.provider, '', [], config.initArgs)
    const txHash = await deployer.deployContract(galaxia)
    console.log('waiting for tx... ', txHash)
    const tx = await deployer.provider.waitForTransaction(txHash)
    galaxia.connectContract(tx.contractAddress)
    const proxy = new Contract(Proxy.abi, Proxy.evm.bytecode, deployer.provider, '', [galaxia.address])
    const proxyHash = await deployer.deployContract(proxy)
    console.log('waiting for proxy tx... ', proxyHash)
    const txProxy = await deployer.provider.waitForTransaction(proxyHash)
    console.log('proxy address ', txProxy.contractAddress)
    const gax = new Contract(abi, evm.bytecode, deployer.provider, txProxy.contractAddress)
    gax.connectContract()
    return gax
  } catch (err) {
    return Err(err)
  }
}

const initiateProxy = async (address) => {
  const deployer = await getDeployer()
  console.log(deployer.wallet.address)
  const gax = new Contract(abi, evm.bytecode, deployer.provider, address)
  gax.connectContract()
  gax.connectWallet(deployer.wallet)
  return gax
}

const main = async () => {
  const galaxia = await deployWithProxy()
  // const galaxia = await initiateProxy("0x2d37F0BF8Add33a9098541a971a8c49b5bdf8df9")
  if (galaxia.err) throw galaxia.err
  const init = await galaxia.contract.initialize(config.initArgs)
  // console.log(await galaxia.contract.mint("0xBB10762310d60180d29b72Da7Ff16d2B37c8aEEE", "fakeurl"))
}

main()
