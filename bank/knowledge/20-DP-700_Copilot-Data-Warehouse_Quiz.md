# DP-700 Practice Quiz — Get Started with Copilot in Microsoft Fabric for Data Warehouse

Source module: https://learn.microsoft.com/en-us/training/modules/get-started-copilot-fabric-data-warehouse/
Units covered: Use Copilot code completion | Use Copilot chat | Use Copilot quick actions | Review best practices using Copilot

DP-700 domain: **Implement and manage an analytics solution** — filed here as workspace tooling. Note: this topic isn't explicitly listed in the official DP-700 skills outline, so treat it as supplementary/practical knowledge rather than a core exam objective.

---

## Section A — Multiple Choice

**1.** What prerequisite is required to use Copilot in Fabric Data Warehouse, regarding capacity SKU?
A. Any SKU, including trial
B. A paid SKU (F2 or higher, or a P SKU) — trial SKUs aren't supported
C. Only P SKUs are supported, F SKUs are not
D. No SKU requirement exists

**2.** In the SQL query editor, how does Copilot present inline code completion suggestions?
A. As a popup dialog box
B. As dimmed "ghost text" that can be accepted or dismissed
C. As a separate chat window only
D. As an automatically inserted comment

**3.** Which keyboard shortcut accepts an entire Copilot code completion suggestion?
A. `Ctrl+Right`
B. `Tab`
C. `Ctrl+Enter`
D. `Esc`

**4.** Which shortcut lets you accept only the next word of a Copilot suggestion rather than the whole thing?
A. `Tab`
B. `Ctrl+Right` (`Cmd+Right` on macOS)
C. `Shift+Tab`
D. `Alt+Right`

**5.** How can you guide Copilot's code completion by writing a specific request directly in the SQL editor?
A. By using a slash command
B. By writing a comment using `--`
C. By opening the chat pane only
D. By using the Explain quick action

**6.** Which Copilot chat command generates a SQL query directly from a natural language prompt?
A. `/explain`
B. `/fix`
C. `/generate-sql`
D. `/question`

**7.** Which Copilot chat command provides a natural language explanation of the query in the active query tab?
A. `/generate-sql`
B. `/explain`
C. `/fix`
D. `/help`

**8.** Which Copilot chat command resolves errors in the query in the active query tab, optionally with added context?
A. `/question`
B. `/generate-sql`
C. `/fix`
D. `/explain`

**9.** Does the Copilot chat pane retain context across multiple prompts within the same session?
A. No, every prompt is treated independently
B. Yes, allowing follow-up messages to reference earlier queries without repeating full context
C. Only if you manually save the conversation
D. Only within a single message, not across messages

**10.** Where are the Explain and Fix quick actions located in the Fabric Data Warehouse interface?
A. In the Copilot chat pane only
B. At the top of the SQL query editor, near the Run button
C. In the warehouse Settings pane
D. In the Visual query editor only

**11.** Under what condition does the Fix quick action become enabled?
A. It is always enabled by default
B. Only after you run a query that returns an error
C. Only when you highlight a portion of the query
D. Only within the Copilot chat pane

**12.** What does the Explain quick action add to your query?
A. A completely rewritten, optimized version of the query
B. A summary at the top of the query and inline comments describing its functionality
C. A list of all tables referenced, with no other detail
D. An automatic fix for any detected errors

---

## Section B — True / False

**13.** Using meaningful, descriptive table and column names improves the accuracy of Copilot-generated queries. **(True/False)**

**14.** Establishing schema relationships in the model view of your warehouse has no effect on the accuracy of Copilot-generated JOIN statements. **(True/False)**

**15.** Copilot's natural language to SQL feature currently supports prompts written in any language equally well. **(True/False)**

**16.** The Explain quick action requires you to highlight the query or the specific portion you want explained before selecting it. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**17.** You want Copilot's inline code completion to generate a query analyzing "the distribution of trips by hour on working days (non-holiday weekdays)" without opening the chat pane. What should you do?
A. Use the `/generate-sql` command in the chat pane
B. Write a comment describing the request directly in the SQL editor using `--`
C. Highlight existing code and select Explain
D. Wait for a query error and select Fix

**18.** You've just run a query that returned a syntax error, and you want Copilot to resolve it using the error message as context, without typing out an explanation yourself. What should you do?
A. Open the chat pane and type `/question`
B. Select the Fix quick action button near the Run button
C. Rewrite the query manually using ghost text
D. Use `Ctrl+Right` to accept a suggestion

---

## Answer Key & Rationale

**1. B — A paid SKU (F2 or higher, or a P SKU) — trial SKUs aren't supported.** This is an explicit prerequisite, along with your capacity being in a supported region and the Copilot tenant switch being enabled by an administrator.

**2. B — As dimmed "ghost text" that can be accepted or dismissed.** As you type, Copilot shows real-time suggestions this way, similar to code completion tools in modern IDEs.

**3. B — `Tab`.** Pressing Tab accepts the full suggestion; continuing to type instead dismisses it.

**4. B — `Ctrl+Right` (`Cmd+Right` on macOS).** This lets you accept the suggestion incrementally, one word at a time, rather than all at once.

**5. B — By writing a comment using `--`.** A comment like `-- What is the distribution of trips by hour on working days (non-holiday weekdays)?` prompts Copilot to generate a corresponding query directly in the editor — no need to switch to the chat pane.

**6. C — `/generate-sql`.** This command converts a natural language prompt into a T-SQL query, directly in the chat pane.

**7. B — `/explain`.** This provides a natural language explanation specifically of the query currently in the active query tab.

**8. C — `/fix`.** This resolves errors in the active query tab's query, and you can optionally add context (like "using CTAS instead of ALTER TABLE") to guide the fix.

**9. B — Yes, allowing follow-up messages to reference earlier queries without repeating full context.** This multi-turn interaction is what makes iterative query development faster — you can generate a query, then follow up with something like `/fix using CTAS instead of ALTER TABLE` without restating everything.

**10. B — At the top of the SQL query editor, near the Run button.** These are separate from the chat pane — a quicker, more targeted way to explain or fix code you're actively looking at.

**11. B — Only after you run a query that returns an error.** Fix uses that error message as context automatically, so it isn't available until there's actually an error to work with.

**12. B — A summary at the top of the query and inline comments describing its functionality.** Explain doesn't rewrite or fix anything — it purely documents what the existing query does, and you can edit or delete the generated comments afterward.

**13. True.** Descriptive, meaningful names help Copilot understand your schema, which directly improves the accuracy of the queries it generates.

**14. False.** The opposite is true — establishing schema relationships in the model view specifically enhances the accuracy of Copilot-generated JOIN statements, since a well-structured schema with defined relationships lets Copilot infer connections between tables effectively.

**15. False.** Natural language to SQL currently supports English to T-SQL specifically — prompts should be written in English to take full advantage of the feature.

**16. True.** You need to highlight the query or the portion you want explained *before* selecting the Explain button — it doesn't work on an unselected query.

**17. B — Write a comment describing the request directly in the SQL editor using `--`.** This is exactly the code-completion-guided pattern from the module — a `--` comment describing your analytical question prompts Copilot to generate the corresponding query inline, without needing the chat pane at all.

**18. B — Select the Fix quick action button near the Run button.** Fix is specifically designed for this scenario: it becomes enabled after a query error and automatically uses that error message as context, requiring no extra typed explanation from you.

---

**Score guide:** 16–18 correct = strong grasp, ready to move to the next module. 12–15 = solid but review the four chat slash commands and the Explain/Fix quick action trigger conditions. Below 12 = re-read units 2–5 before moving on.
