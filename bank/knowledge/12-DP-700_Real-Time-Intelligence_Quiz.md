# DP-700 Practice Quiz — Get Started with Real-Time Intelligence in Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/get-started-kusto-fabric/
Units covered: What is real-time data analytics? | Real-Time Intelligence in Microsoft Fabric | Ingest and transform real-time data | Store and query real-time data | Visualize real-time data | Automate actions

DP-700 domains: **Ingest and transform streaming data** (Choose an appropriate streaming engine; Process data by using Eventstreams; Process data by using KQL) | **Implement and manage** (Configure alerts — via Activator)

---

## Section A — Multiple Choice

**1.** What is the defining characteristic of an "event" in real-time analytics?
A. A scheduled batch job
B. A record of something that happened, changed, or was completed at a specific moment
C. A static snapshot of historical data
D. A stored function in KQL

**2.** What is a "stream" in real-time analytics?
A. A single isolated event
B. A sequence of events, typically ordered by the time they occurred
C. A materialized view
D. A batch export job

**3.** Why is real-time analytics sometimes called "near real-time" analytics?
A. Because it only works with historical data
B. Because there's always some degree of processing and network latency involved
C. Because it only updates once per day
D. Because it doesn't use events at all

**4.** Which Real-Time Intelligence component is responsible for ingesting streaming data and applying real-time transformations before routing it to a destination?
A. Eventhouse
B. Eventstream
C. Real-Time Dashboard
D. Activator

**5.** Which Real-Time Intelligence component stores data in KQL databases optimized for time-series data and fast ingestion?
A. Eventstream
B. Eventhouse
C. Real-Time hub
D. Activator

**6.** What is the Real-Time hub best described as?
A. A visualization tool for building charts
B. A central location to discover, manage, and subscribe to data-in-motion across the organization
C. A KQL query editor
D. A Spark notebook environment

**7.** Which categories does the Real-Time hub organize data-in-motion into?
A. Bronze, Silver, Gold
B. Data sources, Azure sources, Fabric events, Azure events
C. Tables, Files, Shortcuts
D. Sources, Transformations, Destinations only

**8.** What are the three main components of an Eventstream?
A. Tables, Views, Functions
B. Sources, transformations, destinations
C. Events, Objects, Properties
D. Bronze, Silver, Gold layers

**9.** Which of these is **NOT** a valid eventstream destination, according to the module?
A. A KQL database in an Eventhouse
B. A Lakehouse
C. Fabric Activator
D. An on-premises SQL Server (direct write)

**10.** What is the key difference between eventstream transformations and KQL database update policies?
A. There is no difference; they're the same mechanism
B. Eventstream transformations happen during stream processing before reaching a destination; update policies transform data after it has already landed in a KQL database table
C. Update policies happen before ingestion; eventstream transformations happen after
D. Eventstream transformations only work with T-SQL

**11.** In a KQL Queryset, which query languages are supported?
A. Only KQL
B. Only PySpark
C. KQL and a subset of T-SQL
D. Only Python

**12.** Within an Eventhouse, what can a KQL database host besides tables?
A. Only raw files
B. Stored functions, materialized views, shortcuts, and data streams
C. Power BI reports only
D. Spark job definitions

**13.** In a Real-Time Dashboard, what does each "tile" represent?
A. A separate Eventhouse
B. A visualization based on a KQL query expression run against eventhouse tables
C. A single raw event record
D. A workspace role assignment

**14.** What is the default visualization type shown in a Real-Time Dashboard tile before you customize it?
A. A line chart
B. A table
C. A bar chart
D. A map

---

## Section B — True / False

**15.** Data can be ingested directly into a KQL database in an Eventhouse without going through an Eventstream. **(True/False)**

**16.** Activator can only send email notifications — it cannot trigger Power Automate workflows, pipelines, or notebooks. **(True/False)**

**17.** In Activator, "Objects" represent business entities (like a sales order or sensor) that event data is used to describe. **(True/False)**

**18.** Real-Time Dashboards must be created directly from within an Eventhouse and cannot be created independently in a workspace. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**19.** You want to alert a maintenance manager by email whenever a sensor's temperature reading exceeds a defined threshold, automatically, as new data streams in. Which Fabric component should you use to build this rule?
A. Real-Time Dashboard
B. Activator
C. KQL Queryset
D. Eventstream transformation only

**20.** Your data lands directly in a KQL database table in an Eventhouse (not via Eventstream), but you need it automatically transformed and saved into a separate destination table every time new data arrives. What should you configure?
A. An Eventstream transformation
B. An update policy
C. A Real-Time Dashboard tile
D. A workspace role

---

## Answer Key & Rationale

**1. B — A record of something that happened, changed, or was completed at a specific moment.** Events are the digital records or log entries that document activity — website clicks, stock price changes, sensor readings, and so on.

**2. B — A sequence of events, typically ordered by the time they occurred.** A stream is the delivery mechanism that carries events continuously from where they happen to where they're processed, analyzed, or acted upon.

**3. B — Because there's always some degree of processing and network latency involved.** True instantaneous analytics doesn't exist — there's always some lag, which is why the "near" qualifier is used.

**4. B — Eventstream.** Eventstreams capture streaming data from sources, apply real-time transformations (filter, enrich, reshape), and route the results to a destination.

**5. B — Eventhouse.** Eventhouses store data in KQL databases specifically designed for time-series data and fast ingestion of streaming data, integrated with OneLake.

**6. B — A central location to discover, manage, and subscribe to data-in-motion across the organization.** Think of it as your organization's streaming data catalog — a way to see what's happening in near real-time across systems.

**7. B — Data sources, Azure sources, Fabric events, Azure events.** These are the explicit categories the Real-Time hub organizes streaming data into, each covering a different origin type.

**8. B — Sources, transformations, destinations.** The module uses a water pipe analogy: source is the faucet, transformations are filters along the way, and the destination is the sink or bucket collecting the result.

**9. D — An on-premises SQL Server (direct write).** The valid destinations listed are a KQL database in an Eventhouse, a Lakehouse, a derived stream, Fabric Activator, or a custom endpoint — direct writes to an on-prem SQL Server aren't among them.

**10. B — Eventstream transformations happen during stream processing before reaching a destination; update policies transform data after it has already landed in a KQL database table.** This is the explicit distinction the module draws — two different points in the pipeline where transformation logic can live.

**11. C — KQL and a subset of T-SQL.** The KQL Queryset supports both, letting SQL-familiar users query alongside KQL users using the syntax they're comfortable with.

**12. B — Stored functions, materialized views, shortcuts, and data streams.** A KQL database is a collection of all of these, not just tables — this ties back to your earlier Eventhouse/KQL module.

**13. B — A visualization based on a KQL query expression run against eventhouse tables.** Each tile pulls its content from a KQL query, and dashboards are built by pinning multiple tiles together into one view.

**14. B — A table.** By default, a tile shows query results as a table; you then edit it to customize the visualization type (chart, map, etc.) as needed.

**15. True.** The module explicitly describes two ingestion approaches: through an Eventstream, or direct ingestion into a KQL database using connectors or the "Get data" option — no Eventstream required for the second path.

**16. False.** Activator can send notifications, but it can also trigger Power Automate workflows, execute Fabric data pipelines, or run notebooks — a broader set of automated actions, not just email.

**17. True.** Objects represent business entities like a sales order or a sensor, built from the data in an event record — one of Activator's four core concepts alongside Events, Properties, and Rules.

**18. False.** Real-Time Dashboards can be created in a workspace and then configured with a source, *or* created directly from a KQL queryset in an Eventhouse — both paths are valid.

**19. B — Activator.** This matches the module's own example almost exactly — a rule that triggers an email alert when a sensor's temperature exceeds a threshold. Activator's Events/Objects/Properties/Rules model is purpose-built for this kind of condition-based automated response.

**20. B — An update policy.** Since the data lands directly in the KQL database (bypassing Eventstream), the transformation has to happen *after* ingestion — which is exactly what update policies do: trigger automatically when new data is written and save the transformed result to a destination table.

---

**Score guide:** 18–20 correct = strong grasp, ready to move to the next module. 14–17 = solid but review the Eventstream transformations vs. update policies distinction and valid eventstream destinations. Below 14 = re-read units 2–4c before moving on.
