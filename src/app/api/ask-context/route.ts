// GET /api/ask-context → every dataset on this dashboard as compact text, read by the "Ask AI" assistant.
import * as Q from "@/lib/queries";
import { stableSupply as llamaStable } from "@/lib/llama";
import { table, fromJson, contextResponse } from "@/lib/ask-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const [stableGlobal, buckets, finp, finw, bs, cap, stables, stablesNow] = await Promise.all([
    Q.stablecoinSupplyGlobal(), Q.llamaFeesByBucket(), Q.llamaFinanceProtocols(), Q.llamaFinanceWeekly(), Q.bsChain(), Q.capitalOnChain(), Q.stableSupply(), Q.stableSupplyLatest(),
  ]);
  const [alloc, dep, sizes, rwa, hold, usdg, usde] = await Promise.all([
    Q.earnAllocation(), Q.earnDepositors(), Q.earnDepositSizes(), Q.earnRwaShare(), Q.holders(), llamaStable(286).catch(() => null), llamaStable(146).catch(() => null),
  ]);
  return contextResponse([
    `# Robinhood Earn and Robinhood Chain dashboard (robinhood.paultimofeev.com)
Pages: Robinhood Chain (/): stablecoin supply (global and on chain), capital on chain (L1 bridge ETH + native stablecoins), DeFi TVL, transactions, accounts, gas fees, new smart wallets, fee share by activity, lending/Earn protocol fees. Earn (/earn): Earn users, deposits, net flow, vault allocation by Morpho market and collateral. Who gets paid (/who-gets-paid): each layer of the Earn stack, its fees and revenue, and the collateral side.
Data: Earn vault and Morpho market flows, stablecoin supply, bridge and chain activity come from Robinhood Chain and Ethereum logs and contract calls; protocol fees, TVL and token prices from DefiLlama and CoinGecko.
`,
    table("Global stablecoin supply", stableGlobal, { max: 100 }),
    table("Stablecoin supply on Robinhood Chain", stables, { max: 200 }),
    table("Stablecoins on Robinhood Chain now", stablesNow),
    table("Capital on chain (bridge ETH + native stablecoins)", cap, { max: 100 }),
    table("Chain activity (Blockscout: transactions, accounts, gas, smart wallets)", bs, { max: 100 }),
    table("Fee share by activity", buckets, { max: 150 }),
    table("Lending / Earn protocols on chain", finp),
    table("Lending / Earn protocols, weekly", finw, { max: 150 }),
    table("Robinhood Earn vault allocation", alloc, { max: 150 }),
    table("Earn depositors", dep, { max: 100 }),
    fromJson("Earn deposit sizes", sizes),
    table("Earn collateral (RWA) share", rwa),
    table("Holders", hold),
    fromJson("USDG supply (DefiLlama): now vs a year ago", usdg),
    fromJson("USDe supply (DefiLlama): now vs a year ago", usde),
  ]);
}
