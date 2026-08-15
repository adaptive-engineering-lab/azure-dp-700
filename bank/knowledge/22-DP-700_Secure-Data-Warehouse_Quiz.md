# DP-700 Practice Quiz — Secure a Microsoft Fabric Data Warehouse

Source module: https://learn.microsoft.com/en-us/training/modules/secure-data-warehouse-in-microsoft-fabric/
Units covered: Explore dynamic data masking | Implement row-level security | Implement column-level security | Configure SQL granular permissions using T-SQL

DP-700 domain: **Implement and manage an analytics solution** — "Implement row-level, column-level, object-level, and folder/file-level access controls" and "Implement dynamic data masking" specifically.

---

## Section A — Multiple Choice

**1.** What does dynamic data masking do?
A. Physically deletes sensitive data from storage
B. Obscures column values in query results without changing the underlying stored data
C. Encrypts data at rest only
D. Prevents any user from querying a masked column

**2.** Which masking type replaces a value entirely based on its data type (e.g., numbers become 0, strings become XXXX)?
A. Email masking
B. Default masking
C. Custom text masking
D. Random masking

**3.** Which masking function shows only the first character of an email and appends a fixed `.com` suffix?
A. `default()`
B. `email()`
C. `partial()`
D. `random()`

**4.** Which masking function is best suited for showing only the last four digits of a credit card number?
A. `default()`
B. `email()`
C. `partial(prefix, padding, suffix)`
D. `random(low, high)`

**5.** By default, which users can see unmasked data in a table with dynamic data masking applied?
A. All authenticated users
B. Only users with the `CONTROL` permission (Admins, Members, Contributors)
C. No one; masking cannot be bypassed
D. Only the original data owner

**6.** What permission would you grant to allow a specific non-admin user to see unmasked values in a masked column?
A. `ALTER ANY MASK`
B. `CONTROL`
C. `UNMASK`
D. `EXECUTE`

**7.** What permission is needed to add or remove masking rules from columns, without granting full admin rights?
A. `UNMASK`
B. `ALTER ANY MASK`
C. `SELECT`
D. `CONTROL`

**8.** What is a key limitation/risk of dynamic data masking?
A. It requires schema changes to implement
B. It's vulnerable to inference attacks, since it hides values but doesn't prevent the column from being queried at all
C. It only works on numeric columns
D. It cannot be applied to email columns

**9.** What are the two components that work together to implement row-level security?
A. Masking rules and workspace roles
B. Filter predicates and security policies
C. `GRANT` and `DENY` statements only
D. Column permissions and stored procedures

**10.** Which SQL operations are affected by an RLS filter predicate?
A. Only `SELECT`
B. `SELECT`, `UPDATE`, and `DELETE` — but NOT `INSERT`
C. Only `INSERT` and `UPDATE`
D. All operations equally, including `INSERT`

**11.** What happens if an RLS filter predicate isn't explicitly written to include admin-level users?
A. Admins automatically bypass RLS regardless of the predicate
B. Admins will have rows filtered from their results just like any other user
C. RLS cannot be applied at all
D. The security policy fails to activate

**12.** In column-level security, what happens when a user without permission tries to `SELECT` a restricted column?
A. The entire query fails silently with no data returned at all, including other columns
B. They receive a permission error for that column, while the rest of the table remains accessible
C. The column is automatically masked instead of blocked
D. The user is automatically granted temporary access

**13.** What happens to Power BI query performance when a warehouse table has column-level security applied and is accessed in Direct Lake mode?
A. Nothing changes; Direct Lake continues as normal
B. Queries automatically fall back to DirectQuery mode
C. The table becomes completely inaccessible from Power BI
D. Direct Lake mode is disabled tenant-wide

**14.** If a user has both a `GRANT` and a `DENY` on the same permission (from different roles), which one takes effect?
A. `GRANT` always wins
B. `DENY` always wins
C. Whichever was applied most recently
D. Neither applies; the permission defaults to denied without explicit conflict resolution

---

## Section B — True / False

**15.** `EXECUTE`, `ALTER`, and `CONTROL` are permissions that apply to functions and stored procedures. **(True/False)**

**16.** A common secure architecture pattern is granting `EXECUTE` on stored procedures while denying direct `SELECT` access to the underlying tables. **(True/False)**

**17.** Row-level security and dynamic data masking are both completely immune to side-channel attacks like divide-by-zero inference techniques. **(True/False)**

**18.** The principle of least privilege means giving users or applications only the permissions they need to do their job, nothing more. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**19.** A healthcare organization needs receptionists to view patient names and appointment details, but not the `MedicalHistory` column, while doctors need full access including `MedicalHistory`. Both roles query the same `Patients` table. Which security feature should be configured?
A. Dynamic data masking on the entire table
B. Column-level security, granting `SELECT` broadly and denying `SELECT` on `MedicalHistory` to the Receptionist role
C. Row-level security filtering by `PatientID`
D. A separate warehouse for each role

**20.** Your data engineering team wants an application to read sales data only through a controlled stored procedure, never directly from the underlying `Sales` table, to enforce a specific access pattern and prevent arbitrary queries. What permission configuration achieves this?
A. `GRANT SELECT` on the `Sales` table only
B. `GRANT EXECUTE` on the stored procedure, and `DENY` (or don't grant) `SELECT` on the underlying `Sales` table
C. `GRANT CONTROL` on the `Sales` table
D. Apply dynamic data masking to all columns in `Sales`

---

## Answer Key & Rationale

**1. B — Obscures column values in query results without changing the underlying stored data.** Masking happens at query time, not storage — nonprivileged users see a masked version, while the real values stay fully intact underneath.

**2. B — Default masking.** This fully replaces the value based on its data type: numbers become 0, strings become XXXX, dates become 1900-01-01 — a complete, type-aware substitution.

**3. B — `email()`.** This shows the first character and appends a fixed `.com` suffix, e.g., `johndoe@contoso.com` becomes `j*****@contoso.com`.

**4. C — `partial(prefix, padding, suffix)`.** This custom text masking function exposes a specified number of characters at the start and end with custom padding in between — exactly suited for partial identifiers like the last four digits of a credit card.

**5. B — Only users with the `CONTROL` permission (Admins, Members, Contributors).** These roles always see unmasked values by default; anyone else sees the masked version unless explicitly granted otherwise.

**6. C — `UNMASK`.** This permission gives fine-grained control, letting a specific non-admin user see real data without needing to grant them full admin or table ownership rights.

**7. B — `ALTER ANY MASK`.** This lets someone (like a data engineer) manage masking rules — add or remove masks — without needing broader admin rights.

**8. B — It's vulnerable to inference attacks, since it hides values but doesn't prevent the column from being queried at all.** The module's example: a user can write a query that divides by a masked salary column, triggering a divide-by-zero error only when their guess matches the hidden value — revealing the real data without ever directly seeing it.

**9. B — Filter predicates and security policies.** A filter predicate is an inline table-valued function evaluating each row as `true`/`false`; a security policy binds that predicate to a specific table so it applies automatically.

**10. B — `SELECT`, `UPDATE`, and `DELETE` — but NOT `INSERT`.** Filter predicates make rows invisible for these three operations; `INSERT` isn't affected by filter predicates at all, per the module's explicit statement.

**11. B — Admins will have rows filtered from their results just like any other user.** RLS predicates apply to *all* users, including workspace Admins, Members, and Contributors — you have to explicitly write the predicate to include admin-level access if full visibility is required (as shown with the `OR USER_NAME() = 'salesadmin@contoso.com'` clause in the module's example).

**12. B — They receive a permission error for that column, while the rest of the table remains accessible.** This is what makes CLS a "clean" solution — it doesn't block the whole table, just the specific restricted column.

**13. B — Queries automatically fall back to DirectQuery mode.** Security is still enforced, but you trade away the Direct Lake performance baseline when CLS is applied to a table being accessed that way.

**14. B — `DENY` always wins.** This is explicitly stated — when a `GRANT` and `DENY` conflict on the same permission from different roles, `DENY` takes precedence regardless of source.

**15. True.** `EXECUTE` (run the function/procedure), `ALTER` (modify its definition), and `CONTROL` (full ownership rights) are the permission set specific to functions and stored procedures, distinct from the `SELECT`/`INSERT`/`UPDATE`/`DELETE` set for tables and views.

**16. True.** This is an explicitly recommended pattern for enforcing a controlled data access model — users interact with data only through the procedure's defined logic, never with arbitrary direct queries against the table.

**17. False.** Both RLS and dynamic data masking are explicitly called out as vulnerable to side-channel attacks — a carefully crafted query (like one causing a divide-by-zero only under specific hidden conditions) can leak information without ever directly reading the protected value. The module recommends combining multiple layers (RLS + CLS + DDM) specifically because no single layer is immune.

**18. True.** Least privilege means giving each user or application exactly what it needs to do its job — nothing more — which limits the blast radius if a credential is compromised or a query goes wrong.

**19. B — Column-level security, granting `SELECT` broadly and denying `SELECT` on `MedicalHistory` to the Receptionist role.** This matches the module's own healthcare example precisely: broad table access granted to all relevant roles, with an explicit `DENY` on the one sensitive column for roles that shouldn't see it — while doctors keep full access.

**20. B — `GRANT EXECUTE` on the stored procedure, and `DENY` (or don't grant) `SELECT` on the underlying `Sales` table.** This is the explicit least-privilege pattern from the module: the application gets exactly the access it needs (running the procedure) without broader table-level access that could enable arbitrary, uncontrolled queries.

---

**Score guide:** 18–20 correct = strong grasp, ready to move to the next module. 14–17 = solid but review the UNMASK vs. ALTER ANY MASK permissions and the RLS filter predicate scope (which operations it does/doesn't affect). Below 14 = re-read units 2–5 before moving on.
