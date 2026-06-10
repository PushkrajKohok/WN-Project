"use client";

import type { StrategyLearningScore } from "@/types/learning";

export function StrategyLearningScoreTable({ items, onPromote }: { items: StrategyLearningScore[]; onPromote: (score: StrategyLearningScore) => void }) {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Strategy Learning Scores</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Strategy</th><th>Category</th><th>Spend band</th><th>Platform</th><th>Trials</th><th>Success</th><th>Rollbacks</th><th>Impact</th><th>Confidence</th><th>Score</th><th>Promote</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.strategy_key}>
                <td className="font-semibold">{item.strategy}</td>
                <td>{item.brand_category}</td>
                <td>{item.spend_band}</td>
                <td>{item.platform}</td>
                <td>{item.total_trials}</td>
                <td>{item.successful_trials}</td>
                <td>{item.rolled_back_trials}</td>
                <td>{pct(item.avg_actual_impact_pct)}</td>
                <td>{pct(item.avg_confidence)}</td>
                <td>{pct(item.learning_score)}</td>
                <td><button type="button" onClick={() => onPromote(item)} className="btn btn-secondary btn-sm">Promote</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
