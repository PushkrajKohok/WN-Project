#!/usr/bin/env python3
"""
WasteNot synthetic data generator.

Generates realistic synthetic CSV data for an always-on multi-agent RAG ad-optimization layer.
No real customer data or PII is created. Customer identity is represented using deterministic hashes.

Usage:
  python generate_wastenot_synthetic_data.py --output-dir ./wastenot_synthetic_sample_data --clients 60 --customers-per-client 800 --days 90 --seed 42

Scale tips:
  - Smaller demo: --clients 10 --customers-per-client 200 --days 30
  - Larger demo:  --clients 100 --customers-per-client 1500 --days 180
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
import random
import shutil
import string
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

DATE_FMT = "%Y-%m-%d"
TS_FMT = "%Y-%m-%d %H:%M:%S"

CATEGORIES = [
    "Apparel", "Beauty", "Supplements", "Home Goods", "Footwear", "Pet Supplies",
    "Outdoor", "Baby", "Jewelry", "Consumer Electronics", "Fitness", "Food & Beverage"
]
SPEND_BANDS = ["$10k-$25k", "$25k-$50k", "$50k-$100k", "$100k-$250k", "$250k+"]
COUNTRIES = ["US", "CA", "GB", "AU"]
US_STATES = ["CA", "NY", "TX", "FL", "IL", "PA", "WA", "GA", "NC", "AZ", "CO", "MA"]
ACQ_SOURCES = ["Meta", "Google", "Klaviyo", "Organic", "Influencer", "Referral", "Affiliate"]
PLATFORMS = ["Meta", "Google"]
OBJECTIVES = ["Prospecting", "Retargeting", "Brand Search", "Shopping", "Lookalike", "Winback"]
ADSET_TYPES = ["Broad", "Interest", "Lookalike", "Site Visitors", "Cart Abandoners", "Recent Buyers", "High LTV"]
KLAVIYO_EVENTS = [
    "Email Opened", "Email Clicked", "SMS Clicked", "Added to Cart", "Started Checkout",
    "Placed Order", "Viewed Product", "Subscribed", "Unsubscribed", "Abandoned Cart"
]
OPT_ACTIONS = [
    "Exclude Recent Buyers", "Suppress Email Converters", "Refresh Fatigued Audience",
    "Reduce Budget", "Increase Budget", "Split Retargeting Window", "Pause Low ROAS Adset",
    "Create Lookalike from High LTV", "Fix Tracking Gap", "Tighten Brand Search Exclusions"
]
AGENTS = ["Data Scout", "Pattern Miner", "Recommendation Engine", "Risk Guardrail", "Action Executor"]
RISK_LEVELS = ["Low", "Medium", "High"]
STATUSES = ["Generated", "Approved", "Executed", "Rejected", "Pending Review", "Rolled Back"]


def ensure_clean_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def write_csv(path: Path, fieldnames: List[str], rows: Iterable[Dict]) -> int:
    count = 0
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
            count += 1
    return count


def rand_ts(start: datetime, end: datetime) -> datetime:
    delta = int((end - start).total_seconds())
    return start + timedelta(seconds=random.randint(0, max(delta, 1)))


def stable_hash(value: str, length: int = 16) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:length]


def money(x: float) -> str:
    return f"{x:.2f}"


def pct(x: float) -> str:
    return f"{x:.4f}"


def brand_name(i: int, category: str) -> str:
    prefixes = ["North", "Peak", "Bright", "Urban", "Ever", "Kind", "Bold", "Nova", "True", "Wild", "Pure", "Swift"]
    suffixes = ["Labs", "Co", "Supply", "Studio", "Works", "Market", "House", "Goods", "Collective", "Club"]
    cat_word = category.split()[0]
    return f"{random.choice(prefixes)} {cat_word} {random.choice(suffixes)} {i:03d}"


def generate_clients(n_clients: int, start: datetime, end: datetime) -> List[Dict]:
    clients = []
    for i in range(1, n_clients + 1):
        category = random.choice(CATEGORIES)
        spend_band = random.choices(SPEND_BANDS, weights=[15, 25, 30, 22, 8], k=1)[0]
        client_id = f"CL_{i:04d}"
        name = brand_name(i, category)
        aov = round(random.uniform(35, 180), 2)
        margin = round(random.uniform(0.35, 0.78), 4)
        created = rand_ts(start - timedelta(days=365), start - timedelta(days=5))
        clients.append({
            "client_id": client_id,
            "brand_name": name,
            "brand_category": category,
            "monthly_ad_spend_band": spend_band,
            "avg_order_value": money(aov),
            "gross_margin_pct": pct(margin),
            "shopify_store_domain": name.lower().replace(" ", "-").replace("&", "and") + ".myshopify.com",
            "klaviyo_account_id": f"KV_{stable_hash(client_id + 'klaviyo', 10)}",
            "meta_account_id": f"act_{random.randint(1000000000, 9999999999)}",
            "google_ads_customer_id": f"{random.randint(100,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}",
            "snowflake_schema": f"CLIENT_{i:04d}_MART",
            "created_at": created.strftime(TS_FMT),
            "data_consent_status": random.choices(["active", "restricted", "paused"], weights=[90, 7, 3], k=1)[0]
        })
    return clients


def generate_products(clients: List[Dict], products_per_client: int) -> List[Dict]:
    products = []
    adjectives = ["Core", "Premium", "Ultra", "Classic", "Daily", "Essential", "Performance", "Signature", "Eco", "Pro"]
    nouns_by_category = {
        "Apparel": ["Tee", "Hoodie", "Jogger", "Jacket", "Legging"],
        "Beauty": ["Serum", "Cleanser", "Cream", "Toner", "Mask"],
        "Supplements": ["Protein", "Greens", "Collagen", "Creatine", "Vitamin"],
        "Home Goods": ["Lamp", "Throw", "Organizer", "Planter", "Candle"],
        "Footwear": ["Runner", "Trainer", "Sandal", "Boot", "Sneaker"],
        "Pet Supplies": ["Treat", "Toy", "Harness", "Bed", "Bowl"],
        "Outdoor": ["Pack", "Bottle", "Tent", "Cooler", "Jacket"],
        "Baby": ["Blanket", "Bottle", "Onesie", "Carrier", "Toy"],
        "Jewelry": ["Ring", "Necklace", "Bracelet", "Earring", "Charm"],
        "Consumer Electronics": ["Charger", "Cable", "Speaker", "Case", "Stand"],
        "Fitness": ["Mat", "Band", "Dumbbell", "Roller", "Bottle"],
        "Food & Beverage": ["Coffee", "Snack", "Tea", "Sauce", "Bar"]
    }
    for c in clients:
        category = c["brand_category"]
        base_price = float(c["avg_order_value"])
        for j in range(1, products_per_client + 1):
            pid = f"P_{c['client_id']}_{j:03d}"
            noun = random.choice(nouns_by_category.get(category, ["Product"]))
            price = max(8, random.gauss(base_price / random.uniform(1.0, 2.2), base_price * 0.15))
            products.append({
                "product_id": pid,
                "client_id": c["client_id"],
                "sku": f"{c['client_id'][-4:]}-{j:03d}-{random.choice(string.ascii_uppercase)}{random.randint(10,99)}",
                "product_name": f"{random.choice(adjectives)} {noun}",
                "product_category": category,
                "price": money(price),
                "margin_pct": pct(min(0.9, max(0.2, float(c["gross_margin_pct"]) + random.uniform(-0.1, 0.1)))),
                "active_flag": random.choices(["true", "false"], weights=[92, 8], k=1)[0]
            })
    return products


def generate_customers(clients: List[Dict], customers_per_client: int, start: datetime, end: datetime) -> Tuple[List[Dict], Dict[str, List[Dict]]]:
    customers = []
    by_client = defaultdict(list)
    for c in clients:
        for j in range(1, customers_per_client + 1):
            cid = f"CU_{c['client_id']}_{j:06d}"
            email_hash = "em_" + stable_hash(cid + "@example.com", 20)
            first_seen = rand_ts(start - timedelta(days=720), end)
            consent_email = random.choices(["true", "false"], weights=[80, 20], k=1)[0]
            consent_ads = random.choices(["true", "false"], weights=[88, 12], k=1)[0]
            order_count = random.choices([0, 1, 2, 3, 4, 5, 6, 8, 10], weights=[18, 30, 18, 12, 8, 5, 4, 3, 2], k=1)[0]
            aov = float(c["avg_order_value"])
            ltv = max(0, random.gauss(order_count * aov, max(aov * 0.7, 1))) if order_count > 0 else 0
            last_order = ""
            if order_count > 0:
                last_order = rand_ts(max(first_seen, start - timedelta(days=365)), end).strftime(TS_FMT)
            row = {
                "customer_id": cid,
                "client_id": c["client_id"],
                "email_hash": email_hash,
                "first_seen_at": first_seen.strftime(TS_FMT),
                "acquisition_source": random.choice(ACQ_SOURCES),
                "country": random.choices(COUNTRIES, weights=[82, 8, 6, 4], k=1)[0],
                "state_region": random.choice(US_STATES),
                "lifetime_value": money(ltv),
                "order_count": order_count,
                "last_order_at": last_order,
                "consent_email": consent_email,
                "consent_ads": consent_ads,
                "segment_hint": random.choices(["Recent Buyer", "High LTV", "Discount Seeker", "Cart Abandoner", "Prospect", "Dormant"], weights=[18, 10, 14, 16, 30, 12], k=1)[0]
            }
            customers.append(row)
            by_client[c["client_id"]].append(row)
    return customers, by_client


def generate_orders_and_items(clients: List[Dict], customers_by_client: Dict[str, List[Dict]], products_by_client: Dict[str, List[Dict]], start: datetime, end: datetime, days: int) -> Tuple[List[Dict], List[Dict]]:
    orders = []
    items = []
    order_idx = 1
    for c in clients:
        custs = customers_by_client[c["client_id"]]
        products = products_by_client[c["client_id"]]
        spend_multiplier = SPEND_BANDS.index(c["monthly_ad_spend_band"]) + 1
        expected_orders = int(len(custs) * random.uniform(0.28, 0.65) * (0.75 + spend_multiplier * 0.12))
        for _ in range(expected_orders):
            cust = random.choice(custs)
            ots = rand_ts(start, end)
            n_items = random.choices([1, 2, 3, 4], weights=[66, 24, 8, 2], k=1)[0]
            order_id = f"SO_{order_idx:09d}"
            selected = random.sample(products, k=min(n_items, len(products)))
            subtotal = 0.0
            for p in selected:
                qty = random.choices([1, 2, 3], weights=[82, 14, 4], k=1)[0]
                item_price = float(p["price"])
                subtotal += qty * item_price
                items.append({
                    "order_id": order_id,
                    "client_id": c["client_id"],
                    "product_id": p["product_id"],
                    "sku": p["sku"],
                    "quantity": qty,
                    "item_price": money(item_price),
                    "item_margin_pct": p["margin_pct"]
                })
            discount_used = random.choices(["true", "false"], weights=[28, 72], k=1)[0]
            discount_amount = subtotal * random.uniform(0.05, 0.25) if discount_used == "true" else 0.0
            order_value = max(1, subtotal - discount_amount)
            orders.append({
                "order_id": order_id,
                "client_id": c["client_id"],
                "customer_id": cust["customer_id"],
                "email_hash": cust["email_hash"],
                "order_ts": ots.strftime(TS_FMT),
                "order_value": money(order_value),
                "discount_used": discount_used,
                "discount_amount": money(discount_amount),
                "payment_status": random.choices(["paid", "refunded", "partially_refunded", "failed"], weights=[94, 3, 2, 1], k=1)[0],
                "fulfillment_status": random.choices(["fulfilled", "partial", "unfulfilled"], weights=[88, 7, 5], k=1)[0],
                "sales_channel": random.choices(["online_store", "shop_app", "amazon", "tiktok_shop"], weights=[74, 14, 8, 4], k=1)[0]
            })
            order_idx += 1
    return orders, items


def generate_klaviyo_events(clients: List[Dict], customers_by_client: Dict[str, List[Dict]], start: datetime, end: datetime) -> List[Dict]:
    events = []
    eid = 1
    flows = ["Welcome Series", "Abandoned Cart", "Post Purchase", "Winback", "VIP Early Access", "Summer Sale", "Browse Abandonment"]
    for c in clients:
        custs = customers_by_client[c["client_id"]]
        n_events = int(len(custs) * random.uniform(2.0, 5.0))
        for _ in range(n_events):
            cust = random.choice(custs)
            etype = random.choices(KLAVIYO_EVENTS, weights=[23, 13, 5, 12, 8, 8, 18, 5, 2, 6], k=1)[0]
            revenue = 0.0
            if etype == "Placed Order":
                revenue = max(5, random.gauss(float(c["avg_order_value"]), float(c["avg_order_value"]) * 0.35))
            events.append({
                "event_id": f"KV_EVT_{eid:010d}",
                "client_id": c["client_id"],
                "profile_id": "KP_" + stable_hash(cust["customer_id"] + "klaviyo", 14),
                "customer_id": cust["customer_id"],
                "email_hash": cust["email_hash"],
                "event_type": etype,
                "event_ts": rand_ts(start, end).strftime(TS_FMT),
                "flow_or_campaign_name": random.choice(flows),
                "message_channel": random.choices(["email", "sms", "push"], weights=[78, 18, 4], k=1)[0],
                "revenue_attributed": money(revenue),
                "properties_json": json.dumps({"source": "synthetic", "device": random.choice(["mobile", "desktop", "tablet"])})
            })
            eid += 1
    return events


def generate_campaigns_and_adsets(clients: List[Dict], start: datetime) -> Tuple[List[Dict], List[Dict]]:
    campaigns = []
    adsets = []
    cidx = 1
    aidx = 1
    for c in clients:
        for platform in PLATFORMS:
            base_campaigns = random.randint(4, 8)
            for _ in range(base_campaigns):
                objective = random.choice(OBJECTIVES)
                campaign_id = f"{platform[:1]}C_{cidx:08d}"
                daily_budget = random.uniform(80, 2500) * (SPEND_BANDS.index(c["monthly_ad_spend_band"]) + 1) / 3
                campaigns.append({
                    "campaign_id": campaign_id,
                    "client_id": c["client_id"],
                    "platform": platform,
                    "campaign_name": f"{objective} - {c['brand_category']} - {random.choice(['Q2', 'Evergreen', 'Promo', 'Scale'])}",
                    "objective": objective,
                    "status": random.choices(["active", "paused", "learning", "limited"], weights=[72, 14, 10, 4], k=1)[0],
                    "daily_budget": money(daily_budget),
                    "bid_strategy": random.choice(["lowest_cost", "cost_cap", "target_roas", "maximize_conversions"]),
                    "attribution_window": random.choice(["1d_click", "7d_click", "7d_click_1d_view", "data_driven"]),
                    "created_at": rand_ts(start - timedelta(days=240), start).strftime(TS_FMT)
                })
                for _ in range(random.randint(2, 5)):
                    adset_id = f"{platform[:1]}A_{aidx:09d}"
                    audience_type = random.choice(ADSET_TYPES)
                    adsets.append({
                        "adset_id": adset_id,
                        "campaign_id": campaign_id,
                        "client_id": c["client_id"],
                        "platform": platform,
                        "adset_name": f"{audience_type} - {random.choice(['18-34', '25-44', '35+', 'US', 'Top States'])}",
                        "audience_type": audience_type,
                        "status": random.choices(["active", "paused", "learning", "limited"], weights=[75, 12, 9, 4], k=1)[0],
                        "daily_budget": money(daily_budget / random.uniform(2.5, 5.0)),
                        "optimization_goal": random.choice(["purchases", "value", "traffic", "leads"]),
                        "targeting_summary": json.dumps({
                            "geo": random.choice(["US", "US+CA", "Top 10 states", "English-speaking"]),
                            "age": random.choice(["18-45", "21-54", "25-64"]),
                            "exclusions": random.choice(["recent_buyers_30d", "email_converters_7d", "none"])
                        })
                    })
                    aidx += 1
                cidx += 1
    return campaigns, adsets


def generate_ad_performance(adsets: List[Dict], campaigns_by_id: Dict[str, Dict], clients_by_id: Dict[str, Dict], start: datetime, days: int) -> List[Dict]:
    rows = []
    rid = 1
    for adset in adsets:
        campaign = campaigns_by_id[adset["campaign_id"]]
        client = clients_by_id[adset["client_id"]]
        base_budget = float(adset["daily_budget"])
        audience = adset["audience_type"]
        for d in range(days):
            date = start + timedelta(days=d)
            if random.random() < 0.06 or adset["status"] == "paused":
                spend = 0.0
            else:
                spend = max(0, random.gauss(base_budget, base_budget * 0.25))
            cpm = random.uniform(7, 24) if campaign["platform"] == "Meta" else random.uniform(12, 38)
            impressions = int((spend / cpm) * 1000) if spend > 0 else 0
            ctr_base = 0.008 if audience in ["Broad", "Interest"] else 0.018
            ctr = max(0.001, random.gauss(ctr_base, ctr_base * 0.35))
            clicks = int(impressions * ctr)
            cvr_base = 0.014
            if audience in ["Cart Abandoners", "Site Visitors", "Recent Buyers"]:
                cvr_base = 0.04
            elif audience in ["High LTV", "Lookalike"]:
                cvr_base = 0.025
            purchases = int(max(0, random.gauss(clicks * cvr_base, max(1, clicks * cvr_base * 0.5)))) if clicks > 0 else 0
            aov = float(client["avg_order_value"])
            revenue = purchases * max(0, random.gauss(aov, aov * 0.25))
            cpa = spend / purchases if purchases > 0 else 0
            roas = revenue / spend if spend > 0 else 0
            frequency = max(1.0, random.gauss(2.2 if audience in ["Site Visitors", "Cart Abandoners", "Recent Buyers"] else 1.3, 0.6))
            rows.append({
                "performance_id": f"PERF_{rid:012d}",
                "date": date.strftime(DATE_FMT),
                "client_id": adset["client_id"],
                "platform": campaign["platform"],
                "campaign_id": adset["campaign_id"],
                "adset_id": adset["adset_id"],
                "spend": money(spend),
                "impressions": impressions,
                "clicks": clicks,
                "add_to_cart": int(clicks * random.uniform(0.04, 0.16)),
                "purchases": purchases,
                "revenue": money(revenue),
                "cpa": money(cpa),
                "roas": pct(roas),
                "frequency": pct(frequency),
                "ctr": pct(clicks / impressions if impressions else 0),
                "cpc": money(spend / clicks if clicks else 0)
            })
            rid += 1
    return rows


def generate_audiences(clients: List[Dict], customers_by_client: Dict[str, List[Dict]], start: datetime, end: datetime) -> Tuple[List[Dict], List[Dict]]:
    segments = []
    members = []
    sid = 1
    mid = 1
    segment_templates = [
        ("Recent Buyers 30D", "Shopify", "purchased_in_last_30_days = true", "exclusion"),
        ("High LTV Customers", "Shopify", "lifetime_value > 500", "targeting"),
        ("Email Converted 7D", "Klaviyo", "clicked_email AND placed_order_7d", "exclusion"),
        ("Cart Abandoners 14D", "Klaviyo", "added_to_cart AND not_purchased_14d", "targeting"),
        ("Dormant Buyers 180D", "Shopify", "last_order_at < now() - 180d", "targeting"),
        ("Active Subscribers", "Klaviyo", "subscribed = true AND consent_email = true", "targeting"),
        ("Recent Refunds", "Shopify", "refund_created_30d = true", "exclusion"),
        ("VIP Lookalike Seed", "WasteNot", "lifetime_value > p90 AND order_count >= 3", "targeting")
    ]
    for c in clients:
        custs = customers_by_client[c["client_id"]]
        for name, source, rule, seg_type in segment_templates:
            seg_id = f"AUD_{sid:08d}"
            est_size = random.randint(max(20, len(custs) // 20), max(30, len(custs) // 2))
            segments.append({
                "audience_id": seg_id,
                "client_id": c["client_id"],
                "audience_name": name,
                "source_system": source,
                "rule_expression": rule,
                "segment_type": seg_type,
                "estimated_size": est_size,
                "destination_platforms": random.choice(["Meta", "Google", "Meta,Google"]),
                "last_synced_at": rand_ts(start, end).strftime(TS_FMT),
                "sync_status": random.choices(["synced", "pending", "failed", "partial"], weights=[84, 8, 3, 5], k=1)[0]
            })
            sample_size = min(est_size, len(custs), random.randint(50, 450))
            for cust in random.sample(custs, k=sample_size):
                members.append({
                    "membership_id": f"AUD_MEM_{mid:012d}",
                    "audience_id": seg_id,
                    "client_id": c["client_id"],
                    "customer_id": cust["customer_id"],
                    "email_hash": cust["email_hash"],
                    "membership_reason": rule,
                    "added_at": rand_ts(start, end).strftime(TS_FMT)
                })
                mid += 1
            sid += 1
    return segments, members


def generate_optimization_history(clients: List[Dict], campaigns: List[Dict], start: datetime, end: datetime) -> List[Dict]:
    by_client_campaigns = defaultdict(list)
    for campaign in campaigns:
        by_client_campaigns[campaign["client_id"]].append(campaign)
    rows = []
    oid = 1
    for c in clients:
        n = random.randint(25, 70)
        for _ in range(n):
            action = random.choice(OPT_ACTIONS)
            risk = random.choices(RISK_LEVELS, weights=[45, 40, 15], k=1)[0]
            confidence = max(0.35, min(0.97, random.gauss(0.72 if risk != "High" else 0.62, 0.12)))
            status = random.choices(STATUSES, weights=[6, 14, 48, 8, 18, 6], k=1)[0]
            campaign = random.choice(by_client_campaigns[c["client_id"]]) if by_client_campaigns[c["client_id"]] else {}
            expected = random.uniform(3, 18)
            actual = expected + random.uniform(-8, 8) if status in ["Executed", "Rolled Back"] else 0
            rows.append({
                "optimization_id": f"OPT_{oid:010d}",
                "client_id": c["client_id"],
                "created_at": rand_ts(start, end).strftime(TS_FMT),
                "agent_name": random.choice(AGENTS),
                "action_type": action,
                "target_platform": campaign.get("platform", random.choice(PLATFORMS)),
                "target_campaign_id": campaign.get("campaign_id", ""),
                "reason": f"{action} triggered by spend waste, fatigue, or cross-channel conversion overlap.",
                "expected_impact_pct": pct(expected / 100),
                "confidence_score": pct(confidence),
                "risk_level": risk,
                "status": status,
                "approved_by": random.choice(["human_ops", "auto_policy", "client_admin", ""]) if status in ["Approved", "Executed"] else "",
                "actual_impact_pct": pct(actual / 100) if status in ["Executed", "Rolled Back"] else "",
                "rollback_flag": "true" if status == "Rolled Back" else "false",
                "evidence_refs": json.dumps([f"sql:ad_performance_daily:{random.randint(1,9999)}", f"rag:benchmark:{random.randint(1,500)}"])
            })
            oid += 1
    return rows


def generate_benchmarks(n: int, start: datetime, end: datetime) -> List[Dict]:
    strategies = [
        "Exclude 30-day purchasers from retargeting",
        "Suppress Klaviyo converters from paid search",
        "Refresh fatigued retargeting audiences weekly",
        "Create VIP lookalike seed from top decile LTV",
        "Reduce spend on high-frequency low-ROAS ad sets",
        "Split cart abandoners into 1D, 7D, 14D windows",
        "Pause brand search for recent email clickers",
        "Increase budget on prospecting when MER is stable",
        "Remove recent refund customers from retargeting",
        "Use product-category exclusions for repeat buyers"
    ]
    metrics = ["CPA", "ROAS", "Wasted Spend", "Contribution Margin", "MER", "CAC"]
    rows = []
    for i in range(1, n + 1):
        cat = random.choice(CATEGORIES)
        band = random.choice(SPEND_BANDS)
        strategy = random.choice(strategies)
        lift = random.uniform(2, 18)
        rows.append({
            "benchmark_id": f"BM_{i:08d}",
            "anonymized_cohort_id": "COHORT_" + stable_hash(cat + band + strategy, 10),
            "brand_category": cat,
            "monthly_ad_spend_band": band,
            "strategy": strategy,
            "primary_metric": random.choice(metrics),
            "avg_lift_pct": pct(lift / 100),
            "median_lift_pct": pct((lift - random.uniform(-2, 2)) / 100),
            "sample_size": random.randint(8, 75),
            "confidence_score": pct(random.uniform(0.55, 0.92)),
            "privacy_level": random.choice(["aggregated_only", "k_anonymized", "internal_firewalled"]),
            "generated_at": rand_ts(start, end).strftime(TS_FMT)
        })
    return rows


def generate_recommendations(clients: List[Dict], campaigns: List[Dict], benchmarks: List[Dict], start: datetime, end: datetime) -> List[Dict]:
    by_client_campaigns = defaultdict(list)
    for campaign in campaigns:
        by_client_campaigns[campaign["client_id"]].append(campaign)
    rows = []
    rid = 1
    rec_types = ["Audience Exclusion", "Budget Shift", "Campaign Pause", "Tracking Fix", "Audience Refresh", "Benchmark Alert"]
    for c in clients:
        for _ in range(random.randint(10, 28)):
            campaign = random.choice(by_client_campaigns[c["client_id"]]) if by_client_campaigns[c["client_id"]] else {}
            bm = random.choice(benchmarks)
            rec_type = random.choice(rec_types)
            risk = random.choices(RISK_LEVELS, weights=[40, 42, 18], k=1)[0]
            confidence = random.uniform(0.52, 0.94)
            weekly_savings = random.uniform(80, 4000) * (SPEND_BANDS.index(c["monthly_ad_spend_band"]) + 1) / 2
            needs_approval = risk == "High" or confidence < 0.72 or weekly_savings > 2500
            rows.append({
                "recommendation_id": f"REC_{rid:010d}",
                "client_id": c["client_id"],
                "detected_at": rand_ts(start, end).strftime(TS_FMT),
                "recommendation_type": rec_type,
                "title": f"{rec_type}: {random.choice(OPT_ACTIONS)}",
                "target_platform": campaign.get("platform", random.choice(PLATFORMS)),
                "target_campaign_id": campaign.get("campaign_id", ""),
                "evidence_summary": "Detected elevated spend overlap, weak ROAS, audience fatigue, or benchmark-backed optimization opportunity.",
                "supporting_benchmark_id": bm["benchmark_id"],
                "expected_weekly_savings": money(weekly_savings),
                "expected_roas_lift_pct": pct(random.uniform(0.02, 0.16)),
                "confidence_score": pct(confidence),
                "risk_level": risk,
                "decision_required": "human_approval" if needs_approval else "auto_execute_allowed",
                "status": random.choices(["new", "approved", "executed", "dismissed", "needs_more_evidence"], weights=[28, 16, 30, 8, 18], k=1)[0]
            })
            rid += 1
    return rows


def generate_knowledge_graph(clients: List[Dict], campaigns: List[Dict], audiences: List[Dict], optimizations: List[Dict], benchmarks: List[Dict]) -> List[Dict]:
    rows = []
    eid = 1
    for c in clients:
        similar = [x for x in clients if x["client_id"] != c["client_id"] and x["brand_category"] == c["brand_category"] and x["monthly_ad_spend_band"] == c["monthly_ad_spend_band"]]
        for other in random.sample(similar, k=min(len(similar), random.randint(1, 4))):
            rows.append({
                "edge_id": f"KG_{eid:012d}", "source_node_type": "Client", "source_node_id": c["client_id"],
                "relationship": "similar_to", "target_node_type": "Client", "target_node_id": other["client_id"],
                "weight": pct(random.uniform(0.55, 0.95)), "evidence_count": random.randint(3, 25),
                "last_updated_at": datetime.now(timezone.utc).strftime(TS_FMT)
            })
            eid += 1
    for campaign in random.sample(campaigns, k=min(len(campaigns), 1200)):
        rows.append({
            "edge_id": f"KG_{eid:012d}", "source_node_type": "Client", "source_node_id": campaign["client_id"],
            "relationship": "owns_campaign", "target_node_type": "Campaign", "target_node_id": campaign["campaign_id"],
            "weight": pct(1.0), "evidence_count": 1, "last_updated_at": datetime.now(timezone.utc).strftime(TS_FMT)
        })
        eid += 1
    for aud in random.sample(audiences, k=min(len(audiences), 900)):
        rows.append({
            "edge_id": f"KG_{eid:012d}", "source_node_type": "Client", "source_node_id": aud["client_id"],
            "relationship": "uses_audience", "target_node_type": "Audience", "target_node_id": aud["audience_id"],
            "weight": pct(random.uniform(0.5, 1.0)), "evidence_count": random.randint(1, 10),
            "last_updated_at": datetime.now(timezone.utc).strftime(TS_FMT)
        })
        eid += 1
    for opt in random.sample(optimizations, k=min(len(optimizations), 1500)):
        bm = random.choice(benchmarks)
        rows.append({
            "edge_id": f"KG_{eid:012d}", "source_node_type": "Optimization", "source_node_id": opt["optimization_id"],
            "relationship": "supported_by_benchmark", "target_node_type": "Benchmark", "target_node_id": bm["benchmark_id"],
            "weight": opt["confidence_score"], "evidence_count": random.randint(2, 18),
            "last_updated_at": datetime.now(timezone.utc).strftime(TS_FMT)
        })
        eid += 1
    return rows


def generate_rag_documents(clients: List[Dict], campaigns: List[Dict], optimizations: List[Dict], benchmarks: List[Dict], recommendations: List[Dict], start: datetime, end: datetime) -> List[Dict]:
    rows = []
    did = 1
    for c in clients:
        rows.append({
            "doc_id": f"DOC_{did:010d}",
            "client_id": c["client_id"],
            "doc_type": "client_profile_summary",
            "source_table": "clients",
            "source_record_id": c["client_id"],
            "chunk_id": 0,
            "embedding_group": "client_context",
            "text": f"Client {c['client_id']} is a {c['brand_category']} eCommerce brand in spend band {c['monthly_ad_spend_band']} with AOV {c['avg_order_value']} and gross margin {c['gross_margin_pct']}. Use this profile for similarity matching and recommendation risk calibration.",
            "updated_at": rand_ts(start, end).strftime(TS_FMT)
        })
        did += 1
    for campaign in random.sample(campaigns, k=min(700, len(campaigns))):
        rows.append({
            "doc_id": f"DOC_{did:010d}",
            "client_id": campaign["client_id"],
            "doc_type": "campaign_setting_summary",
            "source_table": "ad_campaign_settings",
            "source_record_id": campaign["campaign_id"],
            "chunk_id": 0,
            "embedding_group": "campaign_context",
            "text": f"{campaign['platform']} campaign {campaign['campaign_name']} uses objective {campaign['objective']}, status {campaign['status']}, budget {campaign['daily_budget']}, bid strategy {campaign['bid_strategy']}, and attribution window {campaign['attribution_window']}.",
            "updated_at": rand_ts(start, end).strftime(TS_FMT)
        })
        did += 1
    for opt in random.sample(optimizations, k=min(1000, len(optimizations))):
        rows.append({
            "doc_id": f"DOC_{did:010d}",
            "client_id": opt["client_id"],
            "doc_type": "optimization_decision_log",
            "source_table": "optimization_history",
            "source_record_id": opt["optimization_id"],
            "chunk_id": 0,
            "embedding_group": "decision_history",
            "text": f"Optimization {opt['optimization_id']} performed action {opt['action_type']} on {opt['target_platform']} because {opt['reason']} Expected impact was {opt['expected_impact_pct']} with confidence {opt['confidence_score']}; status is {opt['status']}.",
            "updated_at": opt["created_at"]
        })
        did += 1
    for bm in random.sample(benchmarks, k=min(500, len(benchmarks))):
        rows.append({
            "doc_id": f"DOC_{did:010d}",
            "client_id": "GLOBAL_AGGREGATED",
            "doc_type": "cross_client_benchmark_summary",
            "source_table": "cross_client_benchmarks",
            "source_record_id": bm["benchmark_id"],
            "chunk_id": 0,
            "embedding_group": "benchmark_context",
            "text": f"For {bm['brand_category']} brands in spend band {bm['monthly_ad_spend_band']}, strategy '{bm['strategy']}' showed average lift {bm['avg_lift_pct']} on {bm['primary_metric']} across sample size {bm['sample_size']} with confidence {bm['confidence_score']}.",
            "updated_at": bm["generated_at"]
        })
        did += 1
    for rec in random.sample(recommendations, k=min(700, len(recommendations))):
        rows.append({
            "doc_id": f"DOC_{did:010d}",
            "client_id": rec["client_id"],
            "doc_type": "recommendation_summary",
            "source_table": "recommendation_records",
            "source_record_id": rec["recommendation_id"],
            "chunk_id": 0,
            "embedding_group": "recommendation_context",
            "text": f"Recommendation {rec['recommendation_id']} is {rec['title']} for {rec['target_platform']} campaign {rec['target_campaign_id']}. Evidence: {rec['evidence_summary']} Confidence {rec['confidence_score']}, risk {rec['risk_level']}, decision path {rec['decision_required']}.",
            "updated_at": rec["detected_at"]
        })
        did += 1
    return rows


def generate_schema_versions(start: datetime, end: datetime) -> List[Dict]:
    source_tables = [
        ("Shopify", "orders"), ("Shopify", "customers"), ("Klaviyo", "events"),
        ("Meta", "campaigns"), ("Meta", "adsets"), ("Google", "campaigns"),
        ("WasteNot", "audience_segments"), ("WasteNot", "optimization_history"),
        ("WasteNot", "recommendation_records"), ("Snowflake", "client_marts")
    ]
    drift_types = ["none", "added_column", "type_change", "renamed_field", "enum_expansion"]
    rows = []
    for i, (src, table) in enumerate(source_tables, 1):
        drift = random.choices(drift_types, weights=[65, 14, 7, 5, 9], k=1)[0]
        rows.append({
            "schema_event_id": f"SCHEMA_{i:06d}",
            "source_system": src,
            "table_name": table,
            "schema_version": f"v{random.randint(1,4)}.{random.randint(0,9)}",
            "detected_at": rand_ts(start, end).strftime(TS_FMT),
            "drift_type": drift,
            "added_columns": json.dumps(random.sample(["consent_ads", "currency", "attribution_model", "source_event_id"], k=random.randint(0, 2))) if drift == "added_column" else "[]",
            "removed_columns": "[]",
            "action_taken": random.choice(["accepted", "quarantined", "mapped_to_canonical", "alerted_data_scout"]),
            "status": random.choice(["resolved", "monitoring", "needs_review"])
        })
    return rows


def write_readme(out: Path, counts: Dict[str, int]) -> None:
    readme = f"""# WasteNot Synthetic Data Package

This folder contains synthetic CSV data for a WasteNot-style always-on multi-agent RAG intelligence layer. It is designed for architecture demos, dashboards, data modeling, and take-home project artifacts.

## What is included

| File | Rows | Purpose |
|---|---:|---|
| clients.csv | {counts.get('clients.csv', 0):,} | Client/brand account metadata and ad platform account IDs |
| products.csv | {counts.get('products.csv', 0):,} | Shopify-like product catalog |
| customers.csv | {counts.get('customers.csv', 0):,} | Customer identity layer with hashed emails and consent flags |
| shopify_orders.csv | {counts.get('shopify_orders.csv', 0):,} | Shopify order facts |
| shopify_order_items.csv | {counts.get('shopify_order_items.csv', 0):,} | Line-item order details |
| klaviyo_events.csv | {counts.get('klaviyo_events.csv', 0):,} | Email/SMS/profile events |
| ad_campaign_settings.csv | {counts.get('ad_campaign_settings.csv', 0):,} | Meta/Google campaign configuration |
| ad_adsets.csv | {counts.get('ad_adsets.csv', 0):,} | Ad set level targeting and budgets |
| ad_performance_daily.csv | {counts.get('ad_performance_daily.csv', 0):,} | Daily spend, clicks, purchases, ROAS, CPA, frequency |
| audience_segments.csv | {counts.get('audience_segments.csv', 0):,} | WasteNot-built targeting and exclusion audiences |
| audience_memberships.csv | {counts.get('audience_memberships.csv', 0):,} | Hashed customer membership in audiences |
| optimization_history.csv | {counts.get('optimization_history.csv', 0):,} | Past recommendations/actions and outcomes |
| cross_client_benchmarks.csv | {counts.get('cross_client_benchmarks.csv', 0):,} | Aggregated anonymized benchmarks for network effects |
| recommendation_records.csv | {counts.get('recommendation_records.csv', 0):,} | Recommendations generated by the intelligence layer |
| knowledge_graph_edges.csv | {counts.get('knowledge_graph_edges.csv', 0):,} | Graph edges for client/campaign/audience/benchmark similarity |
| rag_documents.csv | {counts.get('rag_documents.csv', 0):,} | Text chunks that could be embedded for RAG retrieval |
| schema_versions.csv | {counts.get('schema_versions.csv', 0):,} | Schema drift and data contract monitoring events |
| manifest.json | 1 | Generation parameters and row counts |

## Regenerate data

From the package root:

```bash
python generate_wastenot_synthetic_data.py --output-dir ./wastenot_synthetic_sample_data --clients 60 --customers-per-client 800 --days 90 --seed 42
```

Smaller demo:

```bash
python generate_wastenot_synthetic_data.py --output-dir ./demo_data --clients 10 --customers-per-client 200 --days 30 --seed 7
```

Larger demo:

```bash
python generate_wastenot_synthetic_data.py --output-dir ./large_data --clients 100 --customers-per-client 1500 --days 180 --seed 99
```

## Notes

- This is fully synthetic. No real customer PII is included.
- `email_hash` is a deterministic fake hash and can be used to join Shopify, Klaviyo, audience, and customer tables.
- Raw structured metrics stay in CSV/SQL-like tables. `rag_documents.csv` contains textual summaries suitable for embeddings.
- `cross_client_benchmarks.csv` represents aggregated patterns only, not raw client-level data.
"""
    (out / "README.md").write_text(readme, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate WasteNot synthetic data CSVs.")
    parser.add_argument("--output-dir", default="wastenot_synthetic_sample_data", help="Directory to write generated CSVs.")
    parser.add_argument("--clients", type=int, default=60, help="Number of clients/brands to generate.")
    parser.add_argument("--customers-per-client", type=int, default=800, help="Customers per client.")
    parser.add_argument("--products-per-client", type=int, default=15, help="Products per client.")
    parser.add_argument("--days", type=int, default=90, help="Daily ad performance window in days.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducible output.")
    args = parser.parse_args()

    random.seed(args.seed)
    out = Path(args.output_dir).resolve()
    ensure_clean_dir(out)

    end = datetime(2026, 6, 8, 23, 59, 59)
    start = end - timedelta(days=args.days - 1)

    clients = generate_clients(args.clients, start, end)
    products = generate_products(clients, args.products_per_client)
    products_by_client = defaultdict(list)
    for p in products:
        products_by_client[p["client_id"]].append(p)

    customers, customers_by_client = generate_customers(clients, args.customers_per_client, start, end)
    orders, order_items = generate_orders_and_items(clients, customers_by_client, products_by_client, start, end, args.days)
    klaviyo_events = generate_klaviyo_events(clients, customers_by_client, start, end)
    campaigns, adsets = generate_campaigns_and_adsets(clients, start)
    campaigns_by_id = {c["campaign_id"]: c for c in campaigns}
    clients_by_id = {c["client_id"]: c for c in clients}
    ad_perf = generate_ad_performance(adsets, campaigns_by_id, clients_by_id, start, args.days)
    audiences, members = generate_audiences(clients, customers_by_client, start, end)
    optimizations = generate_optimization_history(clients, campaigns, start, end)
    benchmarks = generate_benchmarks(max(250, args.clients * 5), start, end)
    recommendations = generate_recommendations(clients, campaigns, benchmarks, start, end)
    kg_edges = generate_knowledge_graph(clients, campaigns, audiences, optimizations, benchmarks)
    rag_docs = generate_rag_documents(clients, campaigns, optimizations, benchmarks, recommendations, start, end)
    schema_versions = generate_schema_versions(start, end)

    files = [
        ("clients.csv", clients),
        ("products.csv", products),
        ("customers.csv", customers),
        ("shopify_orders.csv", orders),
        ("shopify_order_items.csv", order_items),
        ("klaviyo_events.csv", klaviyo_events),
        ("ad_campaign_settings.csv", campaigns),
        ("ad_adsets.csv", adsets),
        ("ad_performance_daily.csv", ad_perf),
        ("audience_segments.csv", audiences),
        ("audience_memberships.csv", members),
        ("optimization_history.csv", optimizations),
        ("cross_client_benchmarks.csv", benchmarks),
        ("recommendation_records.csv", recommendations),
        ("knowledge_graph_edges.csv", kg_edges),
        ("rag_documents.csv", rag_docs),
        ("schema_versions.csv", schema_versions),
    ]

    counts: Dict[str, int] = {}
    for filename, rows in files:
        if not rows:
            continue
        fieldnames = list(rows[0].keys())
        counts[filename] = write_csv(out / filename, fieldnames, rows)

    manifest = {
        "generated_at_utc": datetime.now(timezone.utc).strftime(TS_FMT),
        "seed": args.seed,
        "clients": args.clients,
        "customers_per_client": args.customers_per_client,
        "products_per_client": args.products_per_client,
        "days": args.days,
        "date_start": start.strftime(DATE_FMT),
        "date_end": end.strftime(DATE_FMT),
        "row_counts": counts
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    write_readme(out, counts)

    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
