import { Spec } from '@specron/spec';

/**
 * Spec context interfaces.
 */

interface Data {
  nfToken?: any;
  owner?: string;
  bob?: string;
  jane?: string;
  sara?: string;
  openSea?: string;
  zeroAddress?: string;
  id1?: string;
  id2?: string;
  id3?: string;
  uri1?: string;
  uri2?: string;
  uri3?: string;
}

/**
 * Spec stack instances.
 */

const spec = new Spec<Data>();

export default spec;

spec.beforeEach(async (ctx) => {
  const accounts = await ctx.web3.eth.getAccounts();
  ctx.set('owner', accounts[0]);
  ctx.set('bob', accounts[1]);
  ctx.set('jane', accounts[2]);
  ctx.set('sara', accounts[3]);
  ctx.set('openSea', "0xf57b2c51ded3a29e6891aba85459d600256cf317");
  ctx.set('zeroAddress', '0x0000000000000000000000000000000000000000');
});

spec.beforeEach(async (ctx) => {
  ctx.set('id1', '0');
  ctx.set('id2', '1');
  ctx.set('uri1', 'QmYoPR3Uzj8tEFmbUuekzKG5swfEtqBTCyKT6Bs47i1NVp');
  ctx.set('uri2', 'QmVo27EQ3kKrSfvfd1LbqznfsJV6h3ftE4apxPhwMLWpm1');
  ctx.set('uri3', 'QmajMmUB3rtsb51nCuoaBu5uxpQA8MeaoE6bhnT5tn7MBT');
});

spec.beforeEach(async (ctx) => {
  const nfToken = await ctx.deploy({ 
    src: './build/Galaxia.json',
    contract: 'Galaxia',
    args: ['Galaxia','GAX', '0xf57b2c51ded3a29e6891aba85459d600256cf317']
  });
  ctx.set('nfToken', nfToken);
});

spec.test('correctly mints a NFT', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const uri1 = ctx.get('uri1');

  const logs = await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  ctx.not(logs.events.Transfer, undefined);
  const count: number = await nftoken.instance.methods.balanceOf(bob).call();
  ctx.is(count.toString(), '1');
});

spec.test('non-owner fails to add upgrade path', async (ctx) => {
  const nftoken = ctx.get('nfToken')
  const owner = ctx.get('owner')
  const bob = ctx.get('bob')
  const id1 = ctx.get('id1')
  const uri1 = ctx.get('uri1')
  const uri2 = ctx.get('uri2')
  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  await ctx.reverts(() => nftoken.instance.methods.addUpgradePath(id1, uri2, '2').send({from: bob}))
})

spec.test('add upgrade path', async (ctx) => {
  const nftoken = ctx.get('nfToken')
  const owner = ctx.get('owner')
  const bob = ctx.get('bob')
  const id1 = ctx.get('id1')
  const uri1 = ctx.get('uri1')
  const uri2 = ctx.get('uri2')
  
  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner })
  const tokenURI: string = await nftoken.instance.methods.idToUri(id1).call()
  ctx.is(tokenURI, uri1)
  const logs = await nftoken.instance.methods.addUpgradePath(id1, uri2, '2').send({from: owner})
  console.log('logs ', logs)
  ctx.not(logs.events.UpgradePathAdded, undefined)
  // shouldnt change
  const uriNoChange: string = await nftoken.instance.methods.idToUri(id1).call()
  ctx.is(uriNoChange, uri1)

})

spec.test('non-token holder fails to upgrade metadata', async (ctx) => {
  const nftoken = ctx.get('nfToken')
  const owner = ctx.get('owner')
  const bob = ctx.get('bob')
  const id1 = ctx.get('id1')
  const uri1 = ctx.get('uri1')
  const uri2 = ctx.get('uri2')

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner })
  await nftoken.instance.methods.addUpgradePath(id1, uri2, '2').send({from: owner})
  await ctx.reverts(() => nftoken.instance.methods.upgradeMetadata(id1, uri2).send({ from: owner }))
})


spec.test('token holder upgrades metadata', async (ctx) => {
  const nftoken = ctx.get('nfToken')
  const owner = ctx.get('owner')
  const bob = ctx.get('bob')
  const id1 = ctx.get('id1')
  const uri1 = ctx.get('uri1')
  const uri2 = ctx.get('uri2')
  
  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner })
  await nftoken.instance.methods.addUpgradePath(id1, uri2, '2').send({from: owner})
  const logs = await nftoken.instance.methods.upgradeMetadata(id1, uri2).send({ from: bob })
  ctx.not(logs.events.MetadataUpgraded, undefined)
  const tokenURI: string = await nftoken.instance.methods.idToUri(id1).call()
  ctx.is(tokenURI, uri2)
})

spec.test('non owner fails to change gateway', async (ctx) => {
  const nftoken = ctx.get('nfToken')
  const bob = ctx.get('bob')
  
  const gateway2 = 'https://ipfs.io/ipfs/'
  await ctx.reverts(() => nftoken.instance.methods.changeGateway(gateway2).send({from: bob}))
})

spec.test('change gateway', async (ctx) => {
  const nftoken = ctx.get('nfToken')
  const owner = ctx.get('owner')
  
  const gateway1 = await nftoken.instance.methods.ipfsGateway().call()
  const gateway2 = 'https://ipfs.io/ipfs/'
  const logs = await nftoken.instance.methods.changeGateway(gateway2).send({from: owner})
  ctx.not(logs.events.GatewayChanged, undefined)
  const gatewayCheck = await nftoken.instance.methods.ipfsGateway().call()
  ctx.is(gatewayCheck, gateway2)
  // Change gateway back
  await nftoken.instance.methods.changeGateway(gateway1).send({from: owner})
  ctx.is(gateway1, await nftoken.instance.methods.ipfsGateway().call())
})

spec.test('try to change gateway to empty string', async (ctx) => {
  const nftoken = ctx.get('nfToken')
  const owner = ctx.get('owner')
  
  await ctx.reverts(() => nftoken.instance.methods.changeGateway("").send({from: owner}))
})