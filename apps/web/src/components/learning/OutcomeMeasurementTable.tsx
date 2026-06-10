"use client";

import type { OutcomeMeasurement } from "@/types/learning";

export function OutcomeMeasurementTable({ items }: { items: OutcomeMeasurement[] }) {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Outcome Measurements</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th><th>Platform</th><th>Campaign</th><th>Spend</th><th>Revenue</th><th>ROAS</th><th>CPA</th><th>Purchases</th><th>Impact</th><th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.measurement_id}>
                <td>{item.brand_name || item.client_id}</td>
                <td>{item.platform}</td>
                <td>{item.campaign_id || "-"}</td>
                <td>{money(item.spend_before)} to {money(item.spend_after)}</td>
                <td>{money(item.revenue_before)} to {money(item.revenue_after)}</td>
                <td>{item.roas_before.toFixed(2)} to {item.roas_after.toFixed(2)}</td>
                <td>{money(item.cpa_before)} to {money(item.cpa_after)}</td>
                <td>{item.purchases_before} to {item.purchases_after}</td>
                <td>{pct(item.measured_impact_pct)}</td>
                <td><span className="badge badge-info">{item.outcome_label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
