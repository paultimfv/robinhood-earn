import { stablecoinSupplyGlobal, llamaFeesByBucket, llamaFinanceProtocols, llamaFinanceWeekly, bsChain, capitalOnChain, stableSupply, stableSupplyLatest } from "@/lib/queries";
import { Panel, Table } from "@/components/charts";
import { Explorer, Linked, Rail, type Metric } from "@/components/explorer";
import { fmtUsd, fmtPct } from "@/lib/fmt";

export const dynamic = "force-dynamic";

type R = Record<string, unknown>;
const last = <T,>(a: T[]) => a[a.length - 1];
const n = (v: unknown) => Number(v ?? 0);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const yearAgo = (rows: R[], xk: string, k: string) => {
  const lr = [...rows].reverse().find((x) => x[k] != null); if (!lr) return NaN;
  const cut = new Date(new Date(String(lr[xk]).slice(0, 10)).getTime() - 365 * 864e5).toISOString().slice(0, 10);
  const old = [...rows].reverse().find((x) => String(x[xk]).slice(0, 10) <= cut && x[k] != null);
  return old && n(old[k]) ? n(lr[k]) / n(old[k]) - 1 : NaN;
};

export default async function ChainPage() {
  const [stableGlobal, buckets, finp, finw] = await Promise.all([stablecoinSupplyGlobal(), llamaFeesByBucket(), llamaFinanceProtocols(), llamaFinanceWeekly()]);
  const [bs, cap, stables, stablesNow] = await Promise.all([bsChain(), capitalOnChain(), stableSupply(), stableSupplyLatest()]);
  const stableTotal = stablesNow.filter((r) => r.kind === "stablecoin").reduce((a, r) => a + n(r.supply), 0);
  const ybTotal = stablesNow.filter((r) => r.kind === "yield-bearing").reduce((a, r) => a + n(r.supply), 0);
  const bsl = last(bs), cl = last(cap), sg = last(stableGlobal);
  const lastWeek = String(last(buckets)?.week ?? "");
  const finShare = n(buckets.find((b) => String(b.week) === lastWeek && b.bucket === "finance")?.share);
  const finWeek = finw.filter((r) => String(r.week) === String(last(finw)?.week ?? "")).reduce((a, r) => a + n(r.fees_usd), 0);
  const day = String(bsl?.day ?? "").slice(0, 10);
  const asOf = day ? `${Number(day.slice(8, 10))} ${MON[Number(day.slice(5, 7)) - 1]} ${day.slice(0, 4)}` : "";

  const money: Metric[] = [
    { id: "global", label: "Stablecoins, all chains", value: fmtUsd(n(sg?.supply_usd)), change: yearAgo(stableGlobal, "day", "supply_usd"),
      note: "USD-pegged stablecoin supply across every chain, weekly, from DeFiLlama.", chart: { kind: "area", data: stableGlobal, x: "day", y: "supply_usd" } },
    { id: "stables", label: "Stablecoins on Robinhood Chain", value: fmtUsd(stableTotal),
      note: "Each token's totalSupply() on Robinhood Chain, daily.", chart: { kind: "columns", data: stables, x: "day", y: "supply", group: "token" } },
    { id: "capital", label: "Capital on chain", value: fmtUsd(n(cl?.capital_onchain_usd)),
      note: "USDG minted on the chain plus ETH bridged from Ethereum.", chart: { kind: "areas", data: cap, x: "day", ys: ["usdg_native", "eth_bridged_usd"] } },
  ];
  const activity: Metric[] = [
    { id: "txns", node: { fig: "d2", id: "u" }, label: "Transactions a day", value: n(bsl?.txns).toLocaleString(),
      note: "From Blockscout.", chart: { kind: "area", data: bs, x: "day", y: "txns", fmt: "raw" } },
    { id: "accounts", node: { fig: "d2", id: "u" }, label: "Active accounts a day", value: n(bsl?.active_accounts).toLocaleString(),
      note: "Active accounts, and the new ones among them. The 11–12 Aug spike was a one-off wave of new accounts.", chart: { kind: "line", data: bs, x: "day", ys: ["active_accounts", "new_accounts"], fmt: "raw" } },
    { id: "wallets", node: { fig: "d2", id: "u" }, label: "New smart wallets a day", value: n(bsl?.new_aa_wallets).toLocaleString(),
      note: "ERC-4337 smart wallets created each day.", chart: { kind: "area", data: bs, x: "day", y: "new_aa_wallets", fmt: "raw" } },
    { id: "gas", node: { fig: "d2", id: "gas" }, label: "Gas fees a day", value: fmtUsd(n(bsl?.fees_usd)),
      note: "Paid to the sequencer, in dollars. The early-September spike is real: 1,400–3,300 ETH a day.", chart: { kind: "area", data: bs, x: "day", y: "fees_usd" } },
    { id: "margin", node: { fig: "d2", id: "rm" }, label: "Sequencer margin a day", value: fmtUsd(n(bsl?.sequencer_margin_usd)),
      note: "Gas fees minus what the chain pays Ethereum to post its data.", chart: { kind: "area", data: bs.filter((r) => r.sequencer_margin_usd != null), x: "day", y: "sequencer_margin_usd" } },
    { id: "fee-share", node: { fig: "d2", id: "a3" }, label: "Finance share of app fees", value: fmtPct(finShare),
      note: "App fees by type, weekly, from DeFiLlama. Finance is lending, curators, RWA, yield and payments; speculation is trading, perps, prediction markets and launchpads.", chart: { kind: "share", data: buckets, x: "week", y: "share", group: "bucket" } },
    { id: "lending-fees", node: { fig: "d2", id: "a3" }, label: "Lending and Earn fees, last week", value: fmtUsd(finWeek),
      note: "Weekly fees of the finance protocols on the chain, from DeFiLlama.", chart: { kind: "columns", data: finw, x: "week", y: "fees_usd", group: "protocol" } },
  ];
  const sections = [{ id: "money", label: "Stablecoins and capital" }, { id: "activity", label: "Activity and fees" }, { id: "data", label: "Data and method" }];

  return (
    <div className="page">
      <Rail items={sections} />
      <main className="page-main">
        <header className="hero">
          <h1 className="hero-t">Robinhood Chain</h1>
          <p className="hero-l">Robinhood&apos;s Arbitrum chain: the dollars on it, what people do there, and who earns the fees.</p>
          <p className="hero-s"><span className="live">Data to <b>{asOf}</b></span><span>Robinhood Chain, Ethereum, Blockscout, DeFiLlama</span><span>Updated daily</span></p>
        </header>

        <section id="money" className="blk">
          <h2 className="blk-t">Stablecoins and capital</h2>
          <Explorer label="Stablecoins and capital" metrics={money} aside={
            <dl className="facts">
              <div><dt>Share of all stablecoins</dt><dd>{fmtPct(stableTotal / (n(sg?.supply_usd) || 1))}</dd></div>
              <div><dt>Yield-bearing on the chain</dt><dd>{fmtUsd(ybTotal)}</dd></div>
              <div><dt>ETH bridged</dt><dd>{fmtUsd(n(cl?.eth_bridged_usd))}</dd></div>
              <div><dt>USDG minted</dt><dd>{fmtUsd(n(cl?.usdg_native))}</dd></div>
            </dl>} />
        </section>

        <section id="activity" className="blk">
          <h2 className="blk-t">Activity and fees</h2>
          <Linked label="Activity and fees" metrics={activity} figs={[{ id: "d2", title: "Where the fees go", lede: "Two separate streams: gas goes to the chain, app fees stay with the apps.", source: "Robinhood Chain docs; ArbitrumDAO factsheet; Ethereum SequencerInbox" }]} />
        </section>

        <section id="data" className="blk blk-data">
          <h2 className="blk-t">Data and method</h2>
          <Panel title="Lending and Earn protocols by fees" sub="Last 7 days, DeFiLlama">
            <Table rows={finp} cols={[
              { key: "protocol", title: "protocol" }, { key: "category", title: "category" },
              { key: "fees_7d", title: "fees 7d", fmt: "usd" }, { key: "revenue_7d", title: "revenue 7d", fmt: "usd" }, { key: "fee_share", title: "share", fmt: "pct" },
            ]} />
          </Panel>
          <div className="method-b">
            <p><span className="text-ink-2">Sources.</span> Activity and gas from Blockscout. Bridged ETH from the L1 bridge on Ethereum; L1 data cost from the SequencerInbox; ETH price daily. Stablecoin supply is each token&apos;s totalSupply() on Robinhood Chain. DeFiLlama only for global stablecoin supply, protocol TVL and app-fee categories.</p>
            <p><span className="text-ink-2">Fee types.</span> By DeFiLlama category. Speculation = DEXs, aggregators, perps, prediction markets, launchpads, meme, Telegram bots, gamified mining, NFT marketplaces. Finance = lending, risk curators, RWA, yield, capital allocators, payments. Other (about 1%) = bridges, wallets, interfaces, AI agents, indexes.</p>
            <p><span className="text-ink-2">Capital on chain.</span> USDG minted natively plus ETH bridged at the day&apos;s price. DeFiLlama&apos;s DeFi TVL ({fmtUsd(n(cl?.llama_tvl_usd))}) sums protocols instead, so the two differ.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
