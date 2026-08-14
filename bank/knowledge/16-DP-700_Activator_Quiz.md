# DP-700 Practice Quiz — Use Activator in Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/use-fabric-activator/
Units covered: Configure Activator for your data | Create rules in Activator | Configure actions in Activator

DP-700 domain: **Implement and manage an analytics solution** — "Configure alerts" specifically, with supporting ties to streaming ingestion (Eventstream destinations) and monitoring.

---

## Section A — Multiple Choice

**1.** In Activator's business objects model, what does an "object" represent?
A. A raw data value
B. An individual real-world entity instance, like a specific package
C. A KQL query
D. A dashboard tile

**2.** What do "properties" represent in Activator's business objects model?
A. The unique identifier only
B. The specific data attributes monitored for each object instance, like Temperature or City
C. The action taken when a rule fires
D. The eventstream destination type

**3.** What triggers Activator to automatically create a new object instance when using eventstream-based configuration?
A. Manually clicking "add object" for every package
B. A new, previously unseen value appearing in the field designated as the unique identifier
C. Running a KQL query manually
D. Configuring a new eventstream transformation

**4.** Besides the business objects model fed by eventstreams, what other alerting approaches does Activator support?
A. Only business objects; no alternatives exist
B. Dashboard alerts, system event alerts, and query alerts
C. Only email-based alerts
D. Only Power Automate-triggered alerts

**5.** What can system event alerts in Activator monitor?
A. Only KQL Queryset results
B. Fabric workspace activities and OneLake file operations
C. Only Real-Time Dashboard tiles
D. Only Power BI report refreshes

**6.** In the rule Definition pane, which section lets you choose the specific data property (like Temperature) that Activator watches?
A. Condition
B. Property filter
C. Monitor
D. Actions

**7.** Which summarization option would you use to detect sensor failures by tracking how many readings are being received?
A. Average
B. Minimum/Maximum
C. Count
D. Total

**8.** Which summarization option smooths out noisy data by averaging readings over a period of time?
A. Average
B. Count
C. Total
D. Maximum

**9.** What does "window size" control when configuring summarization in Activator?
A. How often the calculation is recalculated
B. How much historical data is included in the calculation
C. The number of property filters allowed
D. The action type triggered

**10.** What does "step size" control when configuring summarization in Activator?
A. How much historical data is included
B. How often the summarization is recalculated
C. The threshold value for the condition
D. The unique identifier field

**11.** Which condition detection approach would you use to catch a sensor that has stopped sending data entirely?
A. Threshold monitoring
B. Change detection
C. Range monitoring
D. Missing data

**12.** Which Occurrence behavior would you select to only alert on persistent problems rather than brief spikes — for example, requiring the condition to stay true for 15 minutes?
A. Every time
B. When it has been true for
C. Threshold monitoring
D. Range monitoring

**13.** How many property filters can you combine in the Property filter section of a rule?
A. Only one
B. Up to two
C. Up to three
D. Unlimited

**14.** Which Activator action type is best suited for executing multi-step business processes that span multiple different applications and systems?
A. Email
B. Teams
C. Power Automate
D. Fabric item

---

## Section B — True / False

**15.** Activator's business objects model, dashboard alerts, system event alerts, and query alerts all use the same underlying Activator engine, just interpreting data differently. **(True/False)**

**16.** Teams actions in Activator are best suited for situations that require comprehensive context and can tolerate a response delay of hours or days. **(True/False)**

**17.** A Fabric item action can execute a data pipeline or notebook in response to a rule condition being met. **(True/False)**

**18.** Threshold monitoring and Range monitoring are the exact same detection approach with different names. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**19.** You want to alert on-call staff via Teams the instant a cold-chain medicine package's average temperature over a 10-minute window exceeds 68°F, but only for packages tagged `ColdChainType = "medicine"` — and only when it's sustained for at least 15 minutes, not on every brief fluctuation. Which combination of rule configuration matches this requirement?
A. Monitor: Temperature/Average/10-min window; Condition: threshold >68°F, Occurrence: Every time; Property filter: ColdChainType = "medicine"; Action: Email
B. Monitor: Temperature/Average/10-min window; Condition: threshold >68°F, Occurrence: When it has been true for 15 min; Property filter: ColdChainType = "medicine"; Action: Teams
C. Monitor: Temperature/Count; Condition: Missing data; Property filter: none; Action: Power Automate
D. Monitor: Temperature/Maximum; Condition: Range monitoring; Property filter: City = "Seattle"; Action: Fabric item

**20.** Your operations team wants a rule that automatically kicks off a data pipeline to run deeper diagnostic analysis whenever a condition is detected, without requiring a human to manually start it. Which action type should you configure?
A. Email
B. Teams
C. Power Automate
D. Fabric item

---

## Answer Key & Rationale

**1. B — An individual real-world entity instance, like a specific package.** Objects represent the real-world things you want to monitor — Package001, Package002, and so on — each a distinct instance.

**2. B — The specific data attributes monitored for each object instance, like Temperature or City.** Properties are the data points tied to each object, updated as new events arrive.

**3. B — A new, previously unseen value appearing in the field designated as the unique identifier.** As data flows in, new unique identifiers automatically create new objects — no manual object creation needed once the eventstream and unique identifier field are configured.

**4. B — Dashboard alerts, system event alerts, and query alerts.** These are explicitly listed alternative approaches — created from Real-Time Dashboard visualizations, Fabric workspace/OneLake activity monitoring, and KQL Queryset results respectively — all using the same Activator engine but interpreting data differently than the business objects model.

**5. B — Fabric workspace activities and OneLake file operations.** System event alerts specifically monitor these kinds of platform-level events, distinct from the business-object or dashboard/query-based approaches.

**6. C — Monitor.** This is where you select the Attribute (like Temperature) and configure Summarization — it's specifically about *what* Activator watches, distinct from *when* it acts (Condition) or *which events* it evaluates (Property filter).

**7. C — Count.** Tracking how many readings you're getting is exactly how you'd catch a sensor that's gone quiet or malfunctioning — a drop in count signals a data flow problem, not a value problem.

**8. A — Average.** Averaging readings over time smooths out noise, like brief spikes when a package is moved or dips when passing through different environments.

**9. B — How much historical data is included in the calculation.** For example, a 10-minute window means the calculation considers the last 10 minutes of readings.

**10. B — How often the summarization is recalculated.** A 5-minute step size means the calculation refreshes every 5 minutes, even while the window itself covers a longer historical span.

**11. D — Missing data.** This detection approach is specifically for catching sensor failures or data flow interruptions — e.g., "no new events for more than 30 minutes."

**12. B — When it has been true for.** This Occurrence setting requires the condition to remain true for a specified duration before triggering, filtering out brief, transient spikes that "Every time" would catch immediately.

**13. C — Up to three.** The Property filter section explicitly supports combining up to three filters for precise targeting of which events get evaluated.

**14. C — Power Automate.** It's Microsoft's workflow automation service, purpose-built for connecting different apps and services together and executing multi-step processes across systems.

**15. True.** The module states directly that dashboard alerts, system event alerts, and query alerts "use the same Activator engine but interpret data differently" than the business objects model fed by eventstreams.

**16. False.** This description matches **Email** actions, not Teams. Teams actions are for immediate messages and quick coordination; Email is the one suited to comprehensive context and a response window of hours or days.

**17. True.** Fabric item actions execute data pipelines or notebooks for further processing or analysis in response to a rule's conditions being met.

**18. False.** These are distinct detection approaches: Threshold monitoring alerts when a value crosses a defined safety limit (e.g., "greater than 68°F"), while Range monitoring tracks entry into or exit from a defined safe zone — related concepts but not the same mechanism.

**19. B.** This is the only option that correctly matches every stated requirement: Average summarization over a 10-minute window (smoothing noise), a threshold condition with "When it has been true for 15 min" (sustained problems only, not every fluctuation), a property filter scoped to medicine cold-chain packages, and a Teams action for immediate on-call notification.

**20. D — Fabric item.** This action type is explicitly for executing a data pipeline or notebook automatically in response to a detected condition — exactly the described need for automated diagnostic analysis without manual intervention.

---

**Score guide:** 18–20 correct = strong grasp, ready to move to the next module. 14–17 = solid but review the four action types (especially Email vs. Teams) and the Threshold vs. Range monitoring distinction. Below 14 = re-read units 2–4 before moving on.
