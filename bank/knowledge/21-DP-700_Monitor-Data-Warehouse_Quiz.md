# DP-700 Practice Quiz — Monitor a Microsoft Fabric Data Warehouse

Source module: https://learn.microsoft.com/en-us/training/modules/monitor-fabric-data-warehouse/
Units covered: Monitor capacity metrics | Monitor current activity | Monitor queries

DP-700 domain: **Monitor and optimize an analytics solution** — "Monitor data ingestion," "Optimize a data warehouse," and "Identify and resolve T-SQL errors" specifically.

---

## Section A — Multiple Choice

**1.** What determines the capacity available to an organization in Microsoft Fabric?
A. The number of workspaces created
B. The license used to purchase the service
C. The number of registered users
D. The region selected during setup

**2.** What are Capacity Units (CUs) used to measure?
A. Storage space only
B. The cost/consumption of actions performed in Fabric resources, billed to the organization
C. The number of DMVs available
D. The number of concurrent users

**3.** In data warehouse workloads specifically, what activities are the most significant factor in CU consumption?
A. Workspace role assignments
B. Data read and write activities — queries and underlying OneLake file operations
C. Dashboard tile rendering
D. Git commits

**4.** Who installs the Microsoft Fabric Capacity Metrics app?
A. Any workspace Viewer
B. An administrator
C. It's installed automatically with every warehouse
D. Only Microsoft support can install it

**5.** What does "throttling" indicate, as identified using the Capacity Metrics app?
A. A query has a syntax error
B. Your processes require more capacity than is available within your purchased capacity license
C. A user lacks sufficient item permissions
D. A table has too many small files

**6.** Which DMV returns information specifically about data warehouse connections?
A. `sys.dm_exec_sessions`
B. `sys.dm_exec_requests`
C. `sys.dm_exec_connections`
D. `queryinsights.exec_requests_history`

**7.** Which DMV returns information about authenticated sessions?
A. `sys.dm_exec_connections`
B. `sys.dm_exec_sessions`
C. `sys.dm_exec_requests`
D. `queryinsights.long_running_queries`

**8.** Which DMV returns information about active requests currently running?
A. `sys.dm_exec_connections`
B. `sys.dm_exec_sessions`
C. `sys.dm_exec_requests`
D. `queryinsights.frequently_run_queries`

**9.** Which query insights view provides details of each completed SQL query?
A. `queryinsights.long_running_queries`
B. `queryinsights.frequently_run_queries`
C. `queryinsights.exec_requests_history`
D. `sys.dm_exec_requests`

**10.** Which query insights view specifically helps identify commonly used queries, including their success/failure counts?
A. `queryinsights.exec_requests_history`
B. `queryinsights.long_running_queries`
C. `queryinsights.frequently_run_queries`
D. `sys.dm_exec_sessions`

---

## Section B — True / False

**11.** Query insights data can take up to 15 minutes to be reflected in the views, depending on concurrent workloads. **(True/False)**

**12.** Queries with different literal predicate values (e.g., different date filters) are always treated as completely separate, unrelated queries in the `frequently_run_queries` and `long_running_queries` views. **(True/False)**

**13.** DMVs like `sys.dm_exec_requests` show the current, real-time state of the data warehouse, while query insights views show historical, aggregated data. **(True/False)**

**14.** The Microsoft Fabric Capacity Metrics app can be filtered to show only warehouse-specific activity. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**15.** You want to identify which currently-running query in your warehouse has been executing the longest, so you can investigate a possible performance issue happening right now. Which approach should you use?
A. Query `queryinsights.long_running_queries`
B. Join `sys.dm_exec_connections`, `sys.dm_exec_sessions`, and `sys.dm_exec_requests`, filtering to `status = 'running'`, ordered by `total_elapsed_time`
C. Open the Fabric Capacity Metrics app
D. Query `queryinsights.frequently_run_queries`

**16.** Your organization suspects it may need to upgrade its Fabric capacity license because certain warehouse workloads seem to be getting throttled during peak hours. What tool should you use to confirm this and observe capacity utilization trends over time?
A. `sys.dm_exec_requests`
B. The Microsoft Fabric Capacity Metrics app
C. `queryinsights.exec_requests_history`
D. The Visual query editor

---

## Answer Key & Rationale

**1. B — The license used to purchase the service.** A capacity is a pool of resources tied to your organization's Fabric license, and it determines what's available to implement Fabric capabilities.

**2. B — The cost/consumption of actions performed in Fabric resources, billed to the organization.** Every action you take in a Fabric resource can consume CUs, which is how usage translates into billing.

**3. B — Data read and write activities — queries and underlying OneLake file operations.** For data warehouses specifically, this is called out as the significant factor in cost, since every query touches data stored in OneLake.

**4. B — An administrator.** The Capacity Metrics app is something an administrator installs in the Fabric environment to monitor capacity utilization across the organization.

**5. B — Your processes require more capacity than is available within your purchased capacity license.** Throttling is the signal that your workloads have outgrown what your current capacity license supports — useful for deciding whether to optimize processes or upgrade capacity.

**6. C — `sys.dm_exec_connections`.** This DMV returns information specifically about data warehouse connections — the network/connection layer, distinct from sessions or requests.

**7. B — `sys.dm_exec_sessions`.** This returns information about authenticated sessions — the logged-in user layer, sitting between connections and requests.

**8. C — `sys.dm_exec_requests`.** This returns information about active requests — the actual queries/commands currently executing.

**9. C — `queryinsights.exec_requests_history`.** This view provides details of each completed SQL query, giving you a historical record to query against — e.g., filtering to queries run in the last hour.

**10. C — `queryinsights.frequently_run_queries`.** This view specifically surfaces commonly used queries along with their run counts and success/failure breakdowns — distinct from `long_running_queries`, which focuses on execution time rather than frequency.

**11. True.** The module notes this explicitly — depending on concurrent workloads, it can take up to 15 minutes for queries to show up in the query insights views, so don't expect instant reflection of very recent activity.

**12. False.** Queries with predicates are parameterized, and if the parameterized statements are an exact match, they're treated as the *same* command for aggregation purposes — e.g., `WHERE orderdate > '01/01/2023'` and `WHERE orderdate > '12/31/2021'` count as the same query with different parameter values, not two unrelated queries.

**13. True.** DMVs reflect the current, real-time state (active connections, sessions, running requests), while query insights views are built for historical, aggregated analysis of queries that have already completed — two different monitoring purposes for two different timeframes.

**14. True.** The Capacity Metrics app interface can be filtered to show only warehouse activity specifically, letting you isolate warehouse-related CU consumption from other Fabric workloads.

**15. B — Join `sys.dm_exec_connections`, `sys.dm_exec_sessions`, and `sys.dm_exec_requests`, filtering to `status = 'running'`, ordered by `total_elapsed_time`.** This is exactly the module's worked example — DMVs show real-time active state, which is what you need for a query that's happening *right now*, as opposed to query insights (A), which is historical and can lag up to 15 minutes behind.

**16. B — The Microsoft Fabric Capacity Metrics app.** This is purpose-built for observing capacity utilization trends and identifying throttling, giving you the evidence needed to decide whether to optimize processes or upgrade the capacity license.

---

**Score guide:** 14–16 correct = strong grasp, ready to move to the next module. 10–13 = solid but review the three DMVs vs. the three query insights views — they're easy to mix up since both monitor "queries" but at different timeframes. Below 10 = re-read units 2–4 before moving on.
