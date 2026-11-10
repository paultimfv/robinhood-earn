import { earnAllocation, earnDepositors, earnDepositSizes, earnRwaShare, holders } from "@/lib/queries";
import { Explorer, Linked, Rail, type Metric } from "@/components/explorer";
import { fmtUsd, fmtPct } from "@/lib/fmt";

export const dynamic = "force-dynamic";

const last = <T,>(a: T[]) => a[a.length - 1];
const n = (v: unknown) => Number(v ?? 0);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/* the market box in the diagram for each collateral */
const MARKET: Record<string, string> = { USDe: "m1", syrupUSDG: "m2", mGLO: "m3", spUSDG: "m4" };

export default async function EarnPage() {
  const [alloc, dep, sizes, rwa, hold] = await Promise.all([earnAllocation(), earnDepositors(), earnDepositSizes(), earnRwaShare(), holders()]);
  const al = last(alloc), d = last(dep);
  const held = rwa.filter((r) => n(r.share) >= 0.001);
  const day = String(al?.day ?? "").slice(0, 10);
  const asOf = day ? `${Number(day.slice(8, 10))} ${MON[Number(day.slice(5, 7)) - 1]} ${day.slice(0, 4)}` : "";

  const earn: Metric[] = [
    { id: "tvl", node: { fig: "d1", id: "v" }, label: "Deposited in Earn", value: fmtUsd(n(al?.earn_tvl_usdg)),
      note: "USDG in the Steakhouse vault behind Earn, by the collateral it is lent against.", chart: { kind: "columns", data: alloc, x: "day", y: "allocated_usdg", group: "collateral" } },
    { id: "users", node: { fig: "d1", id: "u" }, label: "Users last week", value: n(d?.active_users).toLocaleString(),
      note: "Wallets that deposited or withdrew that week, and the new ones among them.", chart: { kind: "line", data: dep, x: "week", ys: ["active_users", "new_users"], fmt: "raw" } },
    { id: "all-users", node: { fig: "d1", id: "u" }, label: "Users, all time", value: n(sizes?.users).toLocaleString(),
      note: "Distinct wallets that have ever held Earn shares.", chart: { kind: "area", data: dep, x: "week", y: "cumulative_users", fmt: "raw" } },
    { id: "flows", node: { fig: "d1", id: "usdg" }, label: "Net flow last week", value: fmtUsd(n(d?.net_flow_usd)),
      note: "Deposits each week (bars) and deposits minus withdrawals (line).", chart: { kind: "barsline", data: dep, x: "week", bar: "deposited_usd", line: "net_flow_usd" } },
  ];
  const collateral: Metric[] = [
    { id: "mix", node: { fig: "d1", id: "b" }, label: "All collateral today", value: fmtUsd(held.reduce((a, r) => a + n(r.allocated_usdg), 0)),
      note: "USDG lent against each collateral token right now.", chart: { kind: "cats", data: held, x: "collateral", y: "allocated_usdg" } },
    ...held.map((r): Metric => {
      const c = String(r.collateral);
      const name = c.startsWith("0x") ? `Unlabelled market (${c}…)` : c;
      return { id: `c-${c.toLowerCase()}`, node: MARKET[c] ? { fig: "d1", id: MARKET[c] } : undefined, label: name, value: fmtPct(n(r.share)),
        note: `${fmtUsd(n(r.allocated_usdg))} of Earn's USDG is lent to borrowers who post ${c.startsWith("0x") ? "this token" : c}.`, chart: { kind: "area", data: alloc.filter((x) => x.collateral === c), x: "day", y: "allocated_usdg" } };
    }),
  ];
  const sections = [{ id: "earn", label: "Deposits and users" }, { id: "collateral", label: "Collateral" }, { id: "data", label: "Data and method" }];

  return (
    <div className="page">
      <Rail items={sections} />
      <main className="page-main">
        <header className="hero">
          <h1 className="hero-t">Robinhood Earn</h1>
          <p className="hero-l">Robinhood&apos;s lending product: a normal app in front, a Steakhouse-curated Morpho vault underneath. Users deposit USDG; borrowers post collateral to borrow it.</p>
          <p className="hero-s"><span className="live">Data to <b>{asOf}</b></span><span>Robinhood Chain, Blockscout</span><span>Updated daily</span></p>
        </header>

        <section id="earn" className="blk">
          <h2 className="blk-t">Deposits and users</h2>
          <Linked label="Deposits and users" metrics={earn} figs={[{ id: "d1", title: "How Earn works", lede: "The user taps Earn. Their USDG sits in a self-custodial wallet and is lent through a Morpho vault curated by Steakhouse.", source: "Robinhood Earn support article; onchain, Robinhood Chain" }]} aside={
            <dl className="facts">
              <div><dt>Median deposit</dt><dd>{fmtUsd(n(sizes?.median_deposit))}</dd></div>
              <div><dt>Average deposit</dt><dd>{fmtUsd(n(sizes?.avg_deposit))}</dd></div>
              <div><dt>Deposits, all time</dt><dd>{n(sizes?.deposits).toLocaleString()}</dd></div>
              <div><dt>Holding today</dt><dd>{n(hold.find((r) => r.token === "steakUSDG (Earn)")?.holders).toLocaleString()}</dd></div>
            </dl>} />
        </section>

        <section id="collateral" className="blk">
          <h2 className="blk-t">Collateral</h2>
          <p className="blk-l">Borrowers post a yield-bearing token to borrow Earn&apos;s USDG. The mix decides which issuers grow with Earn. Who they are and how Earn pays them is on <a className="underline" href="/who-gets-paid">Who gets paid</a>.</p>
          <Explorer label="Collateral" metrics={collateral} />
        </section>

        <section id="data" className="blk blk-data">
          <h2 className="blk-t">Data and method</h2>
          <div className="method-b">
            <p><span className="text-ink-2">Vault.</span> Earn is the Steakhouse USDG vault (steakUSDG) on Robinhood Chain. Users are distinct share owners; deposits and withdrawals are its ERC-4626 events.</p>
            <p><span className="text-ink-2">Collateral.</span> The vault&apos;s supply and withdraw events on each Morpho market, summed by the market&apos;s collateral token. Current holders from Blockscout.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
