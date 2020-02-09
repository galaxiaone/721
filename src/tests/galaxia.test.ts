import { Spec } from '@specron/spec'

/**
 * Spec context interfaces.
 */

interface Data {
  nfToken?: any
  galaxia?: any
  proxy?: any
  owner?: string
  bob?: string
  jane?: string
  sara?: string
  zeroAddress?: string
  id1?: string
  id2?: string
  id3?: string
  uri1?: string
  uri2?: string
  uri3?: string
}

/**
 * Spec stack instances.
 */

const spec = new Spec<Data>()

export default spec

spec.beforeEach(async (ctx) => {
  const accounts = await ctx.web3.eth.getAccounts()
  ctx.set('owner', accounts[0])
  ctx.set('bob', accounts[1])
  ctx.set('jane', accounts[2])
  ctx.set('sara', accounts[3])
  ctx.set('zeroAddress', '0x0000000000000000000000000000000000000000')
})

spec.beforeEach(async (ctx) => {
  ctx.set('id1', '0')
  ctx.set('id2', '1')
  ctx.set('uri1', 'QmYoPR3Uzj8tEFmbUuekzKG5swfEtqBTCyKT6Bs47i1NVp')
  ctx.set('uri2', 'QmVo27EQ3kKrSfvfd1LbqznfsJV6h3ftE4apxPhwMLWpm1')
  ctx.set('uri3', 'QmajMmUB3rtsb51nCuoaBu5uxpQA8MeaoE6bhnT5tn7MBT')
})

spec.beforeEach(async (ctx) => {
  const accounts = await ctx.web3.eth.getAccounts()
  const nfToken = await ctx.deploy({ 
    src: './build/Galaxia.json',
    contract: 'Galaxia'
  })
  const proxy = await ctx.deploy({
    src: './build/Proxy.json',
    contract: 'Proxy',
    args: [nfToken.instance._address]
  })
  const galaxia = new ctx.web3.eth.Contract(nfToken.instance._jsonInterface, proxy.instance._address)
  const init = await galaxia.methods.initialize('Galaxia', 'GAX').send({ from: accounts[0] })
  console.log(galaxia)
  ctx.set('nfToken', nfToken)
  ctx.set('galaxia', galaxia)
  ctx.set('proxy', proxy)
})

spec.test('correctly mints a NFT', async (ctx) => {
  const nftoken = ctx.get('nfToken')
  const galaxia = ctx.get('galaxia')
  const proxy = ctx.get('proxy')
  const owner = ctx.get('owner')
  // console.log(proxy.instance._address)
  // console.log(galaxia)
  // console.log(await proxy.instance.methods.implementation().call())
  // console.log(await proxy.instance.methods.resolver().call())
  const bob = ctx.get('bob')
  const uri1 = ctx.get('uri1')
  const totalSupply = await nftoken.instance.methods.totalSupply().call()
  ctx.is(totalSupply.toString(), '0')
  console.log(proxy)
  const gaxOwner = await galaxia.methods.owner().call()
  console.log(gaxOwner, owner)
  const logs = await galaxia.methods.mint(bob, uri1).send({ from: owner })
  ctx.not(logs.events.Transfer, undefined)
  const count: number = await galaxia.methods.balanceOf(bob).call()
  ctx.is(count.toString(), '1')
})

// spec.test('non-owner fails to add upgrade path', async (ctx) => {
//   const galaxia = ctx.get('galaxia')
//   const owner = ctx.get('owner')
//   const bob = ctx.get('bob')
//   const id1 = ctx.get('id1')
//   const uri1 = ctx.get('uri1')
//   const uri2 = ctx.get('uri2')
//   await galaxia.methods.mint(bob, uri1).send({ from: owner })
//   await ctx.reverts(() => galaxia.methods.addUpgradePath(id1, uri2, '2').send({from: bob}))
// })

// spec.test('add upgrade path', async (ctx) => {
//   const nftoken = ctx.get('nfToken')
//   const galaxia = ctx.get('galaxia')
//   const owner = ctx.get('owner')
//   const bob = ctx.get('bob')
//   const id1 = ctx.get('id1')
//   const uri1 = ctx.get('uri1')
//   const uri2 = ctx.get('uri2')
  
//   await galaxia.methods.mint(bob, uri1).send({ from: owner })
//   const tokenURI: string = await nftoken.methods.idToUri(id1).call()
//   ctx.is(tokenURI, uri1)
//   const logs = await galaxia.methods.addUpgradePath(id1, uri2, '2').send({from: owner})
//   ctx.not(logs.events.UpgradePathAdded, undefined)
//   // shouldnt change
//   const uriNoChange: string = await nftoken.methods.idToUri(id1).call()
//   ctx.is(uriNoChange, uri1)

// })

// spec.test('non-token holder fails to upgrade metadata', async (ctx) => {
//   const galaxia = ctx.get('galaxia')
//   const owner = ctx.get('owner')
//   const bob = ctx.get('bob')
//   const id1 = ctx.get('id1')
//   const uri1 = ctx.get('uri1')
//   const uri2 = ctx.get('uri2')

//   await galaxia.methods.mint(bob, uri1).send({ from: owner })
//   await galaxia.methods.addUpgradePath(id1, uri2, '2').send({from: owner})
//   await ctx.reverts(() => galaxia.methods.upgradeMetadata(id1, uri2).send({ from: owner }))
// })


// spec.test('token holder upgrades metadata', async (ctx) => {
//   const nftoken = ctx.get('nfToken')
//   const galaxia = ctx.get('galaxia')
//   const owner = ctx.get('owner')
//   const bob = ctx.get('bob')
//   const id1 = ctx.get('id1')
//   const uri1 = ctx.get('uri1')
//   const uri2 = ctx.get('uri2')
  
//   await galaxia.methods.mint(bob, uri1).send({ from: owner })
//   await galaxia.methods.addUpgradePath(id1, uri2, '2').send({from: owner})
//   const logs = await galaxia.methods.upgradeMetadata(id1, uri2).send({ from: bob })
//   ctx.not(logs.events.MetadataUpgraded, undefined)
//   const tokenURI: string = await nftoken.methods.idToUri(id1).call()
//   ctx.is(tokenURI, uri2)
// })

// spec.test('non owner fails to change gateway', async (ctx) => {
//   const nftoken = ctx.get('nfToken')
//   const galaxia = ctx.get('galaxia')
//   const bob = ctx.get('bob')
  
//   const gateway2 = 'https://ipfs.io/ipfs/'
//   await ctx.reverts(() => galaxia.methods.changeGateway(gateway2).send({from: bob}))
// })

// spec.test('change gateway', async (ctx) => {
//   const nftoken = ctx.get('nfToken')
//   const galaxia = ctx.get('galaxia')
//   const owner = ctx.get('owner')
  
//   const gateway1 = await nftoken.methods.ipfsGateway().call()
//   const gateway2 = 'https://ipfs.io/ipfs/'
//   const logs = await galaxia.methods.changeGateway(gateway2).send({from: owner})
//   ctx.not(logs.events.GatewayChanged, undefined)
//   const gatewayCheck = await nftoken.methods.ipfsGateway().call()
//   ctx.is(gatewayCheck, gateway2)
//   // Change gateway back
//   await galaxia.methods.changeGateway(gateway1).send({from: owner})
//   ctx.is(gateway1, await nftoken.methods.ipfsGateway().call())
// })

// spec.test('try to change gateway to empty string', async (ctx) => {
//   const galaxia = ctx.get('galaxia')
//   const owner = ctx.get('owner')
  
//   await ctx.reverts(() => galaxia.methods.changeGateway("").send({from: owner}))
// })