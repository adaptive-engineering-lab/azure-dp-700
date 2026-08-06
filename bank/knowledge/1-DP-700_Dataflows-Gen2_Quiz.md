# DP-700 Practice Quiz — Ingest Data with Dataflows Gen2 in Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/use-dataflow-gen-2-fabric/
Units covered: Understand Dataflows Gen2 | Explore Dataflows Gen2 | Integrate Dataflows Gen2 and Pipelines

DP-700 domain: **Ingest and transform data** — "Choose between Dataflows Gen2, notebooks, KQL, and T-SQL for data transformation" / "Ingest data by using pipelines"

---

## Section A — Multiple Choice

**1.** What type of tool is a Dataflow Gen2 fundamentally classified as?
A. A reporting and visualization tool
B. A cloud-based ETL tool
C. A row-level security engine
D. A real-time streaming engine

**2.** Which underlying technology powers the visual transformation experience in Dataflows Gen2?
A. T-SQL
B. KQL
C. Power Query Online
D. Spark SQL

**3.** In the Dataflow Gen2 authoring experience, what is a data source referred to as *before* it is loaded to a data store?
A. A table
B. A query
C. An activity
D. A dataset

**4.** Which pane in the Dataflow Gen2 editor lets you visually see how data sources connect and which transformations are applied, represented as connected shapes?
A. Query Settings pane
B. Data Preview pane
C. Diagram View
D. Power Query ribbon

**5.** Where can you view the underlying M code for a dataflow's transformations?
A. Data Preview pane
B. Advanced editor
C. Queries pane
D. Pipeline monitoring hub

**6.** Which of the following is a valid native Fabric data destination for a Dataflow Gen2?
A. Eventhouse
B. Warehouse
C. Power BI Report
D. Real-Time hub

**7.** A team wants to use a Pipeline to first copy/land raw data into the lakehouse, and *then* use a Dataflow Gen2 to cleanse and curate it into a semantic model. What pattern does this describe?
A. ETL (Extract, Transform, Load)
B. ELT (Extract, Load, Transform)
C. Change Data Capture
D. Query folding

**8.** Which pipeline activity would you use to run a Dataflow Gen2 as part of a larger orchestration?
A. Get metadata
B. Copy data
C. Incorporate Dataflow (Dataflow activity)
D. Execute stored procedure

**9.** Why might a team schedule or trigger a Dataflow Gen2 via a pipeline rather than running it manually?
A. It is the only way to apply transformations
B. It enables automated, timely refresh without manual intervention
C. Pipelines are required before any dataflow can be created
D. Dataflows cannot be run on their own

**10.** Which of the following is explicitly listed as a *limitation* of Dataflows Gen2?
A. They cannot connect to Excel files
B. They do not support row-level security
C. They require a Spark cluster
D. They cannot be scheduled

---

## Section B — True / False

**11.** Adding a data destination to a Dataflow Gen2 is mandatory — a dataflow cannot exist without one. **(True/False)**

**12.** Dataflows Gen2 can be used as a reusable, discoverable data source that data analysts connect to directly from Power BI Desktop. **(True/False)**

**13.** Dataflows Gen2 are a full replacement for a data warehouse in Microsoft Fabric. **(True/False)**

**14.** A Fabric capacity workspace is required to use Dataflows Gen2. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**15.** Your organization has several Power BI report authors who all need a standardized, cleaned "Date" dimension table, and you want to avoid each of them re-building their own date logic. Which approach best fits the benefits described for Dataflows Gen2?
A. Build the date table in T-SQL inside a Warehouse and grant everyone direct SQL access
B. Create a shared/global Dataflow Gen2 with the standardized date logic that analysts can reference
C. Have each analyst create their own Dataflow Gen2 independently
D. Use an Eventstream to generate the date dimension in real time

**16.** You need to ingest data from a source, transform it visually with minimal code, and then execute a stored procedure afterward for auditing. What's the best orchestration approach?
A. Use only a Dataflow Gen2 — it can execute stored procedures natively
B. Use only a pipeline with a Copy Data activity — no transformation needed
C. Build a Dataflow Gen2 for ingestion/transformation, then add it to a Pipeline with a subsequent "Execute stored procedure" activity
D. Use KQL to perform both the transformation and the stored procedure execution

---

## Answer Key & Rationale

**1. B — A cloud-based ETL tool.** Dataflows are defined as cloud-based ETL tools for building and executing scalable data transformation processes. *(A: no visualization role; C/D: not their function.)*

**2. C — Power Query Online.** Dataflows Gen2 use Power Query Online for the visual, low-code transformation interface. *(A/B/D are used elsewhere in Fabric, not for the Dataflow authoring UI.)*

**3. B — A query.** Data sources are called "queries" while in the dataflow; they only become "tables" once loaded to a data store.

**4. C — Diagram View.** It visually shows connected shapes representing queries and their transformations. *(A shows applied steps as a list; B shows sample data; D is for connectors/transform actions, not visual mapping.)*

**5. B — Advanced editor.** The Advanced editor exposes the M code behind the visual steps.

**6. B — Warehouse.** Native Fabric destinations listed are Lakehouse, Warehouse, and SQL database (plus external Azure SQL DB, Azure Data Explorer, Azure Synapse Analytics). *(A/D are Real-Time Intelligence items, not Dataflow Gen2 destinations; C is a consumption layer, not a data destination.)*

**7. B — ELT.** Extract and Load happen first via the pipeline, then Transform happens via the Dataflow Gen2 — that ordering is the definition of ELT, as opposed to ETL where transform happens before load.

**8. C — Incorporate Dataflow (Dataflow activity).** This is the activity type specifically used to add a dataflow into a pipeline's orchestration.

**9. B — Enables automated, timely refresh without manual intervention.** Scheduling/triggering via pipeline lets data refresh on a defined cadence, especially useful for enterprise or frequently changing data. *(A, C, D are all false — dataflows can run standalone and manually too.)*

**10. B — They do not support row-level security.** This is explicitly listed as a limitation, along with "not a replacement for a data warehouse" and "requires Fabric capacity." *(A is false — Excel is a supported source; C/D are not stated limitations.)*

**11. False.** A data destination is explicitly described as *optional* — the dataflow preserves all transformation steps regardless, and can be incorporated into a pipeline for further use without a destination set.

**12. True.** Making a dataflow discoverable lets analysts connect to it via Power BI Desktop, reducing data prep duplication for report development.

**13. False.** Dataflows are explicitly *not* a replacement for a data warehouse — that's listed as a limitation.

**14. True.** A Fabric capacity workspace is required to use Dataflows Gen2.

**15. B.** This matches the stated benefit: "Extend data with consistent data, such as a standard date dimension table" combined with global/shared dataflows that analysts can reuse for specialized semantic models — avoiding duplicated logic. *(A bypasses the low-code/reusability benefit; C recreates the exact duplication problem; D is unrelated — real-time streaming isn't relevant to a static date dimension.)*

**16. C.** This is exactly the integration pattern described: use the Dataflow Gen2 for low-code ingestion/transformation, then orchestrate additional steps (like a stored procedure) via a pipeline activity after the dataflow completes. *(A is false — dataflows don't execute stored procedures; B skips the required transformation step; D misapplies KQL, which isn't the tool used here.)*

---

**Score guide:** 14–16 correct = strong grasp, ready to move to the next module. 10–13 = solid but review the ELT/ETL distinction and destination options. Below 10 = re-read units 2–4 before moving on.
