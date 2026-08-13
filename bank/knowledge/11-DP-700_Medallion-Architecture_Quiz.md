# DP-700 Practice Quiz — Organize a Fabric Lakehouse Using Medallion Architecture Design

Source module: https://learn.microsoft.com/en-us/training/modules/describe-medallion-architecture/
Units covered: Describe medallion architecture | Plan a medallion architecture in Fabric | Query and report on data in your Fabric lakehouse | Secure and govern your medallion lakehouse

DP-700 domains: **Ingest and transform data** (Prepare data for a dimensional model; Denormalize data; Group and aggregate data) | **Implement and manage** (Configure security and governance — item/workspace/OneLake access controls)

---

## Section A — Multiple Choice

**1.** What is the primary purpose of the bronze layer in a medallion architecture?
A. To model data as a star schema for reporting
B. To serve as the raw landing zone for data, unmodified from the source
C. To apply row-level security
D. To store only aggregated summary data

**2.** Which layer is typically modeled as a star schema for business consumption?
A. Bronze
B. Silver
C. Gold
D. Landing zone

**3.** What kind of activities are typical in the silver layer?
A. Raw ingestion only, with no changes
B. Combining/merging sources and enforcing data quality (removing nulls, deduplication)
C. Building Power BI reports directly
D. Assigning workspace roles

**4.** Why is bronze layer data kept in its original, unmodified format?
A. To reduce storage costs
B. So you can reprocess from bronze if a downstream transformation goes wrong, without returning to the source system
C. Because Fabric doesn't allow transformation of raw files
D. To comply with GDPR automatically

**5.** Is the three-layer bronze/silver/gold pattern a strict, fixed requirement?
A. Yes, exactly three layers must always be used
B. No — it's a starting point; you can add layers like a landing zone or domain-specific layers as needed
C. No, only two layers are ever needed
D. Yes, and the layer names must be bronze/silver/gold exactly

**6.** When structuring a lakehouse for medallion architecture, what does using a single lakehouse with schemas (bronze/silver/gold) offer compared to separate lakehouses/workspaces?
A. Stronger regulatory isolation
B. Simpler management, better suited to smaller teams or early-stage projects
C. The ability to assign different capacities per layer
D. Mandatory compliance certification

**7.** Which approach provides the strongest isolation between medallion layers, appropriate for regulatory or compliance scenarios?
A. Single lakehouse with schemas
B. Separate lakehouses only
C. Separate workspaces per layer
D. OneLake shortcuts

**8.** If your source data already lives in cloud storage like OneLake, ADLS Gen2, Amazon S3, or Google Cloud Storage, what's the recommended way to bring it into the bronze layer?
A. Always write a custom pipeline
B. Use a OneLake shortcut to reference it without copying
C. Manually download and re-upload the files
D. Convert it to Delta format before ingestion

**9.** Which silver-layer transformation tool lets you write a SQL query that Fabric automatically keeps up to date — updating only changed rows as new bronze data arrives — without scheduling anything?
A. Dataflows Gen2
B. A materialized lake view
C. A regular SQL view
D. Power BI semantic model

**10.** What is the key difference between a materialized lake view and a regular SQL view?
A. A regular view saves results as a real table; a materialized lake view reruns its query every time
B. A materialized lake view saves the results as a real table and updates incrementally; a regular view reruns its query every time it's queried
C. There is no functional difference between them
D. Materialized lake views only work on the gold layer

**11.** What is the tradeoff of using a materialized lake view for a silver-layer transformation?
A. It cannot handle deduplication
B. The transformation must be expressible as SQL; Python logic requires a notebook instead
C. It only works with unstructured data
D. It requires a separate workspace

**12.** Which silver/gold transformation tool is best suited for large datasets, complex logic, custom calculations, or API calls that a dataflow can't handle?
A. Notebooks
B. Dataflows Gen2
C. Materialized lake views only
D. SQL analytics endpoint

**13.** How does a data science team's gold layer commonly differ in shape from a finance team's gold layer, even when built from the same silver data?
A. They can't differ — gold layer shape is fixed once defined
B. A data science team might want a flat, wide table for feature engineering, while finance might want pre-aggregated summaries
C. Data science teams cannot access the gold layer
D. Finance teams always require a star schema, and data science teams never do

**14.** Besides a lakehouse, what other Fabric item can serve as the gold layer for teams that primarily work in SQL?
A. An Eventhouse
B. A Fabric Data Warehouse
C. A KQL database
D. A Dataflow Gen1

---

## Section B — True / False

**15.** The SQL analytics endpoint operates in read-only mode over lakehouse Delta tables. **(True/False)**

**16.** Power BI semantic models connecting to the gold layer via Direct Lake mode require a separate manual refresh step to show current data. **(True/False)**

**17.** Every Fabric lakehouse comes with a built-in `DefaultReader` role that grants all ReadAll users access to all data by default. **(True/False)**

**18.** OneLake data access roles require putting each medallion layer in a separate workspace in order to function. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**19.** Your organization shares a single workspace across teams, but you need gold layer consumers to query gold tables while being blocked from seeing bronze or silver data — without creating separate workspaces. What should you configure?
A. Workspace-level Admin role for gold consumers
B. A OneLake data access role scoped to the gold tables/folders
C. A materialized lake view
D. A deployment pipeline

**20.** A transformation change to your silver layer notebook accidentally corrupts downstream data, and you need to quickly revert to the previous known-good version of that notebook. What Fabric capability directly supports this recovery scenario?
A. OneLake shortcuts
B. Git integration, allowing you to revert to a previous commit
C. The DefaultReader role
D. A Power BI semantic model

---

## Answer Key & Rationale

**1. B — To serve as the raw landing zone for data, unmodified from the source.** Bronze stores structured, semi-structured, or unstructured data exactly as it arrives — no changes, no cleanup, intentionally.

**2. C — Gold.** Gold is where data is modeled for business use, typically as a star schema with facts and dimensions, ready for reports, models, and dashboards.

**3. B — Combining/merging sources and enforcing data quality (removing nulls, deduplication).** Silver focuses on validation and refinement — standardizing formats, deduplicating, and joining bronze sources into one consistent, integrated dataset.

**4. B — So you can reprocess from bronze if a downstream transformation goes wrong, without returning to the source system.** Keeping bronze raw and untouched is a deliberate safety net — it's your recovery point if something breaks further downstream.

**5. B — No, it's a starting point; you can add layers like a landing zone or domain-specific layers as needed.** The module is explicit that the names and number of layers are flexible — what matters is that each layer has a clear purpose and audience.

**6. B — Simpler management, better suited to smaller teams or early-stage projects.** A single lakehouse with bronze/silver/gold schemas trades some isolation for lower management overhead — a good fit when you don't yet need separate permissions or capacity per layer.

**7. C — Separate workspaces per layer.** This gives each layer its own capacity, role assignments, and clear ownership boundary — the strongest isolation option, required for regulatory or compliance scenarios, at the cost of more workspaces to manage.

**8. B — Use a OneLake shortcut to reference it without copying.** Shortcuts keep bronze in sync with the source automatically, with no pipeline or ingestion code needed — but only when the source is already in supported cloud storage. Other sources still need pipelines, dataflows, or notebooks.

**9. B — A materialized lake view.** You describe the target table with a SQL query, and Fabric creates and maintains it — updating only changed rows as new bronze data arrives, with no manual scheduling.

**10. B — A materialized lake view saves the results as a real table and updates incrementally; a regular view reruns its query every time it's queried.** This distinction is the core value proposition: materialized lake views trade some flexibility for performance and automatic freshness, powered by Delta's change tracking.

**11. B — The transformation must be expressible as SQL; Python logic requires a notebook instead.** This is the explicit tradeoff called out in the module — materialized lake views are SQL-only, so anything needing Python-based logic has to go through a notebook.

**12. A — Notebooks.** They give full control using Python or SQL, making them the right tool for large datasets, complex logic, custom calculations, or API calls — things dataflows and materialized lake views can't handle.

**13. B — A data science team might want a flat, wide table for feature engineering, while finance might want pre-aggregated summaries.** The module explicitly notes you can have multiple gold layers from the same silver data, each modeled differently for different audiences' needs.

**14. B — A Fabric Data Warehouse.** For SQL-first teams, a Data Warehouse can serve as the gold layer instead of a lakehouse — same layer purpose, different underlying item type.

**15. True.** The SQL analytics endpoint gives direct T-SQL access to gold layer data, but strictly in read-only mode — you can query, create views/functions, and apply SQL security, but not modify the underlying Delta tables.

**16. False.** Direct Lake reads directly from the Delta files in OneLake instead of importing a copy, so reports always reflect current data — no separate refresh step required.

**17. True.** Every lakehouse comes with a built-in `DefaultReader` role granting all ReadAll users access to all data by default; you have to modify or delete it if you want to restrict that default access.

**18. False.** OneLake data access roles are specifically the alternative to separate workspaces — they give granular, table/folder-scoped control within a single lakehouse, exactly for teams sharing a workspace who need different access per layer.

**19. B — A OneLake data access role scoped to the gold tables/folders.** This is exactly the described use case: granular per-layer access within one shared workspace, without the overhead of separate workspaces. A workspace-level Admin role (A) would be far too broad and wouldn't restrict visibility by layer at all.

**20. B — Git integration, allowing you to revert to a previous commit.** Fabric's Git integration versions notebooks, pipelines, and lakehouse definitions together, so a bad transformation change can be rolled back to the last known-good commit — exactly the recovery scenario described.

---

**Score guide:** 18–20 correct = strong grasp, ready to move to the next module. 14–17 = solid but review the materialized lake view vs. regular view distinction and the OneLake data access roles vs. separate workspaces tradeoff. Below 14 = re-read units 2–5 before moving on.
