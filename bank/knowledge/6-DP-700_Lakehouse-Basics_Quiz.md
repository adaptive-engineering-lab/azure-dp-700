# DP-700 Practice Quiz — Get Started with Lakehouses in Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/get-started-lakehouses/
Units covered: Describe lakehouse features and capabilities | Ingest and transform data in a lakehouse | Query and analyze lakehouse data

DP-700 domains: **Ingest and transform data** (Choose an appropriate data store; Dataflows Gen2/notebooks/KQL/T-SQL choice; Create and manage OneLake shortcuts) | **Monitor and optimize** (Optimize a Lakehouse table)

---

## Section A — Multiple Choice

**1.** What are the two main storage areas within a lakehouse?
A. Tables and Views
B. Tables and Files
C. Schemas and Shortcuts
D. Delta and Parquet

**2.** Which lakehouse folder contains data that supports SQL queries, enforces schemas, and supports ACID transactions?
A. Files
B. Tables
C. Shortcuts
D. Views

**3.** What happens to data in the Files folder of a lakehouse?
A. It automatically becomes a Delta table
B. It stores raw or semi-structured data in native format without an enforced schema
C. It's automatically optimized and maintained like a Delta table
D. It can be queried directly via SQL with full write access

**4.** What does each Delta table consist of, according to the module?
A. Only Parquet data files
B. Parquet data files plus a transaction log that tracks all changes
C. A CSV file and a JSON manifest
D. A materialized view and a stored function

**5.** Which Delta Lake feature lets you query previous versions of your data or roll back changes?
A. Schema enforcement
B. ACID transactions
C. Time travel
D. Efficient updates and deletes

**6.** When you create a new lakehouse, what happens with schemas by default?
A. Schemas are disabled until manually enabled
B. Schemas are enabled by default, with a "dbo" schema created automatically
C. You must create at least 3 schemas before ingesting data
D. Schemas only apply to the Files folder

**7.** What four-part namespace format enables cross-workspace queries in a schema-enabled lakehouse?
A. `server.database.schema.table`
B. `workspace.lakehouse.schema.table`
C. `tenant.workspace.lakehouse.table`
D. `catalog.schema.table.column`

**8.** Which lakehouse working mode lets you query Delta tables with T-SQL but is strictly read-only regarding the underlying data?
A. Lakehouse explorer
B. SQL analytics endpoint
C. Notebook mode
D. Dataflow Gen2 editor

**9.** Which no-code ingestion option lets you select a file in the lakehouse explorer and create a Delta table directly, supporting Parquet and CSV?
A. Upload
B. Load to Table
C. Dataflows Gen2
D. Shortcuts

**10.** What is a "schema shortcut" in a lakehouse?
A. A shortcut that maps an entire schema to a folder of Delta tables in another lakehouse or ADLS Gen2
B. A saved SQL query template
C. A shortcut available only for CSV files
D. A method to rename columns automatically

**11.** In Spark notebooks, which approach uses Python methods like `df.select()` and `df.filter()` to manipulate data?
A. Spark SQL
B. PySpark DataFrame API
C. T-SQL
D. KQL

**12.** By default, what mode does Power BI use when building reports on a lakehouse semantic model?
A. Import mode
B. DirectQuery mode
C. Direct Lake mode
D. Composite mode

---

## Section B — True / False

**13.** The SQL analytics endpoint is automatically created with every lakehouse. **(True/False)**

**14.** You can modify (write to) the underlying lakehouse data directly through the SQL analytics endpoint. **(True/False)**

**15.** Shortcuts require you to copy the source data into your lakehouse before you can use it. **(True/False)**

**16.** Row-level and column-level security are supported through the SQL analytics endpoint. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**17.** A data engineer wants to explore raw JSON files, apply complex transformations using Python, and prepare data for a machine learning model — all in one flexible, code-based environment. Which tool best fits?
A. SQL analytics endpoint
B. Load to Table (no-code)
C. Spark notebook using PySpark
D. Power BI Direct Lake mode

**18.** Your organization wants report authors to consume a simplified, pre-joined, filtered view of sales and product data (active products only) without needing to understand the underlying table structure or write complex joins themselves. What should you create?
A. A schema shortcut
B. A SQL view on the SQL analytics endpoint
C. A new Files folder
D. A Load to Table operation

---

## Answer Key & Rationale

**1. B — Tables and Files.** These are the two main storage areas — Tables for structured, queryable Delta data, Files for raw or semi-structured data in native format.

**2. B — Tables.** The Tables folder holds Delta Lake tables, which support SQL queries via the SQL analytics endpoint, enforce schemas, support ACID transactions, and can be accessed in Power BI.

**3. B — It stores raw or semi-structured data in native format without an enforced schema.** Files support any format (CSV, JSON, Parquet, images, documents) and provide flexibility for staging before transformation into tables — they don't enforce schema or support direct SQL queries.

**4. B — Parquet data files plus a transaction log that tracks all changes.** This combination is what enables both batch and streaming workloads to reliably work with the same underlying data.

**5. C — Time travel.** Delta Lake maintains a transaction log specifically so you can query previous versions of the data or roll back changes when needed.

**6. B — Schemas are enabled by default, with a "dbo" schema created automatically.** You can then create additional schemas (e.g., `sales`, `marketing`, `hr`) to organize tables by business domain as the lakehouse grows.

**7. B — `workspace.lakehouse.schema.table`.** This four-part namespace is what enables cross-workspace queries in schema-enabled lakehouses, and it's also used for cross-workspace queries from Spark notebooks.

**8. B — SQL analytics endpoint.** It provides read-only T-SQL access — you can create views, functions, and apply SQL security, but you can't modify the underlying data. *(Lakehouse explorer, by contrast, does let you manage data and make changes.)*

**9. B — Load to Table.** This no-code option creates a Delta table directly from a selected file/folder, supporting Parquet and CSV, with the ability to append or overwrite data in new or existing tables.

**10. A — A shortcut that maps an entire schema to a folder of Delta tables in another lakehouse or ADLS Gen2.** All the referenced tables then appear as local tables within that schema — a bulk version of a regular shortcut.

**11. B — PySpark DataFrame API.** Methods like `df.select()` and `df.filter()` are Python/DataFrame API calls. *(Spark SQL instead uses SQL syntax like `SELECT * FROM schema.table` within a notebook cell.)*

**12. C — Direct Lake mode.** Power BI defaults to Direct Lake for lakehouse semantic models, reading data directly from Delta Lake Parquet files without importing or copying it — fast performance while always reflecting current data.

**13. True.** The SQL analytics endpoint is automatically created alongside every lakehouse — no separate setup step required.

**14. False.** The SQL analytics endpoint is explicitly read-only. You can create views, functions, and apply SQL security through it, but you cannot modify the underlying data — for that, you'd use Lakehouse explorer, notebooks, or another write-capable tool.

**15. False.** Shortcuts specifically avoid copying data — they reference data in external storage (another storage account, cloud provider, or Fabric item) and make it appear as a folder in your lakehouse, with OneLake managing the underlying permissions and credentials.

**16. True.** The SQL analytics endpoint supports both row-level and column-level security, letting you control exactly what different users see when they query through SQL.

**17. C — Spark notebook using PySpark.** This matches the described use case directly: exploratory analysis of raw files, complex Python-based transformations, and ML data prep — precisely what notebooks are favored for by data engineers, especially with PySpark's flexibility.

**18. B — A SQL view on the SQL analytics endpoint.** Views are explicitly called out for this exact purpose — applying business rules, simplifying complex joins, and providing curated data for downstream consumers like report authors, without exposing them to the raw table structure.

---

**Score guide:** 16–18 correct = strong grasp, ready to move to the next module. 12–15 = solid but review the Lakehouse explorer vs. SQL analytics endpoint distinction and the ingestion method options. Below 12 = re-read units 2–4 before moving on.
