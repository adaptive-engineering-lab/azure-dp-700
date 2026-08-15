# DP-700 Practice Quiz — Monitor activities in Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/monitor-fabric-items/
Units covered: Understand monitoring | Use the Microsoft Fabric monitoring hub | Respond to Fabric events with Activator

DP-700 domain: **Monitor and optimize an analytics solution** — "Monitor Fabric items" specifically (monitor data ingestion, transformation and semantic model refresh; configure alerts), plus the diagnostic groundwork for "Identify and resolve errors."

---

## Section A — Multiple Choice

**1.** What does monitoring in Microsoft Fabric fundamentally provide?

A. A way to reduce the capacity units a workspace consumes.
B. Data about whether activities succeed, fail, or degrade over time.
C. Automatic correction of failed pipeline activities.
D. A replacement for source control on Fabric items.

**2.** A data pipeline reports an overall status of Succeeded, yet downstream reports show stale data. What should you check first?

A. The capacity metrics app for throttling events.
B. The status of each individual activity inside the pipeline.
C. The workspace sensitivity labels.
D. The semantic model's row-level security rules.

**3.** A semantic model refresh succeeds, but its retry count has been climbing week over week. What does this most likely indicate?

A. The model is too small to refresh reliably.
B. An emerging problem with the data source connection.
C. The refresh schedule is set too infrequently.
D. The workspace has exceeded its item limit.

**4.** How do eventstreams differ from batch activities when it comes to monitoring?

A. They run continuously, so you monitor throughput, latency, and error rates.
B. They cannot be monitored from the monitoring hub at all.
C. They only need monitoring when a pipeline invokes them.
D. They report a single duration value at completion like any other job.

**5.** Where do you open the monitoring hub in the Fabric portal?

A. From the workspace settings under the Monitoring tab.
B. By selecting Monitor in the left navigation pane.
C. From the Real-Time hub's Fabric events page.
D. From the OneLake catalog.

**6.** An activity in the monitoring hub shows a status of Cancelled. What does that mean?

A. The activity completed but produced no rows.
B. The activity failed validation before it started.
C. Something stopped the activity before it finished.
D. The activity is queued behind a higher-priority job.

**7.** An activity has a status of In progress far longer than usual. What is the reasonable interpretation?

A. The status is cosmetic and always clears on the next refresh.
B. The job has already failed and the status is stale.
C. It might be stuck, or processing an unusually large dataset.
D. The activity was cancelled but the hub has not updated.

**8.** How far back does the monitoring hub display run history for an item?

A. 7 days
B. 30 days
C. 90 days
D. The full lifetime of the item

**9.** Which question is the historical runs view best suited to answering?

A. Which users currently have Contributor access to the workspace.
B. How many capacity units the workspace has left this month.
C. When an activity started failing, and whether it is getting slower.
D. Which columns a lakehouse table contains.

**10.** In a busy workspace the activity list is long. Which two filters does the monitoring hub offer to narrow it?

A. Status and item type
B. Sensitivity label and endorsement
C. Owner and capacity region
D. Table name and row count

**11.** Which monitoring hub column tells you whether a run was started by a user, a schedule, or a pipeline?

A. Location
B. Duration
C. Submitted by
D. End time

**12.** What role do you need in a workspace to configure failure notifications on the Schedule failures page?

A. Viewer
B. Contributor
C. Tenant administrator
D. Capacity administrator

**13.** What does Fabric create in your workspace when you enable workspace monitoring?

A. A lakehouse with a Delta table of activity logs.
B. An Eventhouse database that collects diagnostic logs and metrics.
C. A deployment pipeline linked to the workspace.
D. A Power BI dashboard of capacity metrics.

**14.** Which capability makes Activator different from the Schedule failures notification page?

A. It can email a list of recipients when a scheduled item fails.
B. It can run a Fabric activity such as a notebook or pipeline in response to an event.
C. It retains diagnostic logs for 30 days.
D. It centrally manages notification recipients for every scheduled item.

---

## Section B — True / False

**15.** Workspace monitoring stores raw log data that you can query with KQL or SQL, unlike the monitoring hub's visual view of recent activity. **(True/False)**

**16.** Establishing a monitoring baseline means recording duration and status over time so you can tell when a run has deviated from normal. **(True/False)**

**17.** Activator can react only to job failures, not to jobs that succeed. **(True/False)**

**18.** Automatically re-running a pipeline through Activator is the recommended response to any failed job. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**19.** A nightly load fails partway through and leaves partial data behind. The on-call team needs an immediate Teams message in their channel, and the partial rows must be cleaned up without waiting for someone to read an email. What should you configure?

A. The Schedule failures page, adding the on-call team as recipients.
B. An Activator rule on the job failed event that posts to Teams and runs a cleanup notebook.
C. A semantic model refresh schedule that runs after the load.
D. Workspace monitoring with a KQL query over the failure logs.

**20.** A notebook that used to finish in two minutes now takes eight, though every run still reports Succeeded. You need to establish when the slowdown began. What is the most direct way to find out?

A. Open historical runs for the notebook and compare durations across runs.
B. Filter the monitoring hub to show only failed activities.
C. Enable workspace monitoring and wait 30 days for data to accumulate.
D. Re-run the notebook manually and time it.

---

## Answer Key & Rationale

**1. B — Data about whether activities succeed, fail, or degrade over time.** Monitoring is the collection of activity data so you can judge outcomes. Without it, failures go undetected, reports show stale data, and troubleshooting becomes guesswork.

**2. B — The status of each individual activity inside the pipeline.** A pipeline can report Succeeded overall even when an optional activity inside it failed, so the rolled-up status alone can hide the break that left the data stale.

**3. B — An emerging problem with the data source connection.** A refresh that retries before succeeding points to a transient issue. When the retry count rises over time, investigate the source connection before the refresh starts failing outright.

**4. A — They run continuously, so you monitor throughput, latency, and error rates.** Batch activities run and complete, producing a duration and a final status. Eventstreams are designed to run without stopping, so the useful signals are continuous ones.

**5. B — By selecting Monitor in the left navigation pane.** That opens the hub's main view, a table of recent activities with columns for name, status, item type, and start time.

**6. C — Something stopped the activity before it finished.** Check whether the cancellation was deliberate or the result of a timeout or a capacity limit.

**7. C — It might be stuck, or processing an unusually large dataset.** In progress simply means the activity is still running. Staying there far longer than the baseline is the signal worth investigating.

**8. B — 30 days.** Historical runs show up to 30 days of run history for the selected item, reached through More options on the activity.

**9. C — When an activity started failing, and whether it is getting slower.** A single run tells you what happened now. History tells you when a pattern began, whether durations are drifting, and whether retries recur.

**10. A — Status and item type.** Filter to failures to focus on problems, or to a single item type such as Dataflow Gen2 when troubleshooting one part of the chain.

**11. C — Submitted by.** It identifies who or what triggered the run: a user, a schedule, or a pipeline. Location gives the workspace, and Refresh type distinguishes scheduled from manual runs.

**12. B — Contributor.** Configuring notifications on the Schedule failures page requires at least the Contributor role in the workspace.

**13. B — An Eventhouse database that collects diagnostic logs and metrics.** It continuously gathers logs from your Fabric items, retains them for 30 days, and is enabled in workspace settings under the Monitoring tab.

**14. B — It can run a Fabric activity such as a notebook or pipeline in response to an event.** Schedule failures sends email; Activator can also act, triggering a follow-up job rather than waiting for a human to respond.

**15. True.** The monitoring hub is a visual dashboard for recent activity. Workspace monitoring keeps the raw log data, which you query with KQL or SQL for trend analysis and custom dashboards.

**16. True.** If you do not know that a dataflow normally finishes in four minutes, a twenty-minute run does not read as an anomaly. Baselines are what make deviation meaningful.

**17. False.** Activator responds to job created, job failed, job succeeded, and job status changed events. Reacting to success is how you chain a downstream refresh onto an upstream completion.

**18. False.** If a job failed on a code error or a changed source schema, re-running it just fails again. Activator suits automated coordination — chaining jobs, cleanup, routing notifications — not substituting for a root-cause fix.

**19. B — An Activator rule on the job failed event that posts to Teams and runs a cleanup notebook.** Two requirements rule out the alternatives: a Teams channel rather than email, and an automatic follow-up action. The Schedule failures page delivers centrally managed email only, and neither a refresh schedule nor a KQL query removes the partial rows.

**20. A — Open historical runs for the notebook and compare durations across runs.** Duration drift on succeeded runs is exactly what the history view exposes, and it is already there for the last 30 days. Filtering to failures hides these runs entirely, and enabling workspace monitoring now collects nothing about the past.
