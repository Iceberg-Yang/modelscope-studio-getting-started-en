from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd
import streamlit as st


st.set_page_config(
    page_title="Studio Operations Dashboard",
    layout="wide",
)


SDK_TYPES = ["Gradio", "Streamlit", "Static", "Docker"]
STATUS_LIST = ["Running", "Building", "Dormant", "Failed"]
SOURCES = ["Community Home", "Model Detail Page", "Docs Tutorial", "External Share", "Profile Page"]


@st.cache_data
def build_mock_data() -> pd.DataFrame:
    base_time = datetime(2026, 6, 30, 9, 0)
    studios = [
        ("image-caption-demo", "Gradio", "Running", "community"),
        ("studio-ops-dashboard", "Streamlit", "Running", "tutorial"),
        ("missing-model-case", "Static", "Running", "community"),
        ("agent-service-lab", "Docker", "Failed", "private"),
        ("voice-note-helper", "Gradio", "Dormant", "community"),
        ("model-eval-board", "Streamlit", "Running", "private"),
        ("portfolio-static-page", "Static", "Dormant", "tutorial"),
        ("fastapi-rag-agent", "Docker", "Building", "private"),
    ]

    rows = []
    for hour in range(72):
        timestamp = base_time - timedelta(hours=71 - hour)
        for studio_index, (name, sdk, base_status, visibility) in enumerate(studios):
            traffic_base = {
                "Gradio": 38,
                "Streamlit": 26,
                "Static": 44,
                "Docker": 18,
            }[sdk]
            daily_wave = 1 + ((hour % 24) / 36)
            launch_boost = 1.6 if 48 <= hour <= 58 and visibility == "community" else 1
            status = base_status
            if sdk == "Docker" and hour % 19 == 0:
                status = "Failed"
            elif base_status == "Dormant" and hour % 9 in {0, 1}:
                status = "Running"

            visits = int((traffic_base + studio_index * 3) * daily_wave * launch_boost)
            if status == "Dormant":
                visits = max(2, visits // 5)
            if status == "Failed":
                visits = max(1, visits // 4)

            error_rate = {
                "Running": 0.018,
                "Building": 0.08,
                "Dormant": 0.012,
                "Failed": 0.34,
            }[status]
            latency = {
                "Gradio": 720,
                "Streamlit": 540,
                "Static": 110,
                "Docker": 1180,
            }[sdk]
            if status == "Failed":
                latency += 900
            if status == "Building":
                latency += 420

            cost = visits * {
                "Gradio": 0.0024,
                "Streamlit": 0.0018,
                "Static": 0.0002,
                "Docker": 0.0056,
            }[sdk]

            rows.append(
                {
                    "time": timestamp,
                    "date": timestamp.date(),
                    "studio": name,
                    "sdk": sdk,
                    "status": status,
                    "visibility": visibility,
                    "source": SOURCES[(hour + studio_index) % len(SOURCES)],
                    "visits": visits,
                    "errors": round(visits * error_rate),
                    "avg_latency_ms": latency + (hour % 7) * 23,
                    "cost": round(cost, 3),
                }
            )

    return pd.DataFrame(rows)


def format_rate(value: float) -> str:
    return f"{value:.1%}"


def status_badge(status: str) -> str:
    styles = {
        "Running": "background:#e8f7ef;color:#12633a;",
        "Building": "background:#fff7df;color:#7a4b00;",
        "Dormant": "background:#eef2f7;color:#49566a;",
        "Failed": "background:#fdecec;color:#9f1d2c;",
    }
    return f"<span style='padding:4px 8px;border-radius:999px;font-size:12px;font-weight:700;{styles[status]}'>{status}</span>"


data = build_mock_data()

st.title("Studio Operations Dashboard")
st.caption("A lightweight Streamlit dashboard for filtering, analyzing, and presenting Studio operations data. The data is simulated for tutorial use.")

with st.sidebar:
    st.header("Filters")
    selected_sdk = st.multiselect("SDK type", SDK_TYPES, default=SDK_TYPES)
    selected_status = st.multiselect("Runtime status", STATUS_LIST, default=STATUS_LIST)
    selected_source = st.multiselect("Traffic source", SOURCES, default=SOURCES)
    hours = st.slider("Observation window (hours)", min_value=12, max_value=72, value=48, step=12)
    only_abnormal = st.checkbox("Show anomalies only", value=False)

start_time = data["time"].max() - timedelta(hours=hours)
filtered = data[
    (data["time"] >= start_time)
    & (data["sdk"].isin(selected_sdk))
    & (data["status"].isin(selected_status))
    & (data["source"].isin(selected_source))
].copy()

if only_abnormal:
    filtered = filtered[(filtered["status"].isin(["Failed", "Building"])) | (filtered["errors"] > 0)]

total_visits = int(filtered["visits"].sum())
total_errors = int(filtered["errors"].sum())
error_rate = total_errors / total_visits if total_visits else 0
avg_latency = int(filtered["avg_latency_ms"].mean()) if not filtered.empty else 0
total_cost = filtered["cost"].sum()
running_count = filtered.loc[filtered["status"] == "Running", "studio"].nunique()

metric_cols = st.columns(5)
metric_cols[0].metric("Total visits", f"{total_visits:,}")
metric_cols[1].metric("Running Studios", running_count)
metric_cols[2].metric("Average latency", f"{avg_latency} ms")
metric_cols[3].metric("Error rate", format_rate(error_rate))
metric_cols[4].metric("Estimated cost", f"${total_cost:.2f}")

st.divider()

left, right = st.columns([1.55, 1])

with left:
    st.subheader("Visit trend")
    trend = (
        filtered.groupby("time", as_index=False)["visits"]
        .sum()
        .set_index("time")
        .sort_index()
    )
    st.line_chart(trend, height=280)

with right:
    st.subheader("Runtime status distribution")
    status_summary = (
        filtered.groupby("status", as_index=False)["studio"]
        .nunique()
        .rename(columns={"studio": "studio_count"})
        .set_index("status")
    )
    st.bar_chart(status_summary, height=280)

col_a, col_b = st.columns(2)

with col_a:
    st.subheader("Visits by SDK type")
    sdk_summary = (
        filtered.groupby("sdk", as_index=False)["visits"]
        .sum()
        .sort_values("visits", ascending=False)
        .set_index("sdk")
    )
    st.bar_chart(sdk_summary, height=260)

with col_b:
    st.subheader("Average latency by SDK")
    latency_summary = (
        filtered.groupby("sdk", as_index=False)["avg_latency_ms"]
        .mean()
        .round(0)
        .sort_values("avg_latency_ms", ascending=False)
        .set_index("sdk")
    )
    st.bar_chart(latency_summary, height=260)

st.subheader("Anomalous Studios")
abnormal = (
    filtered[(filtered["status"].isin(["Failed", "Building"])) | (filtered["errors"] > 0)]
    .sort_values(["status", "errors", "avg_latency_ms"], ascending=[True, False, False])
    .head(12)
    .copy()
)

if abnormal.empty:
    st.success("No obvious anomalies under the current filters.")
else:
    table = abnormal[
        ["time", "studio", "sdk", "status", "source", "visits", "errors", "avg_latency_ms", "cost"]
    ].copy()
    table["time"] = table["time"].dt.strftime("%m-%d %H:%M")
    table["status"] = table["status"].map(status_badge)
    st.write(table.to_html(escape=False, index=False), unsafe_allow_html=True)

st.subheader("Generated insights")

insights = []
if not filtered.empty:
    top_sdk = sdk_summary["visits"].idxmax() if not sdk_summary.empty else "N/A"
    slow_sdk = latency_summary["avg_latency_ms"].idxmax() if not latency_summary.empty else "N/A"
    if total_visits:
        insights.append(f"{top_sdk} Studios contributed the most visits in the selected window and are good candidates for featured entry points.")
    if slow_sdk != "N/A":
        insights.append(f"{slow_sdk} has the highest average latency. Check deployment logs, dependency loading, and resource configuration first.")
    dormant_count = filtered.loc[filtered["status"] == "Dormant", "studio"].nunique()
    if dormant_count:
        insights.append(f"{dormant_count} Studio(s) are Dormant, which indicates on-demand sleep behavior for free CPU resources.")
    if error_rate > 0.08:
        insights.append("The current error rate is relatively high. Prioritize Studios in Failed or Building status.")
    else:
        insights.append("The overall error rate is low, and the selected Studios look stable.")
else:
    insights.append("No data is available under the current filters. Try relaxing the filters.")

for item in insights:
    st.info(item)
