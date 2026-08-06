# DP-700 Practice Quiz — Introduction to End-to-End Analytics Using Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/introduction-end-analytics-use-microsoft-fabric/
Units covered: Explore end-to-end analytics with Microsoft Fabric | Explore data teams and Microsoft Fabric | Enable and use Microsoft Fabric

DP-700 domain: **Implement and manage an analytics solution** (Fabric workspace settings, governance, roles) — foundational context for the rest of the exam's technical objectives.

---

## Section A — Multiple Choice

**1.** What is OneLake in Microsoft Fabric?
A. A reporting tool for building dashboards
B. Fabric's centralized data storage architecture built on ADLS Gen2
C. A Spark compute engine
D. A KQL database type

**2.** What underlying Azure storage technology is OneLake built on?
A. Azure Blob Storage (classic)
B. Azure Data Lake Storage Gen2
C. Azure SQL Database
D. Azure Cosmos DB

**3.** What format do Fabric's analytical engines use to write tabular data in OneLake?
A. CSV
B. JSON
C. Delta-Parquet
D. Avro

**4.** What is the purpose of a "shortcut" in OneLake?
A. To physically copy data into a new workspace for faster access
B. To reference files or storage locations without copying the data
C. To encrypt sensitive data automatically
D. To convert data into Delta format

**5.** In Fabric, what is a workspace primarily used for?
A. A logical container for organizing and managing data, reports, and other assets, with its own permissions
B. A single physical server dedicated to one user
C. A billing unit only, with no access control function
D. A backup location for OneLake

**6.** Where is Fabric administration centralized?
A. The OneLake catalog
B. The Admin portal
C. Power BI Desktop
D. The Data Factory workload

**7.** What does the OneLake catalog help you do?
A. Write PySpark code
B. Analyze, monitor, and maintain data governance, and discover data shared with you
C. Configure Spark pool autoscale settings
D. Create Eventhouses

**8.** Which role can enable Microsoft Fabric for an organization via implicit, organization-wide permissions?
A. Workspace viewer
B. Workspace contributor
C. Global administrator
D. Data analyst

**9.** Which of the four workspace-level roles would you assign to someone who needs to view items but not modify them?
A. Admin
B. Contributor
C. Member
D. Viewer

**10.** According to the module, which persona curates data assets in lakehouses, ensures data quality, and creates semantic models to enable self-service analytics?
A. Data engineer
B. Analytics engineer
C. Data scientist
D. Citizen developer

**11.** Which Fabric capability lets data analysts connect directly to OneLake data, reducing the need for downstream transformations?
A. Direct Lake mode
B. Import mode only
C. DirectQuery to Azure SQL
D. Dataflow Gen1 mode

**12.** What is the core item in the Fabric IQ workload that defines business concepts, relationships, and rules for AI agents?
A. A semantic model
B. An ontology
C. A materialized view
D. A Dataflow Gen2

---

## Section B — True / False

**13.** Workspace-level roles (admin, contributor, member, viewer) apply to all items in a workspace, while item-level permissions allow more granular access control. **(True/False)**

**14.** Copilot in Microsoft Fabric must be manually enabled by an administrator before any user can access it — it is disabled by default. **(True/False)**

**15.** Fabric IQ, Foundry IQ, and Work IQ are mutually exclusive — an organization can only use one at a time. **(True/False)**

**16.** The OneLake catalog only shows items that have been shared with the signed-in user. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**17.** A citizen developer in the marketing department wants to quickly build a report from existing curated data without writing code or relying on a data engineer. Which combination of Fabric capabilities best supports this?
A. Writing custom PySpark notebooks and Spark job definitions
B. Discovering data via the OneLake catalog and using Power BI templates / dataflows for simple ETL
C. Creating a KQL database and writing KQL queries
D. Requesting elevated workspace admin permissions

**18.** Your organization wants an AI agent that can answer natural-language questions about sales data using consistent business terminology (e.g., "revenue," "customer churn") rather than raw table and column names. Which Fabric capability is purpose-built for this?
A. A Dataflow Gen2
B. A Fabric data agent connected to a Fabric IQ ontology
C. A Spark job definition
D. An Eventstream

---

## Answer Key & Rationale

**1. B — Fabric's centralized data storage architecture built on ADLS Gen2.** OneLake unifies data across regions and clouds into a single logical lake without moving or duplicating it — every Fabric compute engine reads/writes here.

**2. B — Azure Data Lake Storage Gen2 (ADLS Gen2).** This is the foundation OneLake is built on, supporting formats including Delta, Parquet, CSV, and JSON.

**3. C — Delta-Parquet.** For tabular data specifically, Fabric's analytical engines write in delta-parquet format, and all engines interact with it seamlessly.

**4. B — To reference files or storage locations without copying the data.** Shortcuts point to data in OneLake or external sources (Azure Data Lake Storage, Amazon S3, Dataverse) while keeping it in sync with the source, avoiding duplication.

**5. A — A logical container for organizing and managing data, reports, and other assets, with its own permissions.** Workspaces provide separation of resources and control access, supporting both collaboration and security.

**6. B — The Admin portal.** This is where Fabric administrators manage groups/permissions, configure data sources and gateways, and monitor usage and performance.

**7. B — Analyze, monitor, and maintain data governance, and discover data shared with you.** The OneLake catalog surfaces sensitivity labels, item metadata, and refresh status — but only for items actually shared with you.

**8. C — Global administrator.** Global admins have implicit Fabric admin rights through organization-wide permissions, distinct from a dedicated Fabric administrator or Power Platform administrator role (both of which can also enable Fabric, but not via *implicit* org-wide rights).

**9. D — Viewer.** The four workspace roles are admin, contributor, member, and viewer — viewer is the read-only tier, appropriate for someone who only needs to see content.

**10. B — Analytics engineer.** This role explicitly bridges data engineering and analysis — curating lakehouse assets, ensuring quality, and building semantic models for self-service. *(Data engineers ingest/transform/load; data scientists build ML models; citizen developers consume curated data, not curate it.)*

**11. A — Direct Lake mode.** This lets data analysts connect straight to OneLake data, cutting down on the downstream transformation work otherwise needed before building reports.

**12. B — An ontology.** The ontology defines business concepts, relationships, and rules, letting AI agents reason using consistent business language instead of raw table schemas.

**13. True.** Workspace roles govern access at the whole-workspace level; item-level permissions layer on top for more granular, business-need-specific control.

**14. False.** Copilot in Microsoft Fabric is **enabled by default** — administrators have the option to disable it (tenant-wide, by security group, or by capacity), not the other way around.

**15. False.** The three IQ workloads (Fabric IQ, Foundry IQ, Work IQ) are each standalone, but the module explicitly states they can be used *together* to provide comprehensive organizational context for agents — they aren't mutually exclusive.

**16. True.** The module states explicitly: in the OneLake catalog, you only see items that have been shared with you.

**17. B — Discovering data via the OneLake catalog and using Power BI templates / dataflows for simple ETL.** This matches the module's description of low-to-no-code users and citizen developers directly — no notebooks, no KQL, and no elevated admin rights needed.

**18. B — A Fabric data agent connected to a Fabric IQ ontology.** Data agents translate natural-language questions into structured queries, and when connected to an ontology in Fabric IQ, they understand and use business concepts (like "revenue") rather than needing users to know raw schema names.

---

**Score guide:** 16–18 correct = strong grasp, ready to move to the next module. 12–15 = solid but review the data-team personas and the IQ workloads (Fabric IQ vs. Foundry IQ vs. Work IQ). Below 12 = re-read units 2–4 before moving on.
