import { stablecoinSupplyGlobal, llamaFeesByBucket, bsChain, capitalOnChain, stableSupply, stableSupplyLatest, earnAllocation, earnDepositors, earnDepositSizes } from "@/lib/queries";
import { Explorer, type Metric } from "@/components/explorer";
import { Diagrams } from "@/components/exhibit";
import { Mini } from "@/components/mini";
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

/** The front page: what most people come for, and a way into every tab. */
export default async function Home() {
  const [stableGlobal, buckets, bs, cap, stables, stablesNow, alloc, dep, sizes] = await Promise.all([
    stablecoinSupplyGlobal(), llamaFeesByBucket(), bsChain(), capitalOnChain(), stableSupply(), stableSupplyLatest(), earnAllocation(), earnDepositors(), earnDepositSizes(),
  ]);
  const tvl = [...new Map(alloc.map((r) => [String(r.day), { day: r.day, earn_tvl_usdg: r.earn_tvl_usdg }])).values()];
  const stableTotal = stablesNow.filter((r) => r.kind === "stablecoin").reduce((a, r) => a + n(r.supply), 0);
  const bsl = last(bs), cl = last(cap), sg = last(stableGlobal), d = last(dep);
  const fin = buckets.filter((b) => b.bucket === "finance");
  const day = String(bsl?.day ?? "").slice(0, 10);
  const asOf = day ? `${Number(day.slice(8, 10))} ${MON[Number(day.slice(5, 7)) - 1]} ${day.slice(0, 4)}` : "";

  const glance: Metric[] = [
    { id: "earn", label: "Deposited in Robinhood Earn", value: fmtUsd(n(last(tvl)?.earn_tvl_usdg)),
      note: "USDG in the Steakhouse vault behind Earn, daily.", chart: { kind: "area", data: tvl, x: "day", y: "earn_tvl_usdg" } },
    { id: "users", label: "Earn users, all time", value: n(sizes?.users).toLocaleString(),
      note: "Distinct wallets that have ever held Earn shares.", chart: { kind: "area", data: dep, x: "week", y: "cumulative_users", fmt: "raw" } },
    { id: "stables", label: "Stablecoins on Robinhood Chain", value: fmtUsd(stableTotal),
      note: "Each token's totalSupply() on the chain, daily.", chart: { kind: "columns", data: stables, x: "day", y: "supply", group: "token" } },
    { id: "capital", label: "Capital on chain", value: fmtUsd(n(cl?.capital_onchain_usd)),
      note: "USDG minted on the chain plus ETH bridged from Ethereum.", chart: { kind: "areas", data: cap, x: "day", ys: ["usdg_native", "eth_bridged_usd"] } },
    { id: "txns", label: "Transactions a day", value: n(bsl?.txns).toLocaleString(),
      note: "From Blockscout.", chart: { kind: "area", data: bs, x: "day", y: "txns", fmt: "raw" } },
    { id: "global", label: "Stablecoins, all chains", value: fmtUsd(n(sg?.supply_usd)), change: yearAgo(stableGlobal, "day", "supply_usd"),
      note: "The market Earn and the chain grow with. DeFiLlama, weekly.", chart: { kind: "area", data: stableGlobal, x: "day", y: "supply_usd" } },
  ];

  return (
    <div className="page page-solo">
      <main className="page-main">
        <section className="blk">
          <header className="hero">
            <h1 className="hero-t">Robinhood Chain and Earn</h1>
            <p className="hero-s"><span className="live">Data to <b>{asOf}</b></span><span>Robinhood Chain, Ethereum, Blockscout, DeFiLlama</span><span>Updated daily</span></p>
          </header>
          <Explorer label="Highlights" metrics={glance} />
        </section>

        <section className="blk">
          <h2 className="blk-t">Highlights</h2>
          <div className="minis">
            <Mini href="/earn#flows" where="Robinhood Earn" label="Earn deposits last week" value={fmtUsd(n(d?.deposited_usd))} data={dep} x="week" y="deposited_usd" kind="bars" />
            <Mini href="/earn#users" where="Robinhood Earn" label="Earn users last week" value={n(d?.active_users).toLocaleString()} data={dep} x="week" y="active_users" />
            <Mini href="/chain#accounts" where="Robinhood Chain" label="Active accounts a day" value={n(bsl?.active_accounts).toLocaleString()} data={bs} x="day" y="active_accounts" />
            <Mini href="/chain#gas" where="Robinhood Chain" label="Gas fees a day" value={fmtUsd(n(bsl?.fees_usd))} data={bs} x="day" y="fees_usd" kind="bars" />
            <Mini href="/chain#fee-share" where="Robinhood Chain" label="Finance share of app fees" value={fmtPct(n(last(fin)?.share))} data={fin} x="week" y="share" />
            <Mini href="/chain#wallets" where="Robinhood Chain" label="New smart wallets a day" value={n(bsl?.new_aa_wallets).toLocaleString()} data={bs} x="day" y="new_aa_wallets" kind="bars" />
          </div>
        </section>

        <section className="blk">
          <h2 className="blk-t">How Earn works</h2>
          <Diagrams figs={[{ id: "d1", title: "From the app to the borrower", source: "Robinhood Earn support article; onchain, Robinhood Chain" }]} />
        </section>
      </main>
    </div>
  );
}
