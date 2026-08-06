# DP-700 Practice Quiz — Work with Real-Time Data in an Eventhouse in Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/query-data-kql-database-microsoft-fabric/
Units covered: Get started with an Eventhouse | Use KQL effectively | Materialized views and stored functions

DP-700 domains: **Ingest and transform data** (Process data by using KQL; native tables vs. OneLake shortcuts; windowing/aggregation) | **Monitor and optimize** (Identify/resolve Eventhouse errors; Optimize Eventstreams and Eventhouses)

---

## Section A — Multiple Choice

**1.** What is automatically created when you create an Eventhouse in Microsoft Fabric?
A. A Lakehouse with the same name
B. A default KQL database with the same name
C. A Warehouse
D. A Dataflow Gen2

**2.** What do **database shortcuts** in an Eventhouse allow you to do?
A. Copy data permanently into your local eventhouse
B. Query data from external KQL databases as if stored locally, without copying it
C. Automatically delete stale data
D. Convert KQL queries to T-SQL

**3.** What does enabling **OneLake availability** for a KQL database or table do?
A. Deletes the data from the eventhouse
B. Makes the data accessible throughout the Fabric ecosystem for cross-workload integration
C. Converts the database into a Lakehouse
D. Enables row-level security automatically

**4.** Which query languages can be used within a KQL queryset?
A. Only KQL
B. Only T-SQL
C. Both KQL and T-SQL
D. Only PySpark

**5.** In KQL syntax, what character is used to pass data from one operation to the next?
A. Semicolon (`;`)
B. Pipe (`|`)
C. Ampersand (`&`)
D. Arrow (`->`)

**6.** Is KQL case-sensitive?
A. No, it's fully case-insensitive
B. Yes — table names, column names, functions, operators, keywords, and string values must all match exactly
C. Only table names are case-sensitive
D. Only string values are case-sensitive

**7.** Which operator would you use to retrieve a small sample of rows from a large table for exploration?
A. `project`
B. `summarize`
C. `take`
D. `join`

**8.** Which operator is used to select specific columns from a table, reducing the data processed downstream?
A. `project`
B. `summarize`
C. `take`
D. `where`

**9.** According to the module's optimization guidance, how should filters be ordered in a query for best performance?
A. Alphabetically by column name
B. Put filters that eliminate the most data first
C. Put filters that eliminate the least data first
D. Order doesn't affect performance

**10.** When performing a join in KQL, which table should be placed first for best performance?
A. The larger table
B. The smaller table
C. It doesn't matter which table is first
D. The table with the most columns

**11.** What are materialized views designed to solve?
A. The need for real-time data ingestion
B. The performance challenge of repeatedly recalculating aggregations across massive datasets
C. The lack of support for T-SQL in KQL querysets
D. Security and access control for KQL databases

**12.** What are the two parts that make up a materialized view's automatic update mechanism?
A. A source table and a destination table
B. A materialized part (precomputed results) and a delta (new unprocessed data)
C. A KQL queryset and a Copilot pane
D. A Lakehouse shortcut and a Warehouse table

---

## Section B — True / False

**13.** A stored function in KQL can accept parameters, allowing the same query logic to be reused with different values. **(True/False)**

**14.** Querying a materialized view always returns only the precomputed data as of the last background update, ignoring any newer data. **(True/False)**

**15.** KQL databases can ingest data from sources like Azure Event Hubs, Fabric Eventstream, and Apache Kafka connectors. **(True/False)**

**16.** Reducing the number of columns selected (projecting early) has no effect on KQL query performance. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**17.** You have a `TaxiTrips` table with billions of rows and a `VendorInfo` table with only a handful of rows. You need to join them to enrich trip data with vendor names. Which query structure follows the module's optimization guidance?
A. `TaxiTrips | join kind=inner VendorInfo on vendor_id`
B. `VendorInfo | join kind=inner TaxiTrips on vendor_id`
C. Join order doesn't matter in KQL
D. Use a materialized view instead of a join in all cases

**18.** Your team repeatedly writes the same filtering logic (trips with at least a certain number of passengers) across many different queries, and you want to ensure everyone applies this logic consistently. What KQL feature best fits this need?
A. A materialized view
B. A database shortcut
C. A stored function with a parameter
D. OneLake availability

---

## Answer Key & Rationale

**1. B — A default KQL database with the same name.** Every Eventhouse gets a default KQL database automatically; you can use it as-is or create additional databases as needed.

**2. B — Query data from external KQL databases as if stored locally, without copying it.** Database shortcuts point to KQL databases in other eventhouses or Azure Data Explorer without duplicating the underlying data.

**3. B — Makes the data accessible throughout the Fabric ecosystem for cross-workload integration.** This lets Power BI, Warehouse, Lakehouse, and other Fabric services access the data directly.

**4. C — Both KQL and T-SQL.** The KQL queryset supports both languages, giving flexibility for people more comfortable with SQL syntax.

**5. B — Pipe (`|`).** KQL uses a pipeline/funnel approach — each operator after a pipe works on the results of the previous step.

**6. B — Yes, KQL is fully case-sensitive across every identifier and value type.** `TaxiTrips`, `taxitrips`, and `TAXITRIPS` are all treated as different — a common gotcha worth remembering directly for the exam.

**7. C — `take`.** `take` returns a limited number of rows quickly, ideal for exploring a large table's structure without processing everything.

**8. A — `project`.** Selecting only needed columns early reduces the data volume that later operators (like `where` or `summarize`) have to process.

**9. B — Put filters that eliminate the most data first.** Think funnel: broad, high-impact filters (like a time range) go first, narrower filters follow, minimizing the data volume as early as possible.

**10. B — The smaller table.** KQL processes the first table to match against the second, so starting with the smaller table means less data to process during the join.

**11. B — The performance challenge of repeatedly recalculating aggregations across massive datasets.** Materialized views precompute and store aggregation results so you're not recalculating from scratch on every query.

**12. B — A materialized part (precomputed results) and a delta (new unprocessed data).** These combine automatically at query time, giving both speed (from precomputed data) and freshness (from the delta) simultaneously.

**13. True.** Functions can take parameters (e.g., `trips_by_min_passenger_count(num_passengers:long)`), letting you reuse the same logic with different input values.

**14. False.** Materialized views combine the materialized part *and* the delta at query time, so they always return fresh, up-to-date results — not stale data frozen at the last background update.

**15. True.** The module explicitly lists Azure Event Hubs, Fabric Eventstream, Real-Time hub, and connectors including Apache Kafka among supported ingestion sources.

**16. False.** Projecting only needed columns early reduces resource usage and processing overhead — this is one of the module's explicit optimization techniques, especially valuable on wide tables.

**17. B — `VendorInfo | join kind=inner TaxiTrips on vendor_id`.** Putting the smaller table (`VendorInfo`) first follows the module's stated best practice, minimizing the data KQL has to process during the join.

**18. C — A stored function with a parameter.** This directly matches the module's stated use case: encapsulate shared filtering/transformation logic once, parameterize it, and ensure consistent application across the team — exactly like the `trips_by_min_passenger_count` example.

---

**Score guide:** 16–18 correct = strong grasp, ready to move to the next module. 12–15 = solid but review filter ordering and materialized view freshness. Below 12 = re-read units 2–4 before moving on.
