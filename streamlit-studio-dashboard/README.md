---
title: Studio Operations Dashboard
sdk: streamlit
app_file: app.py
---

# Studio Operations Dashboard

This is a Streamlit example for the ModelScope Studios getting-started tutorial. It uses built-in mock data to visualize visits, latency, error rate, and estimated resource cost across several Studio types and runtime states.

The example demonstrates why Streamlit is a good fit for dashboards and data analysis apps: use sidebar filters to narrow the data, metric cards to summarize the current state, charts to compare trends, tables to locate anomalies, and short text insights to explain what changed.

## Features

1. Simulate operations data for Gradio, Streamlit, Static, and Docker Studios.
2. Filter by SDK type, runtime status, traffic source, and observation window.
3. Display total visits, running Studio count, average latency, error rate, and estimated cost.
4. Show visit trends, status distribution, SDK traffic, and latency comparison.
5. List anomalous Studios and generate concise insights.

## File Structure

```text
streamlit-studio-dashboard/
├── app.py
├── README.md
└── requirements.txt
```

## Run Locally

```bash
pip install -r requirements.txt
streamlit run app.py
```

## Deploy to ModelScope Studio

Create a Streamlit Studio and upload `app.py`, `README.md`, and `requirements.txt`. In Deployment settings, select Streamlit, Free CPU, and the recommended Environment. This example does not require an API token or any external service.
