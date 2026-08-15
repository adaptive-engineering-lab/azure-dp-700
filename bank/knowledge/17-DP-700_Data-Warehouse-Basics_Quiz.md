# DP-700 Practice Quiz — Get Started with Data Warehouses in Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/get-started-data-warehouse/
Units covered: Understand data warehouses | Understand data warehouses in Fabric | Query and transform data | Model data in a warehouse | Secure and monitor a warehouse

DP-700 domains: **Ingest and transform data** (Choose an appropriate data store; Prepare data for a dimensional model; Ingest data by using pipelines) | **Monitor and optimize** (Optimize a data warehouse; Identify and resolve T-SQL errors) | **Implement and manage** (Security and governance — RLS/CLS/OLS/dynamic data masking)

---

## Section A — Multiple Choice

**1.** What is the primary purpose of a fact table in a data warehouse?
A. To store descriptive attributes with few rows
B. To store the numerical data you want to analyze, typically with a large number of rows
C. To define workspace security roles
D. To store raw unmodified source files

**2.** What is a surrogate key?
A. A natural business key from the source system, like a product code
B. A unique identifier generated automatically by the database for each dimension row
C. A column used only in fact tables
D. A column that masks sensitive data

**3.** What is an alternate key used for in a dimension table?
A. It replaces the need for a surrogate key entirely
B. It maintains traceability between the data warehouse and the source transactional system
C. It defines row-level security
D. It's only used in snowflake schemas

**4.** What do slowly changing dimensions specifically track?
A. Real-time streaming events
B. Changes to dimension attributes over time, like a customer's address or a product's price
C. Query performance metrics
D. Workspace role assignments

**5.** In a star schema, how does the fact table relate to dimension tables?
A. Dimension tables are normalized into further sub-tables
B. The fact table relates directly to the dimension tables
C. There is no direct relationship; a bridge table is required
D. Fact tables are not used in a star schema

**6.** What distinguishes a snowflake schema from a star schema?
A. Snowflake schemas have no fact table
B. Dimension tables in a snowflake schema are further normalized into additional related tables
C. Snowflake schemas cannot be queried with T-SQL
D. Star schemas only support one dimension table

**7.** What format is data stored in for a Fabric data warehouse?
A. CSV
B. Open Delta format on OneLake
C. Proprietary binary format
D. JSON

**8.** What capability does a Fabric warehouse have that the SQL analytics endpoint does **NOT**?
A. Reading data
B. Creating views and stored procedures
C. Writing data (INSERT, UPDATE, DELETE, MERGE) and creating tables (DDL)
D. Being queried with T-SQL

**9.** Which T-SQL command would you use to bulk load data from CSV or Parquet files in Azure storage directly into warehouse tables?
A. `OPENROWSET`
B. `COPY INTO`
C. `CREATE TABLE ... AS CLONE OF`
D. `MERGE`

**10.** What is the purpose of a staging table in the warehouse loading pattern?
A. To permanently replace dimension tables
B. To act as a temporary holding area for raw source data before transformation into the dimensional model
C. To store query performance metrics
D. To define row-level security policies

**11.** What is a key characteristic of a table clone created with `CREATE TABLE ... AS CLONE OF` in a Fabric warehouse?
A. It fully duplicates the underlying data files, doubling storage
B. It copies table metadata while referencing the same underlying data files, with no data duplication
C. It only works across different warehouses, never within the same one
D. It requires a manual data copy afterward

**12.** Which tool provides a no-code, diagram-style experience for building queries by dragging tables onto a canvas?
A. SQL query editor
B. Visual query editor
C. KQL Queryset
D. Query insights

**13.** What do views and stored procedures both help with, beyond standardizing human access to data?
A. They eliminate the need for security policies
B. They improve the accuracy of Copilot and Fabric IQ data agents, which can query views like tables
C. They automatically create semantic models
D. They replace the need for dimensional modeling

**14.** What mode do semantic models created from a Fabric warehouse use by default for Power BI reporting?
A. Import mode
B. DirectQuery mode
C. Direct Lake mode
D. Composite mode

---

## Section B — True / False

**15.** Cross-filter direction in a warehouse relationship determines which way filters propagate between tables, and single direction (dimension filters fact) is the standard for most star schema designs. **(True/False)**

**16.** The `ReadAll` item permission allows a user to read raw Parquet files in OneLake directly. **(True/False)**

**17.** A user can connect to the SQL analytics endpoint without being granted at least `Read` permission on the warehouse. **(True/False)**

**18.** Only workspace Admins can run the `KILL` command to terminate long-running sessions in a Fabric warehouse. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**19.** Your organization needs analysts to reliably calculate "Total Sales" the same way every time across all their reports, regardless of which team builds the report, and you want a single place to update the calculation logic if the business definition changes. What should you create?
A. A staging table
B. A measure defined once in the warehouse model view
C. A table clone
D. A dynamic management view

**20.** You need to investigate why a specific warehouse query has been running unusually long for the past 20 minutes, and you want to see it in real time as it's currently executing. Which tool should you use?
A. Query insights (`queryinsights.long_running_queries`)
B. A dynamic management view like `sys.dm_exec_requests`
C. A table clone
D. The Visual query editor

---

## Answer Key & Rationale

**1. B — To store the numerical data you want to analyze, typically with a large number of rows.** Fact tables are the primary source of data for analysis — like total amounts paid for sales orders — with dimension tables providing the descriptive context around them.

**2. B — A unique identifier generated automatically by the database for each dimension row.** Surrogate keys are specific to the data warehouse itself, typically auto-generated integers, and help maintain internal consistency.

**3. B — It maintains traceability between the data warehouse and the source transactional system.** Alternate keys are the natural/business keys (like a product code or customer ID) from the source system — you need both surrogate and alternate keys because they serve different purposes.

**4. B — Changes to dimension attributes over time, like a customer's address or a product's price.** Slowly changing dimensions let you analyze and understand how data has changed over time, which matters for accurate historical reporting.

**5. B — The fact table relates directly to the dimension tables.** This direct relationship, without further normalization of the dimensions, is exactly what defines a star schema — dimension data is denormalized to reduce the number of joins needed.

**6. B — Dimension tables in a snowflake schema are further normalized into additional related tables.** For example, `DimProduct` might split into separate `DimCategory` and `DimSupplier` tables — useful when there are many shared levels or attributes across dimensions.

**7. B — Open Delta format on OneLake.** This is what allows other Fabric workloads to access the same warehouse data without duplicating it — consistent with everything else you've learned about how Fabric stores tabular data.

**8. C — Writing data (INSERT, UPDATE, DELETE, MERGE) and creating tables (DDL).** The SQL analytics endpoint is read-only over lakehouse data; a warehouse gives full read/write T-SQL capability over its own native tables. Both support reading data and creating views/stored procedures.

**9. B — `COPY INTO`.** This T-SQL command bulk loads data directly from external files (CSV, Parquet) in Azure storage into warehouse tables. `OPENROWSET`, by contrast, queries files directly without first creating tables — useful for ad hoc analysis rather than bulk loading.

**10. B — To act as a temporary holding area for raw source data before transformation into the dimensional model.** Staging tables mirror the source data's structure, keeping it intact while you apply business rules and key lookups during the load into final fact/dimension tables.

**11. B — It copies table metadata while referencing the same underlying data files, with no data duplication.** This "zero-copy" clone keeps storage costs low, and is useful for development/testing, recovery after a failed release, or preserving point-in-time snapshots for historical reporting.

**12. B — Visual query editor.** It offers a diagram-view experience similar to Power Query Online — drag a table onto the canvas, then use the Transform menu or the (+) button to add columns, filters, and other transformations, no code required.

**13. B — They improve the accuracy of Copilot and Fabric IQ data agents, which can query views like tables.** Standardizing data access through well-named views (and stored procedures for repeatable logic) makes natural-language AI tools more accurate, not just human analysts.

**14. C — Direct Lake mode.** This reads data directly from OneLake Parquet files rather than importing a copy, meaning reports reflect current warehouse data without requiring scheduled refreshes — the same behavior you've seen with lakehouse semantic models.

**15. True.** Cross-filter direction governs how filters flow between related tables, and single direction (dimension → fact) is the standard because it keeps filter behavior predictable and performant — the typical setup for fact-to-dimension relationships in a star schema.

**16. True.** `ReadAll` specifically allows a user to read the raw Parquet files in OneLake directly, distinct from `Read` (SQL analytics endpoint connection only) and `ReadData` (read data from tables/views without accessing raw files).

**17. False.** A connection to the SQL analytics endpoint explicitly **fails** without at minimum `Read` permission on the warehouse — this permission is a hard prerequisite, not optional.

**18. True.** The module states this directly — only workspace Admins can run `KILL` to terminate long-running sessions; Members, Contributors, and Viewers can see their own query results but can't see other users' queries or terminate sessions.

**19. B — A measure defined once in the warehouse model view.** This matches the described need precisely: a single, reusable DAX calculation that becomes the source of truth for that metric, updated in one place rather than duplicated (and potentially inconsistently redefined) across every report.

**20. B — A dynamic management view like `sys.dm_exec_requests`.** DMVs monitor active connections, sessions, and requests in *real time*, which is what's needed to inspect a query that is *currently* running. Query insights (A) is the right tool for historical analysis over the past 30 days, not live in-progress monitoring.

---

**Score guide:** 18–20 correct = strong grasp, ready to move to the next module. 14–17 = solid but review the warehouse vs. SQL analytics endpoint capability table and the three item permission levels (Read/ReadData/ReadAll). Below 14 = re-read units 2–6 before moving on.
