# DP-700 Practice Quiz — Orchestrate Processes and Data Movement with Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/use-data-factory-pipelines-fabric/
Units covered: Understand pipelines | Use the Copy Data activity | Use pipeline templates | Run and monitor pipelines

DP-700 domains: **Implement and manage** (orchestration, schedules/triggers) | **Ingest and transform data** (ingest by using pipelines) | **Monitor and optimize** (monitor/resolve pipeline errors)

---

## Section A — Multiple Choice

**1.** What is the fundamental unit of work inside a Fabric pipeline that performs data movement or processing?
A. A query
B. An activity
C. A notebook cell
D. A dataflow step

**2.** Which of the following is classified as a *control flow* activity rather than a data transformation activity?
A. Copy Data
B. Notebook
C. Loop / conditional branching
D. Stored procedure

**3.** Which activity would you use to run Spark code as part of a pipeline?
A. Data Flow activity
B. Copy Data activity
C. Notebook activity
D. Delete data activity

**4.** What is the primary purpose of parameterizing a pipeline?
A. To improve Spark cluster performance
B. To increase reusability by supplying different values on each run
C. To enable row-level security
D. To reduce the number of activities needed

**5.** What is initiated each time a pipeline executes?
A. A dataflow refresh
B. A data pipeline run
C. A semantic model refresh
D. A Git commit

**6.** According to the module, what should you use a **Copy Data** activity for?
A. Applying complex transformations while merging multiple sources
B. Copying data directly between a supported source and destination with no transformation
C. Running Python-based machine learning models
D. Enforcing object-level security on a warehouse

**7.** If you need to apply transformations to data as it's being ingested, or merge data from multiple sources, which activity type does the module recommend instead of Copy Data?
A. Delete data activity
B. Get metadata activity
C. Data Flow activity (running a Dataflow Gen2)
D. Stored procedure activity

**8.** How do you start creating a pipeline based on a predefined Microsoft Fabric template?
A. Import a Python script
B. Select the Templates tile when creating a new pipeline
C. Write a JSON definition manually
D. Use the Advanced editor in Power Query

**9.** Before running a pipeline, what option can you use to check that its configuration is correct?
A. Refresh
B. Validate
C. Compile
D. Publish

**10.** Where can you view the run history of a pipeline?
A. Only from the Fabric admin portal
B. From the pipeline canvas or the pipeline item in the workspace
C. Only through the REST API
D. From the Power BI Desktop navigator

---

## Section B — True / False

**11.** A single pipeline can only contain one activity — Copy Data — and nothing else. **(True/False)**

**12.** Pipeline runs can be triggered on-demand or scheduled to run at a specific frequency. **(True/False)**

**13.** Pipeline templates in Microsoft Fabric are fixed and cannot be edited or customized after selection. **(True/False)**

**14.** The Copy Data activity supports a wide range of source connections, including lakehouse, warehouse, and SQL Database within OneLake. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**15.** You need a repeatable process that: (1) deletes stale data, (2) copies fresh data in from an external source, and (3) runs Spark code to transform it into a table. Which combination of activities fits this scenario, per the module?
A. A single Copy Data activity only
B. Delete data activity → Copy Data activity → Notebook activity
C. Data Flow activity only, with no other activities
D. Stored procedure activity → Get metadata activity

**16.** Your data needs light transformation and merging from two different sources as it's ingested into the lakehouse, with no need for further Spark processing afterward. What's the most appropriate single-activity approach?
A. Copy Data activity, since it supports all transformation types
B. Data Flow activity referencing a Dataflow Gen2 with the transformation/merge logic built in
C. Notebook activity using PySpark exclusively
D. Delete data activity followed by manual reload

---

## Answer Key & Rationale

**1. B — An activity.** Activities are the executable tasks in a pipeline; they're connected in sequence to define the pipeline's flow.

**2. C — Loop / conditional branching.** Control flow activities manage branching, looping, and variable/parameter logic. Copy Data, Notebook, and Stored procedure are all data transformation activities.

**3. C — Notebook activity.** Notebook activities run Spark code as part of a pipeline. *(Data Flow runs a Dataflow Gen2, Copy Data moves data without transforming, Delete data removes existing data.)*

**4. B — To increase reusability by supplying different values on each run.** For example, specifying a different folder name each run without editing the pipeline itself.

**5. B — A data pipeline run.** Each execution initiates a run, identified by a unique run ID you can use to review details and confirm success.

**6. B — Copying data directly between a supported source and destination with no transformation.** That's the stated primary use case — moving raw data, with transformations optionally applied in later activities. *(A describes when to use Data Flow instead.)*

**7. C — Data Flow activity (running a Dataflow Gen2).** The module explicitly recommends this for transformation-as-you-ingest or merging multiple sources scenarios, using the Power Query interface to define the transformation logic.

**8. B — Select the Templates tile when creating a new pipeline.** This surfaces a selection of predefined templates you can pick and then customize in the canvas.

**9. B — Validate.** This checks that the pipeline's configuration is valid before you run it interactively or put it on a schedule.

**10. B — From the pipeline canvas or the pipeline item in the workspace.** Run history is accessible from either location. *(A, C, D are not stated as the (only) access points.)*

**11. False.** A pipeline can contain any combination of activities — data transformation and control flow — chosen to meet the specific need; Copy Data is common but not exclusive.

**12. True.** Runs can be started on-demand in the Fabric UI or scheduled to run at a specific frequency.

**13. False.** Templates are a starting point — you select one and then edit it in the pipeline canvas to customize it to your needs.

**14. True.** In OneLake, Copy Data supports lakehouse, warehouse, SQL Database, and other destination/source types.

**15. B — Delete data activity → Copy Data activity → Notebook activity.** This is the exact example the module gives: delete existing data, copy in the replacement from an external source, then run Spark code via a Notebook activity to transform and load it into a table.

**16. B — Data Flow activity referencing a Dataflow Gen2 with the transformation/merge logic built in.** The module is explicit: for transformations during ingestion or merging multiple sources, use a Data Flow activity running a Dataflow Gen2, rather than Copy Data (which doesn't transform) or a standalone Notebook (more coding overhead for a task Power Query already handles visually).

---

**Score guide:** 14–16 correct = strong grasp, ready to move to the next module. 10–13 = solid but review Copy Data vs. Data Flow activity distinction. Below 10 = re-read units 2–5 before moving on.
