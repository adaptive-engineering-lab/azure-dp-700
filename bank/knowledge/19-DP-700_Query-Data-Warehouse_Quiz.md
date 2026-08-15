# DP-700 Practice Quiz — Query a Data Warehouse in Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/query-data-warehouse-microsoft-fabric/
Units covered: Query data | Use the SQL query editor | Explore the visual query editor | Use client tools to query a warehouse

DP-700 domains: **Ingest and transform data** (Transform data by using SQL; Group and aggregate data) | **Monitor and optimize** (Identify and resolve T-SQL errors) | **Implement and manage** (tooling/connectivity awareness)

---

## Section A — Multiple Choice

**1.** In a snowflake schema, why might a query need to join through an intermediate dimension table (like `DimProduct`) to reach a further-normalized table (like `DimCategory`), even if no columns from the intermediate table appear in the `SELECT` list?
A. It's optional; you could skip the intermediate join
B. Both joins are required to traverse the relationship chain connecting the fact table to the final dimension table
C. T-SQL requires listing every table in the `FROM` clause
D. Snowflake schemas don't support this kind of aggregation

**2.** Which ranking function returns the ordinal position of each row within a partition, with no ties (1, 2, 3, 4...)?
A. `RANK`
B. `DENSE_RANK`
C. `ROW_NUMBER`
D. `NTILE`

**3.** When two rows tie for 3rd place using `RANK`, what rank does the next (4th positioned) row receive?
A. 4
B. 5
C. 3
D. 1

**4.** When two rows tie for 3rd place using `DENSE_RANK`, what rank does the next row receive?
A. 5
B. 4
C. 3
D. 6

**5.** What does the `NTILE(4)` function return for each row in a partition?
A. The exact rank of the row
B. The quartile in which the row's value places it
C. The total count of rows in the partition
D. A boolean true/false value

**6.** What algorithm does `APPROX_COUNT_DISTINCT` use to calculate an approximate distinct count?
A. B-tree indexing
B. HyperLogLog
C. Bloom filter hashing
D. Round-robin sampling

**7.** What is the guaranteed maximum error rate for `APPROX_COUNT_DISTINCT`, and with what probability?
A. 2% error with 97% probability
B. 10% error with 90% probability
C. 0% error, fully guaranteed accurate
D. 50% error with 100% probability

**8.** When you run a query in the Fabric SQL query editor, how many rows does the Results preview show at most?
A. 100
B. 1,000
C. 10,000
D. Unlimited

**9.** Which results toolbar option in the SQL query editor does **NOT** support queries containing an `ORDER BY` clause?
A. Open in Excel
B. Explore this data
C. Visualize results
D. Copy

**10.** What is required before most of the SQL query editor's results toolbar options (like Open in Excel or Visualize results) become available?
A. Publishing the warehouse
B. Highlighting a `SELECT` statement in the editor
C. Enabling Copilot
D. Saving the query as a view first

**11.** What capacity requirement applies to using Copilot in the Fabric Data Warehouse SQL query editor?
A. Any SKU, including trial
B. F2 or P1 capacity or higher; not available on trial SKUs
C. Only P-series SKUs; F-series is not supported
D. No capacity requirement

**12.** In the visual query editor, what action lets you join two tables you've dragged onto the canvas?
A. Selecting Save as view
B. Right-clicking a table and selecting Merge queries
C. Using the `/generate-sql` Copilot command
D. Selecting Download Excel file

**13.** In the visual query editor, what happens to the T-SQL as you build your query visually?
A. Nothing; you must write it manually afterward
B. It is generated automatically and can be viewed or edited
C. It is hidden and inaccessible
D. It only becomes visible after publishing

**14.** What authentication method does Microsoft Fabric support for connecting to a warehouse via SSMS or other client tools?
A. SQL authentication only
B. Microsoft Entra ID authentication only; SQL authentication isn't supported
C. Both SQL authentication and Entra ID, with SQL preferred
D. Anonymous access only

---

## Section B — True / False

**15.** When connecting to a Fabric warehouse from SSMS, leaving the Database Name field blank is fine as long as authentication succeeds. **(True/False)**

**16.** TCP port 1433 must be open in your network firewall to connect to a Fabric warehouse from external client tools. **(True/False)**

**17.** The SQL query editor in Fabric requires you to manually enter a connection string to connect to your warehouse. **(True/False)**

**18.** Third-party tools can connect to a Fabric Warehouse or SQL analytics endpoint using ODBC or OLE DB drivers with Microsoft Entra ID authentication. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**19.** You want to rank stores by sales revenue each year, but you specifically need ties to NOT create gaps in the ranking sequence (e.g., two stores tied for 2nd should be followed by a store ranked 3rd, not 4th). Which ranking function should you use?
A. `ROW_NUMBER`
B. `RANK`
C. `DENSE_RANK`
D. `NTILE`

**20.** You need to quickly estimate the number of distinct customers who placed orders last year across a very large `FactSales` table, and exact precision isn't critical for this initial exploration — query speed matters more. What should you use?
A. `COUNT(DISTINCT CustomerKey)`
B. `APPROX_COUNT_DISTINCT(CustomerKey)`
C. `ROW_NUMBER() OVER (PARTITION BY CustomerKey)`
D. `NTILE(100)`

---

## Answer Key & Rationale

**1. B — Both joins are required to traverse the relationship chain connecting the fact table to the final dimension table.** In a snowflake schema, `DimCategory` only connects to `FactSales` *through* `DimProduct` — even with zero columns from `DimProduct` in the `SELECT` list, the join is structurally necessary to reach `DimCategory` at all.

**2. C — `ROW_NUMBER`.** It assigns a strictly sequential position (1, 2, 3, 4...) within each partition, with no accommodation for ties — even identical values get different numbers.

**3. B — 5.** `RANK` counts ties as consuming positions: two rows tied for 3rd mean the next distinct value is ranked 5th (since two rows occupy "3rd"), reflecting that four rows total rank higher or equal.

**4. B — 4.** `DENSE_RANK` doesn't leave gaps — after a tie at 3rd, the next distinct value is simply 4th, regardless of how many rows shared the previous rank.

**5. B — The quartile in which the row's value places it.** `NTILE(4)` divides the partition into four roughly equal groups and returns which group (1–4) each row falls into — useful for percentile-style analysis like identifying top/bottom performers.

**6. B — HyperLogLog.** This probabilistic algorithm is what powers `APPROX_COUNT_DISTINCT`'s fast approximate counting, trading some precision for significant speed on large datasets.

**7. A — 2% error with 97% probability.** This is the specific guarantee stated for `APPROX_COUNT_DISTINCT` — a bounded, known trade-off rather than an unpredictable one, which is what makes it usable for exploratory analysis.

**8. C — 10,000.** The Results preview in the SQL query editor is capped at this many rows if the actual result set exceeds it.

**9. C — Visualize results.** This option explicitly doesn't support queries with an `ORDER BY` clause — a specific limitation worth remembering, since the other toolbar options (Open in Excel, Explore this data, Copy) don't have this restriction.

**10. B — Highlighting a `SELECT` statement in the editor.** Most results toolbar options require you to select the specific `SELECT` statement first, especially relevant when your editor contains multiple queries or statements.

**11. B — F2 or P1 capacity or higher; not available on trial SKUs.** This matches the requirement from the dedicated Copilot module — trial SKUs specifically don't support Copilot in Data Warehouse.

**12. B — Right-clicking a table and selecting Merge queries.** This opens the Merge dialog where you pick the common key column in each table and choose a join type — the visual equivalent of writing a `JOIN` clause by hand.

**13. B — It is generated automatically and can be viewed or edited.** You can select **View SQL** to inspect the generated T-SQL, or **Edit SQL script** to open it directly in the SQL query editor for further manual refinement.

**14. B — Microsoft Entra ID authentication only; SQL authentication isn't supported.** This is stated explicitly and applies uniformly — whether connecting via SSMS or any other client tool.

**15. False.** The Database Name field is explicitly required — leaving it blank can cause the connection to fail even if Entra ID authentication itself succeeds.

**16. True.** TCP port 1433 needs to be open in your network firewall for external client tool connectivity to a Fabric warehouse to work.

**17. False.** The SQL query editor connects automatically when you select your warehouse from the workspace — no connection string or manual connection info is required, unlike external tools like SSMS which do need one.

**18. True.** Any third-party tool can connect via ODBC or OLE DB drivers using the SQL connection string, authenticating with Microsoft Entra ID — the same authentication requirement that applies across all client tool connections to Fabric.

**19. C — `DENSE_RANK`.** This is exactly the behavior needed: ties don't consume extra rank positions, so the ranking sequence continues without gaps after a tie — unlike `RANK`, which would skip ahead based on how many rows tied.

**20. B — `APPROX_COUNT_DISTINCT(CustomerKey)`.** This matches the scenario precisely: fast, approximate counting for large-scale exploratory analysis where exact precision isn't the priority — trading a small, bounded error rate (2% at 97% probability) for significantly better performance than a precise `COUNT(DISTINCT ...)`.

---

**Score guide:** 18–20 correct = strong grasp, ready to move to the next module. 14–17 = solid but review the RANK vs. DENSE_RANK tie-handling behavior and the SQL query editor's results toolbar limitations. Below 14 = re-read units 2–5 before moving on.
