# DP-700 Practice Quiz — Load Data into a Microsoft Fabric Data Warehouse

Source module: https://learn.microsoft.com/en-us/training/modules/load-data-into-microsoft-fabric-data-warehouse/
Units covered: Explore data load strategies | Use data pipelines to load a warehouse | Load data using T-SQL | Load and transform data with Dataflow Gen2

DP-700 domain: **Ingest and transform data** — "Design and implement full and incremental data loads" specifically, plus "Ingest data by using pipelines" and the Dataflow Gen2/notebooks/T-SQL tool-choice objective.

---

## Section A — Multiple Choice

**1.** What does a full load do?
A. Loads only rows changed since the last run
B. Truncates and reloads all tables, replacing old data entirely
C. Only loads dimension tables, never fact tables
D. Requires change-tracking mechanisms in the source

**2.** What does an incremental load require that a full load does not?
A. A larger warehouse
B. Change-tracking mechanisms in the source data
C. A surrogate key
D. A Dataflow Gen2

**3.** What are the two purposes of staging data before loading it into a warehouse?
A. To permanently store historical data and to replace fact tables
B. To apply business rules/transformations without affecting production tables, and to act as a buffer keeping the warehouse responsive
C. To define row-level security and column-level security
D. To automatically generate surrogate keys

**4.** What is a business key (natural key)?
A. A system-generated integer with no business meaning
B. A key from the source system that carries meaning, like a product SKU or customer ID
C. A key used only for row-level security
D. A key that changes automatically on every load

**5.** Why are surrogate keys used instead of relying solely on business keys?
A. They're faster to type
B. They protect the warehouse from changes in source systems, since they have no business meaning
C. They automatically enforce data type conversions
D. They eliminate the need for dimension tables

**6.** Why are dimension tables loaded before fact tables?
A. Dimension tables are always smaller and load faster
B. Fact tables reference dimension tables through surrogate keys
C. Fact tables cannot be created until dimensions exist in the schema
D. There is no required order

**7.** Which SCD type overwrites the existing value with no history kept?
A. Type 0
B. Type 1
C. Type 2
D. Type 3

**8.** Which SCD type adds a new row for each change and marks the old row as expired, preserving full history?
A. Type 1
B. Type 2
C. Type 3
D. Type 4

**9.** In a type 2 SCD fact table load, why might you use `MAX()` when looking up a dimension's surrogate key?
A. To calculate the total sales amount
B. To retrieve the most recently added (current) version of the dimension record, assuming incrementing surrogate keys
C. To find the maximum possible value allowed by the column's data type
D. To identify duplicate business keys

**10.** In a Fabric Copy job, what is the difference between "Full copy" and "Incremental" modes?
A. Full copy only works with CSV files; Incremental only works with Parquet
B. Full copy loads all source data every run; Incremental loads only rows changed since the previous run
C. There is no functional difference
D. Incremental mode requires T-SQL; Full copy does not

**11.** When authenticating a T-SQL `COPY INTO` statement against an Azure Blob Storage source, what must you provide?
A. Nothing; authentication is automatic
B. A Shared Access Signature (SAS) or Storage Account Key via the `CREDENTIAL` parameter
C. A workspace identity token only
D. An Azure Active Directory group membership

**12.** What does the `REJECTED_ROW_LOCATION` option do in a `COPY INTO` statement, and what file type does it apply to?
A. It stops the entire load if any row fails; applies to all file types
B. It sends failed rows to a separate storage location instead of failing the whole load; applies only to CSV files
C. It automatically retries failed rows; applies only to Parquet files
D. It deletes rejected rows permanently with no logging

**13.** What is the key difference between `CREATE TABLE AS SELECT` (CTAS) and `INSERT...SELECT`?
A. CTAS creates a new table from a query result; `INSERT...SELECT` adds rows to an existing table
B. `INSERT...SELECT` creates a new table; CTAS only works on existing tables
C. They are functionally identical
D. CTAS cannot join data across a warehouse and a lakehouse

**14.** When Dataflow Gen2 targets a Fabric Warehouse as its destination, which update method should you use for a table that accumulates daily transaction logs over time?
A. Replace
B. Append
C. Full copy
D. Incremental

---

## Section B — True / False

**15.** All warehouses within the same Fabric workspace share a single SQL connection endpoint, enabling cross-database queries using three-part naming. **(True/False)**

**16.** When loading data from a OneLake lakehouse folder using `COPY INTO`, you must still provide a Shared Access Signature or Storage Account Key. **(True/False)**

**17.** Append is the only supported update method for KQL database and Azure Data Explorer destinations in Dataflow Gen2 — Replace is not available. **(True/False)**

**18.** Changes made to a Dataflow Gen2 take effect immediately as you build, even before publishing. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**19.** You're loading a `Dim_Customer` table using a type 2 SCD approach, and a customer's address has changed since the last load. What should happen to the existing record for that customer?
A. It should be deleted permanently
B. It should be overwritten with the new address, with no history retained
C. It should be marked as expired/inactive, and a new row should be inserted with the updated address
D. It should be moved to a separate dimension table entirely

**20.** You need to combine data from a sales warehouse and a social media lakehouse into a brand-new, permanent table for downstream analysis, joining on `product_id`. Which T-SQL approach fits this need?
A. `COPY INTO`
B. `CREATE TABLE AS SELECT` (CTAS), joining across the warehouse and lakehouse using three-part naming
C. Dataflow Gen2 with Replace update method
D. A Copy job with Incremental mode

---

## Answer Key & Rationale

**1. B — Truncates and reloads all tables, replacing old data entirely.** Full loads are simpler to implement since you don't track history, and are typical for initial warehouse setup or when you need a complete refresh.

**2. B — Change-tracking mechanisms in the source data.** Incremental loads are faster and preserve history, but they depend on being able to identify what's actually changed since the last run — which full loads don't need to worry about.

**3. B — To apply business rules/transformations without affecting production tables, and to act as a buffer keeping the warehouse responsive.** Staging gives you a safe workspace to clean and validate data before it touches production tables, while large loads process in the background.

**4. B — A key from the source system that carries meaning, like a product SKU or customer ID.** Business keys (natural keys) let you trace warehouse records back to their origin in the source system.

**5. B — They protect the warehouse from changes in source systems, since they have no business meaning.** If a source system reuses or modifies a product code, the surrogate key keeps warehouse relationships intact regardless — the business key can change, but the surrogate key stays stable.

**6. B — Fact tables reference dimension tables through surrogate keys.** Loading dimensions first ensures those surrogate keys already exist and are available for the fact table load's lookup logic to reference.

**7. B — Type 1.** Type 1 overwrites the existing value with no history kept — appropriate for things like fixing a data entry error where you don't need to preserve the old, incorrect value.

**8. B — Type 2.** Type 2 adds a new row for each change and marks the old row as expired, giving you full history — for example, tracking a customer's address at the exact time of each sale.

**9. B — To retrieve the most recently added (current) version of the dimension record, assuming incrementing surrogate keys.** Since type 2 SCD can have multiple rows for the same business key (one per historical version), `MAX()` on an incrementing surrogate key reliably picks out the current, most recent version.

**10. B — Full copy loads all source data every run; Incremental loads only rows changed since the previous run.** This mirrors the same full-vs-incremental distinction from load strategy, but applied specifically as a configurable mode within the Copy job wizard.

**11. B — A Shared Access Signature (SAS) or Storage Account Key via the `CREDENTIAL` parameter.** This is required specifically for Azure storage account sources; by contrast, OneLake lakehouse folders authenticate automatically using your workspace identity, with no credential needed.

**12. B — It sends failed rows to a separate storage location instead of failing the whole load; applies only to CSV files.** This lets the bulk of a load succeed while you investigate problem rows separately afterward, rather than the entire `COPY INTO` operation failing over a handful of bad rows.

**13. A — CTAS creates a new table from a query result; `INSERT...SELECT` adds rows to an existing table.** Use CTAS when you need a brand-new table built from transformed or combined data; use `INSERT...SELECT` when the target table already exists and you're just adding to it.

**14. B — Append.** Append adds new rows to the existing table, which is exactly right for accumulating data over time like daily transaction logs. Replace would be appropriate instead for reference data that gets fully refreshed each run, like a product catalog.

**15. True.** The module states this directly — all warehouses in the same workspace share a single SQL connection endpoint, letting you reference any of them by name (via `database.schema.table`) just like databases on a SQL Server instance.

**16. False.** OneLake lakehouse folders authenticate automatically using your workspace identity — no credential parameter is needed for that source type, unlike Azure storage accounts which do require a SAS token or storage account key.

**17. True.** The module states this explicitly: Append is the only update method supported for KQL database and Azure Data Explorer destinations — Replace is not an option for those two destination types specifically (though it is available for other destinations like Fabric Warehouse).

**18. False.** Dataflow Gen2 automatically saves your work as a draft while you build, but changes only actually take effect once you select **Publish** — building alone doesn't activate anything.

**19. C — It should be marked as expired/inactive, and a new row should be inserted with the updated address.** This is exactly how type 2 SCD works: the existing record gets its `ValidTo`/`IsActive` status updated to mark it expired, and a brand-new row is inserted representing the current, updated version — preserving full history rather than losing the old address.

**20. B — `CREATE TABLE AS SELECT` (CTAS), joining across the warehouse and lakehouse using three-part naming.** This matches the scenario precisely: a brand-new table (which is what CTAS is for, versus `INSERT...SELECT` needing an existing table), built by joining data across a warehouse and a lakehouse using the `database.schema.table` naming pattern.

---

**Score guide:** 18–20 correct = strong grasp, ready to move to the next module. 14–17 = solid but review the SCD type 1 vs. type 2 distinction and the CTAS vs. INSERT...SELECT use cases. Below 14 = re-read units 2–5 before moving on.
