# DP-700 Practice Quiz — Use Eventstream in Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/explore-event-streams-microsoft-fabric/
Units covered: Components of Eventstream | Eventstream sources and destinations | Eventstream transformations

DP-700 domain: **Ingest and transform streaming data** — "Process data by using Eventstreams" specifically, plus supporting detail for "Create windowing functions."

---

## Section A — Multiple Choice

**1.** What visual tool does Eventstream provide for designing pipelines by dragging and dropping nodes?
A. KQL Queryset
B. The eventstream canvas
C. The Admin portal
D. The OneLake catalog

**2.** Does using the eventstream canvas require writing code or managing infrastructure?
A. Yes, both are required
B. No — it's a no-code, visual design experience
C. Code is required only for transformations
D. Infrastructure management is required, but not code

**3.** Which eventstream destination is specifically designed for content-based routing, sending different subsets of data to different destinations based on the data's content?
A. Lakehouse
B. Derived stream
C. Custom endpoint
D. Eventhouse

**4.** When real-time events are routed to a Lakehouse destination, what format are they converted to before storage?
A. CSV
B. JSON
C. Delta Lake format
D. Avro

**5.** Can you attach multiple destinations to a single eventstream at the same time?
A. No, only one destination is allowed per eventstream
B. Yes, and they don't impact or collide with each other
C. Yes, but only two destinations maximum
D. No, multiple destinations require separate eventstreams

**6.** Which eventstream destination directly connects real-time data to an event detection engine that automatically triggers notifications or workflows when conditions are met?
A. Custom endpoint
B. Derived stream
C. Fabric Activator
D. Eventhouse

**7.** Which no-code transformation would you use to keep only events meeting a specific condition, such as temperature > 80°?
A. Manage fields
B. Filter
C. Union
D. Expand

**8.** Which transformation lets you add calculated fields, rename fields, remove columns, or change data types?
A. Aggregate
B. Manage fields
C. Group by
D. Join

**9.** What is the difference between the Aggregate and Group by transformations?
A. They are identical with no functional difference
B. Aggregate calculates a running aggregation every time a new event occurs; Group by calculates aggregations across defined time windows
C. Aggregate only works with strings; Group by only works with numbers
D. Group by cannot calculate sums or averages

**10.** Which two types of time windows does the Group by transformation support?
A. Fixed and variable
B. Tumbling windows and sliding windows
C. Rolling and static
D. Batch and streaming

**11.** What happens to fields that don't match (same name and data type) when using the Union transformation?
A. They are automatically renamed to match
B. They are dropped and not included in the output
C. They cause the eventstream to fail
D. They are converted to a default data type

**12.** Which transformation would you use to combine data from two separate streams based on a matching condition?
A. Union
B. Expand
C. Join
D. Filter

---

## Section B — True / False

**13.** The Expand transformation creates a new row for each value within an array field. **(True/False)**

**14.** A destination in an eventstream can only be configured immediately after connecting a data source, never after applying transformations. **(True/False)**

**15.** Sources for an eventstream can only come from Microsoft platforms; non-Microsoft sources like Apache Kafka are not supported. **(True/False)**

**16.** Tumbling windows are fixed, non-overlapping intervals, while sliding windows are overlapping intervals. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**17.** You're processing IoT sensor data and want to: filter out sensor errors, add a calculated "priority" field based on temperature thresholds, then calculate hourly average temperature by location — before finally routing high-priority readings to Activator and hourly summaries to a Lakehouse. Which sequence of transformations matches this workflow?
A. Group by → Filter → Manage fields
B. Filter → Manage fields → Group by
C. Join → Union → Expand
D. Manage fields → Union → Filter

**18.** You have a single incoming stream of bike station data. You need "no bikes available" alerts sent to Activator, while the same aggregated data also needs to be stored in an Eventhouse for historical querying — using content-based routing rather than duplicating the whole pipeline. What should you configure?
A. Two entirely separate eventstreams with duplicated sources
B. A derived stream routed to both an Activator destination and an Eventhouse destination
C. A Union transformation only
D. A custom endpoint only

---

## Answer Key & Rationale

**1. B — The eventstream canvas.** This visual editor lets you design your pipeline by dragging and dropping sources, transformations, and destinations, while watching event data flow through in real time.

**2. B — No, it's a no-code, visual design experience.** You don't need to write code or manage any infrastructure to build and run an eventstream.

**3. B — Derived stream.** Derived streams are transformed versions of the original stream that enable content-based routing — routing subsets of data to different destinations based on what the data actually contains (e.g., high-temperature alerts to Activator, hourly averages to a KQL database).

**4. C — Delta Lake format.** The Lakehouse destination transforms real-time events into Delta Lake format before storing them in designated lakehouse tables.

**5. B — Yes, and they don't impact or collide with each other.** You can attach to multiple destinations within the same eventstream simultaneously, with no interference between them.

**6. C — Fabric Activator.** This destination connects real-time data directly to an event detection engine that automatically triggers notifications, launches Power Automate workflows, or fires other automated responses when thresholds or patterns are matched.

**7. B — Filter.** Filter keeps only events meeting a specific condition on a field's value — exactly the temperature > 80°, status = "error" style example given in the module.

**8. B — Manage fields.** This transformation covers adding calculated fields, removing unnecessary columns, renaming fields, and changing data types to match destination requirements.

**9. B — Aggregate calculates a running aggregation every time a new event occurs; Group by calculates aggregations across defined time windows.** Aggregate is event-triggered and continuous; Group by is time-window-based (e.g., hourly sales totals, daily temperature averages).

**10. B — Tumbling windows and sliding windows.** Tumbling windows are fixed, non-overlapping intervals; sliding windows are overlapping intervals — both supported by the Group by transformation.

**11. B — They are dropped and not included in the output.** Union only combines fields that share the same name and data type across the connected nodes; anything that doesn't match gets excluded.

**12. C — Join.** Join combines data from two streams based on a matching condition between them — the direct streaming analog to a SQL join.

**13. True.** Expand is explicitly described as an array transformation that creates a new row for each value within an array — turning nested array data into flat, queryable rows.

**14. False.** A destination can be specified either right after connecting a data source, *or* after applying optional transformations — both configuration points are valid depending on your pipeline design.

**15. False.** Eventstream explicitly supports non-Microsoft/external sources including Apache Kafka, Google Cloud Pub/Sub, and MQTT, alongside Microsoft sources, Azure events, and Fabric events.

**16. True.** This is the defining distinction between the two window types the module calls out directly — tumbling windows don't overlap; sliding windows do.

**17. B — Filter → Manage fields → Group by.** This matches the module's own worked example step by step: filter out sensor errors first, then add the calculated priority field via Manage fields, then calculate hourly averages by location via Group by — before finally routing to destinations.

**18. B — A derived stream routed to both an Activator destination and an Eventhouse destination.** This is exactly the module's bike-station example: a derived stream enables content-based routing from one processed stream out to multiple destinations (Activator for alerts, Eventhouse for storage) without duplicating the source or the transformation logic.

---

**Score guide:** 16–18 correct = strong grasp, ready to move to the next module. 12–15 = solid but review the Aggregate vs. Group by distinction and the full list of destination types. Below 12 = re-read units 2–4 before moving on.
