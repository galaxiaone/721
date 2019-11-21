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
  ctx.set('zeroAddress', '0x0000000000000000000000000000000000000000');
});

spec.beforeEach(async (ctx) => {
  ctx.set('id1', '0');
  ctx.set('id2', '1');
  ctx.set('id3', '2');
  ctx.set('uri1', 'QmYoPR3Uzj8tEFmbUuekzKG5swfEtqBTCyKT6Bs47i1NVp');
  ctx.set('uri2', 'QmVo27EQ3kKrSfvfd1LbqznfsJV6h3ftE4apxPhwMLWpm1');
  ctx.set('uri3', 'QmajMmUB3rtsb51nCuoaBu5uxpQA8MeaoE6bhnT5tn7MBT');
});

spec.beforeEach(async (ctx) => {
  const nfToken = await ctx.deploy({ 
    src: './build/Galaxia.json',
    contract: 'Galaxia',
    args: ['Galaxia','GAX']
  });
  ctx.set('nfToken', nfToken);
});

spec.test('correctly checks all the supported interfaces', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const nftokenInterface = await nftoken.instance.methods.supportsInterface('0x80ac58cd').call();
  const nftokenMetadataInterface = await nftoken.instance.methods.supportsInterface('0x5b5e139f').call();
  const nftokenNonExistingInterface = await nftoken.instance.methods.supportsInterface('0x780e9d63').call();
  ctx.is(nftokenInterface, true);
  ctx.is(nftokenMetadataInterface, true);
  ctx.is(nftokenNonExistingInterface, false);
});

spec.test('returns the correct issuer name', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const name = await nftoken.instance.methods.name().call();

  ctx.is(name, "Galaxia");
});

spec.test('returns the correct issuer symbol', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const symbol = await nftoken.instance.methods.symbol().call();

  ctx.is(symbol, "GAX");
});

spec.test('correctly mints a NFT', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  const logs = await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  ctx.not(logs.events.Transfer, undefined);
  const tokenURI: string = await nftoken.instance.methods.idToUri(id1).call();
  ctx.is(tokenURI, uri1);
});

spec.test('throws when trying to get URI of invalid NFT ID', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const id1 = ctx.get('id1');

  await ctx.reverts(() => nftoken.instance.methods.tokenURI(id1).call());
});


