-- Example SQL queries for the WasteNot synthetic data package.
-- These assume the CSVs have been loaded into tables with matching names.

-- 1) Find ad sets with weak ROAS and high frequency, useful for Data Scout anomaly detection.
SELECT
  client_id,
  platform,
  campaign_id,
  adset_id,
  SUM(spend) AS spend_7d,
  SUM(revenue) / NULLIF(SUM(spend), 0) AS roas_7d,
  AVG(frequency) AS avg_frequency
FROM ad_performance_daily
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY 1,2,3,4
HAVING SUM(spend) > 500
   AND SUM(revenue) / NULLIF(SUM(spend), 0) < 1.5
   AND AVG(frequency) > 3.0;

-- 2) Estimate possible wasted spend by campaign when recent-buyer exclusions exist.
SELECT
  p.client_id,
  p.platform,
  p.campaign_id,
  SUM(p.spend) AS campaign_spend,
  MAX(a.estimated_size) AS recent_buyer_exclusion_size
FROM ad_performance_daily p
JOIN audience_segments a
  ON p.client_id = a.client_id
WHERE a.audience_name = 'Recent Buyers 30D'
GROUP BY 1,2,3
ORDER BY campaign_spend DESC;

-- 3) Retrieve benchmark evidence for a recommendation.
SELECT
  brand_category,
  monthly_ad_spend_band,
  strategy,
  primary_metric,
  avg_lift_pct,
  confidence_score,
  sample_size
FROM cross_client_benchmarks
WHERE brand_category = 'Apparel'
  AND monthly_ad_spend_band = '$50k-$100k'
ORDER BY confidence_score DESC, sample_size DESC;

-- 4) Join recommendations with benchmark evidence.
SELECT
  r.recommendation_id,
  r.client_id,
  r.title,
  r.expected_weekly_savings,
  r.confidence_score,
  r.risk_level,
  b.strategy,
  b.avg_lift_pct,
  b.sample_size
FROM recommendation_records r
LEFT JOIN cross_client_benchmarks b
  ON r.supporting_benchmark_id = b.benchmark_id
ORDER BY r.expected_weekly_savings DESC;
