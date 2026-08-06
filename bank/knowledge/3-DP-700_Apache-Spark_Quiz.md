# DP-700 Practice Quiz — Use Apache Spark in Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/use-apache-spark-work-files-lakehouse/
Units covered: Prepare to use Apache Spark | Run Spark code | Work with data in a Spark dataframe | Work with data using Spark SQL | Visualize data in a Spark notebook

DP-700 domains: **Implement and manage** (Configure Spark workspace settings) | **Ingest and transform data** (Transform data by using PySpark, SQL, and KQL) | **Monitor and optimize** (Optimize Spark performance)

---

## Section A — Multiple Choice

**1.** What is a Spark pool in Microsoft Fabric?
A. A single virtual machine dedicated to one notebook
B. A cluster of compute nodes that distribute data processing tasks
C. A storage container for Parquet files
D. A destination type for a Dataflow Gen2

**2.** In a Spark pool's architecture, which node coordinates distributed processes through a driver program?
A. Worker node
B. Executor node
C. Head node
D. Storage node

**3.** What is the purpose of the "starter pool" provided in every Fabric workspace?
A. It's a training sandbox with no real data access
B. It enables Spark jobs to start and run quickly with minimal setup
C. It's only used for Spark job definitions, never notebooks
D. It replaces the need for custom Spark pools entirely

**4.** Which Spark pool configuration setting controls whether nodes are automatically provisioned as needed (and the min/max node count)?
A. Node Family
B. Autoscale
C. Dynamic allocation
D. High concurrency mode

**5.** What does "dynamic allocation" specifically control in a Spark pool?
A. Which virtual machine type is used for nodes
B. Whether executor processes on worker nodes scale based on data volume
C. Whether MLFlow logging is enabled
D. The default Spark runtime version

**6.** What is the primary benefit of enabling the native execution engine in Microsoft Fabric?
A. A vectorized processing engine that improves performance on large Parquet/Delta datasets
B. It manages user authentication for Spark pools
C. It eliminates the need for a Spark pool
D. It converts PySpark code into T-SQL automatically

**7.** What does high concurrency mode allow multiple users or processes to do?
A. Edit the exact same notebook cell simultaneously
B. Share a Spark session for efficient resource use, while keeping code execution isolated
C. Bypass workspace-level access controls
D. Automatically merge each other's dataframes

**8.** What does a Spark **runtime** determine, as distinct from an environment?
A. Which libraries a user has manually installed
B. The version of Apache Spark, Delta Lake, Python, and other core components
C. The Fabric capacity SKU
D. The workspace's security role assignments

**9.** When should you use a Spark job definition rather than a notebook?
A. When you want to interactively explore data with immediate visual feedback
B. When you want to run Spark code as an automated, on-demand or scheduled process
C. When you only need markdown documentation, no code
D. When you want to avoid using PySpark entirely

**10.** What is a key benefit of specifying an explicit schema when loading a dataframe (versus letting Spark infer it)?
A. It's the only way Spark can read a CSV file
B. It improves performance and is useful when column headers aren't present in the source file
C. It automatically partitions the output
D. It converts the data to Delta format

**11.** Which magic command tells a Fabric notebook cell to run PySpark code?
A. `%%sql`
B. `%%spark`
C. `%%pyspark`
D. `%%python`

**12.** Which file format is preferred in Microsoft Fabric for Spark tables, due to support for transactions, versioning, and streaming data?
A. CSV
B. JSON
C. Delta
D. Avro

---

## Section B — True / False

**13.** Deleting a managed table in the Spark catalog also deletes its underlying data. **(True/False)**

**14.** A temporary view created with `createOrReplaceTempView` persists permanently across all future Spark sessions. **(True/False)**

**15.** Matplotlib can plot directly from a Spark dataframe without any conversion. **(True/False)**

**16.** Partitioning a saved dataframe (e.g., with `partitionBy`) can improve query performance by reducing unnecessary disk I/O when filtering. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**17.** You want multiple data analysts to interactively explore a dataset, mixing markdown commentary with executable code cells, and see results immediately as they iterate. What's the best tool for this?
A. A scheduled Spark job definition
B. A notebook combining markdown and executable code cells
C. A Delete data pipeline activity
D. A Copy Data activity

**18.** You have a CSV file with **no header row** containing product data, and you want correct data types and the best possible load performance — without relying entirely on Spark's automatic inference. What should you do?
A. Load with `header=True` and let Spark infer all types
B. Define an explicit `StructType` schema and pass it when loading the dataframe
C. Convert the CSV to JSON before loading
D. Load the data into a temporary view instead of a dataframe

---

## Answer Key & Rationale

**1. B — A cluster of compute nodes that distribute data processing tasks.** Spark uses a "divide and conquer" approach across multiple nodes, known in Fabric as a Spark pool.

**2. C — Head node.** The head node coordinates distributed processes through a driver program; worker nodes run executor processes that do the actual data processing.

**3. B — It enables Spark jobs to start and run quickly with minimal setup.** Every Fabric workspace gets a starter pool by default, configurable to your workload/cost needs; custom pools are optional additions, not replacements.

**4. B — Autoscale.** Autoscale governs automatic node provisioning and the initial/maximum node count. Dynamic allocation is a related but distinct setting (see Q5).

**5. B — Whether executor processes on worker nodes scale based on data volume.** This is distinct from Autoscale, which is about provisioning *nodes* rather than *executor processes* on existing nodes.

**6. A — A vectorized processing engine that improves performance on large Parquet/Delta datasets.** It runs Spark operations directly on lakehouse infrastructure for significant performance gains on those formats.

**7. B — Share a Spark session for efficient resource use, while keeping code execution isolated.** This avoids variables in one notebook affecting another, even while sharing underlying session resources.

**8. B — The version of Apache Spark, Delta Lake, Python, and other core components.** An *environment* builds on a runtime by adding specific libraries and configuration — the runtime itself is about core component versions.

**9. B — When you want to run Spark code as an automated, on-demand or scheduled process.** Notebooks are for interactive exploration; Spark job definitions are for automated script execution.

**10. B — It improves performance and is useful when column headers aren't present in the source file.** The module states this explicitly — plus it's necessary when there's no header row to infer column names from.

**11. C — `%%pyspark`.** `%%spark` is actually used for Scala, not PySpark — a common mix-up worth remembering directly for the exam.

**12. C — Delta.** Delta Lake format supports transactions, versioning, and streaming data — it's the preferred format for Spark tables in Fabric, more capable than plain Parquet, CSV, or JSON for this use.

**13. True.** Managed tables store their underlying data in the catalog's associated storage location; deleting the table deletes that data too. (External tables behave differently — deleting them removes only the metadata, not the underlying files.)

**14. False.** A view is temporary — it's automatically deleted at the end of the current session, not persisted permanently. Persisted objects are *tables*, not views.

**15. False.** Matplotlib requires data in a **Pandas** dataframe, not a Spark dataframe — you need to call `.toPandas()` to convert it first before charting.

**16. True.** Partitioning is explicitly called out as an optimization technique that reduces unnecessary disk I/O when queries filter on the partitioning column, improving performance across worker nodes.

**17. B — A notebook combining markdown and executable code cells.** This is exactly what notebooks are designed for: interactive, collaborative exploration with immediate results and mixed content types. A Spark job definition (A) is for automated/scheduled execution, not interactive iteration.

**18. B — Define an explicit `StructType` schema and pass it when loading the dataframe.** Since there's no header row, Spark can't infer column names, and explicit schemas both solve that problem and improve performance versus relying on inference. (A doesn't apply since there's no header to read; C and D don't address the schema/performance need at all.)

---

**Score guide:** 16–18 correct = strong grasp, ready to move to the next module. 12–15 = solid but review Spark pool settings (Autoscale vs. Dynamic allocation) and the managed vs. external table distinction. Below 12 = re-read units 2–6 before moving on.
