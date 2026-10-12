# robinhood-earn

Robinhood Earn and Robinhood Chain: where the dollars go and who gets paid.

Live: https://robinhood-earn.vercel.app

## Pages

| Page | Covers |
|---|---|
| Robinhood Chain (`/`) | Stablecoin supply (global and on chain), capital on chain (L1 bridge ETH + native stablecoins), DeFi TVL, transactions, accounts, gas fees, new smart wallets, fee share by activity, lending/Earn protocol fees |
| Earn (`/earn`) | Earn users, deposits, net flow, vault allocation by Morpho market and collateral |
| Who gets paid (`/who-gets-paid`) | Each layer of the Earn stack, its fees and revenue, and the collateral side |

## Data

| Data | Source |
|---|---|
| Earn vault and Morpho market flows, stablecoin supply, bridge, chain activity, syrupUSDG | Postgres tables built by [maple-pipeline](https://github.com/paultimfv/maple-pipeline) (Robinhood Chain and Ethereum logs, `eth_call`, Blockscout) |
| Protocol fees, revenue, TVL; stablecoin supply by token | DeFiLlama, fetched live, cached 1 hour (`src/lib/llama.ts`) |
| Token price, market cap | CoinGecko, fetched live |

Queries: `src/lib/queries.ts`.

## Run

```
npm install
echo "DATABASE_URL=..." > .env.local
npm run dev
```
