# DP-700 Practice Quiz — Work with Delta Lake Tables in Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/work-delta-lake-tables-fabric/
Units covered: Understand Delta Lake | Create delta tables | Optimize delta tables | Work with delta tables in Spark | Use delta tables with streaming data

DP-700 domains: **Ingest and transform data** (Prepare data for dimensional models; Handle duplicate/missing/late-arriving data; Transform data by using PySpark/SQL; Process data by using Spark structured streaming) | **Monitor and optimize** (Optimize a Lakehouse table)

---

## Section A — Multiple Choice

**1.** What does Delta Lake add to Spark-based data lake processing?
A. Real-time messaging
B. Relational database semantics (ACID, schema, versioning)
C. A visual ETL designer
D. Native KQL support

**2.** What are the two components stored for each Delta table in a lakehouse?
A. A CSV file and an index file
B. Parquet data files and a `_delta_log` folder with JSON transaction records
C. A materialized view and a stored procedure
D. A schema file and a checkpoint file only

**3.** Which of the four ACID properties ensures that concurrent, in-process transactions can't interfere with one another?
A. Atomicity
B. Consistency
C. Isolation
D. Durability

**4.** When you save a dataframe using `df.write.format("delta").saveAsTable("mytable")` with no path specified, what kind of table is created?
A. An external table
B. A managed table
C. A temporary view
D. A streaming table

**5.** What happens when you delete a **managed** table from the lakehouse metastore?
A. Only the metadata is removed; underlying files remain
B. Both the table definition and the underlying data files are deleted
C. Nothing happens until VACUUM is run
D. The table is converted to an external table automatically

**6.** What happens when you delete an **external** table from the lakehouse metastore?
A. The metadata definition is removed, but the underlying data files are NOT deleted
B. Both metadata and data files are deleted
C. It cannot be deleted, only overwritten
D. It automatically triggers a VACUUM

**7.** Which API lets you define a delta table's schema and columns directly in Spark code, without first loading a dataframe?
A. `DeltaTableBuilder` API
B. Spark Structured Streaming API
C. PySpark DataFrame API
D. Delta Lake REST API

**8.** What is the "small file problem" in Delta Lake / Spark?
A. Too few files, causing slow writes
B. Many small files accumulating from updates and deletes, slowing down queries
C. Files that are too large to fit in memory
D. Missing transaction log files

**9.** What does the **OptimizeWrite** feature do, and is it enabled by default in Fabric?
A. Consolidates existing files on a schedule; disabled by default
B. Writes fewer, larger files as data is written; enabled by default
C. Deletes old Parquet files; disabled by default
D. Partitions tables automatically; enabled by default

**10.** What does the **OPTIMIZE** command do, as distinct from OptimizeWrite?
A. It runs as data is being written, preventing small files from forming in the first place
B. It's a table maintenance feature that consolidates existing small Parquet files into fewer, larger ones after the fact
C. It removes old data files beyond a retention period
D. It partitions a table by a specified column

**11.** What does **V-Order** do, and what's the trade-off of using it?
A. It speeds up writes but slows down reads
B. It speeds up reads (especially via Power BI/SQL Verti-Scan) at the cost of roughly 15% slower writes
C. It compresses data losslessly with no performance trade-offs at all
D. It only works with external tables

**12.** What does the **VACUUM** command do?
A. Compacts small files into larger ones
B. Permanently removes old, unreferenced Parquet data files older than the retention period
C. Deletes the transaction log entirely
D. Reverses the effects of OptimizeWrite

**13.** What is the default — and minimum allowed — retention period for VACUUM in Microsoft Fabric?
A. 24 hours, with no minimum enforced
B. 7 days (168 hours), and the system prevents a shorter period
C. 30 days, with no way to change it
D. 1 hour by default

**14.** When should you avoid partitioning a Delta table, per the module's guidance?
A. When you have very large amounts of data
B. When the partitioning column has high cardinality, creating a large number of partitions
C. When tables can be split into a few large partitions
D. When you want to enable data skipping

---

## Section B — True / False

**15.** Running VACUUM also deletes the transaction log entries associated with the removed files. **(True/False)**

**16.** You can retrieve an earlier version of a Delta table's data by specifying a `versionAsOf` or `timestampAsOf` option when reading it. **(True/False)**

**17.** When using a Delta table as a Spark Structured Streaming source, data modifications (updates/deletes) are allowed by default without any special configuration. **(True/False)**

**18.** Spark processes streaming data using a completely different API from batch data, requiring entirely separate code. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**19.** You need to permanently free up storage by removing old Parquet files that are no longer referenced and are older than your compliance-mandated retention window, while still being able to view table history via `DESCRIBE HISTORY`. What should you run?
A. OPTIMIZE
B. VACUUM
C. OptimizeWrite
D. `DeltaTableBuilder.create()`

**20.** You're staging raw data that will only be read once or twice before being discarded, and you want to minimize write overhead. What should you consider doing regarding V-Order?
A. Enable V-Order to maximize read speed regardless of write cost
B. Disable V-Order, since the read benefit doesn't offset the write overhead for write-intensive, rarely-read staging data
C. V-Order cannot be disabled once enabled
D. Use partitioning instead of V-Order for staging data

---

## Answer Key & Rationale

**1. B — Relational database semantics (ACID, schema, versioning).** Delta Lake is an open-source storage layer that brings CRUD support, ACID transactions, versioning, and more to Spark-based data lake processing.

**2. B — Parquet data files and a `_delta_log` folder with JSON transaction records.** Every Delta table folder contains both: the actual data in Parquet, and a log of every transaction in JSON format.

**3. C — Isolation.** Isolation specifically means in-process transactions can't interfere with one another. *(Atomicity = complete as one unit; Consistency = leaves DB in a valid state; Durability = completed changes persist.)*

**4. B — A managed table.** With no `path` argument, both the table definition in the metastore *and* the underlying data files are managed together by the Spark runtime.

**5. B — Both the table definition and the underlying data files are deleted.** This is the defining trait of a managed table — metastore and files are tied together.

**6. A — The metadata definition is removed, but the underlying data files are NOT deleted.** External tables only map the metastore definition to a separate storage location; deleting the table leaves the actual files untouched.

**7. A — `DeltaTableBuilder` API.** This lets you specify a table name and add columns directly in code (e.g., `DeltaTable.create(spark).tableName(...).addColumn(...)`) without needing an existing dataframe.

**8. B — Many small files accumulating from updates and deletes, slowing down queries.** Because Parquet files are immutable, every update or delete writes a new file — over time this produces a large number of small files that degrade query performance.

**9. B — Writes fewer, larger files as data is written; enabled by default.** OptimizeWrite acts at write time to prevent the small file problem before it starts, and it's on by default in Fabric (though it can be toggled at the session, table property, or command level).

**10. B — It's a table maintenance feature that consolidates existing small Parquet files into fewer, larger ones after the fact.** Unlike OptimizeWrite (which prevents small files during writes), OPTIMIZE is run afterward to clean up files that have already accumulated.

**11. B — It speeds up reads (especially via Power BI/SQL Verti-Scan) at the cost of roughly 15% slower writes.** V-Order applies special sorting, encoding, and compression to Parquet files, trading some write speed for meaningfully faster reads across Fabric's compute engines.

**12. B — Permanently removes old, unreferenced Parquet data files older than the retention period.** VACUUM cleans up files left behind by updates/deletes that are no longer needed for time travel within the retention window — but it does not touch the transaction log itself.

**13. B — 7 days (168 hours), and the system prevents a shorter period.** This default protects your ability to time travel; you can't set VACUUM to a shorter retention window than this.

**14. B — When the partitioning column has high cardinality, creating a large number of partitions.** This (along with small data volumes generally) can make the small file problem worse rather than improving performance — partitioning works best on very large datasets split into a few large partitions.

**15. False.** VACUUM removes old *data files* only — it doesn't touch the transaction log. In fact, VACUUM itself commits an entry to the transaction log, which is why you can see previous VACUUM runs via `DESCRIBE HISTORY`.

**16. True.** You can read a specific past version by passing `versionAsOf` (a version number) or `timestampAsOf` (a date/time) as an option when loading the delta table into a dataframe — this is the time travel feature in action.

**17. False.** By default, only *append* operations are allowed when a Delta table is used as a streaming source — modifications (updates/deletes) cause an error unless you explicitly specify the `ignoreChanges` or `ignoreDeletes` option.

**18. False.** Spark processes both streaming and batch data using the *same* API — Structured Streaming is based on a "boundless dataframe" concept, meaning the same general dataframe operations apply to both.

**19. B — VACUUM.** This directly matches the described need: permanently remove old unreferenced data files past a retention threshold. Table history remains visible via `DESCRIBE HISTORY` because VACUUM doesn't touch the transaction log — only OPTIMIZE (A) consolidates files rather than deleting them, so it wouldn't free storage the same way.

**20. B — Disable V-Order, since the read benefit doesn't offset the write overhead for write-intensive, rarely-read staging data.** The module explicitly calls this out: V-Order's ~15% write overhead isn't worth it when data is only read once or twice, so disabling it can reduce overall ingestion processing time in staging scenarios.

---

**Score guide:** 18–20 correct = strong grasp, ready to move to the next module. 14–17 = solid but review the OptimizeWrite vs. OPTIMIZE vs. VACUUM distinction and managed vs. external table deletion behavior. Below 14 = re-read units 2–5 before moving on.
