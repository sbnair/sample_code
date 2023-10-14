import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import { LocalSigningManager } from '@polymeshassociation/local-signing-manager';
import { TransactionStatus } from '@polymeshassociation/polymesh-sdk/types';

const alice = '//Alice';

async function main() {
  const accounts: { uri: string }[] = [{ uri: alice }];

  const signingManager = await LocalSigningManager.create({
    accounts,
  });

  const sdk = await Polymesh.connect({
    nodeUrl: 'ws://localhost:9944',
    signingManager,
    polkadot: { noInitWarn: false },
  });

  const signingAccounts = await signingManager.getAccounts();

  const aliceKey = signingAccounts[0];

  const createTx = await sdk.assets.createAsset(
    {
      ticker: 'TOKEN5',
      name: 'TOKEN 5',
      isDivisible: true,
      assetType: 'Share',
    },
    { signingAccount: aliceKey },
  );

  const unsubStatus = createTx.onStatusChange((s) => {
    const { status, isSuccess, blockNumber, txHash, txIndex } = s;
    if (status === TransactionStatus.Unapproved) {
      console.log('- Awaiting signature');
    }
    if (status === TransactionStatus.Running) {
      console.log(`- Status: ${status}, Transaction hash ${txHash}`);
    }
    if (isSuccess)
      console.log(
        `-`,
        status,
        'included in block#',
        blockNumber?.toString(),
        'index',
        txIndex?.toString(),
      );
  });
  const assetResult = await createTx.run();
  const assetDetails = await assetResult.details();
  console.log('Ticker:', assetResult.ticker);
  console.log('Name:', assetDetails.name);
  console.log('Total Supply:', assetDetails.totalSupply.toString());
  console.log('Owner:', assetDetails.owner.did);

  unsubStatus();

  process.exit();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit();
});
