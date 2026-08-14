# DP-700 Practice Quiz — Create Real-Time Dashboards with Microsoft Fabric

Source module: https://learn.microsoft.com/en-us/training/modules/create-real-time-dashboards-microsoft-fabric/
Units covered: Get started with real-time dashboards | Organize and filter dashboard data | Dashboard management and optimization

DP-700 domains: **Ingest and transform streaming data** (dashboard consumption of KQL data) | **Monitor and optimize** (dashboard/query maintainability techniques)

---

## Section A — Multiple Choice

**1.** What is each visualization within a Real-Time Dashboard called?
A. A page
B. A tile
C. A base query
D. A parameter

**2.** Which type of data source authorization means each dashboard viewer accesses data using their own permissions?
A. Dashboard editor's identity
B. Pass-through identity
C. Anonymous access
D. Shared service identity

**3.** Which type of data source authorization means everyone viewing the dashboard accesses data using the dashboard creator's permissions?
A. Pass-through identity
B. Dashboard editor's identity
C. Guest identity
D. Row-level security

**4.** What does a tile display by default before you customize its visualization?
A. A bar chart
B. A map
C. A table
D. A line chart

**5.** What can you add to a dashboard to provide additional context or information, aside from data visualization tiles?
A. Parameters
B. Text tiles
C. Base queries
D. Pages

**6.** By default, how many pages does a new Real-Time Dashboard have, and can more be added?
A. Unlimited pages by default, cannot be reduced
B. One page by default; more can be added to organize content
C. Exactly three pages, fixed
D. Zero pages until a tile is created

**7.** What prefix convention is used to reference a dashboard parameter's variable name within a KQL tile query?
A. A dollar sign (`$`)
B. An underscore (`_`)
C. An at sign (`@`)
D. A percent sign (`%`)

**8.** In a parameter-filtered KQL query, what does checking `isempty(_selected_neighbourhoods)` accomplish?
A. It deletes the parameter if unused
B. It shows all neighborhoods when no specific selection has been made
C. It hides all data until a selection is made
D. It throws an error if the parameter is empty

**9.** Regarding auto refresh, what control do dashboard editors have that viewers do not?
A. Editors can turn off refresh entirely; viewers cannot
B. Editors can set a minimum refresh rate to prevent viewers from refreshing too frequently
C. Editors cannot adjust refresh rate at all
D. Only editors can view the dashboard in real time

**10.** What is the primary purpose of a base query in a Real-Time Dashboard?
A. To replace the need for individual tiles
B. To retrieve a general set of records shared by multiple tiles, avoiding duplicated logic
C. To define dashboard-level security permissions
D. To automatically create parameters

---

## Section B — True / False

**11.** Dashboard viewers can adjust the refresh rate during their session, within limits set by the editor. **(True/False)**

**12.** A base query is referenced in tile queries using the same underscore-prefixed variable naming convention as parameters. **(True/False)**

**13.** Once created, a dashboard tile's query cannot be tested or edited after initial setup. **(True/False)**

**14.** A Real-Time Dashboard can only ever be created from a KQL database in an Eventhouse — no other real-time data source is possible. **(True/False)**

---

## Section C — Scenario / Choose the Best Option

**15.** Multiple tiles in your dashboard all need to reference the same 30-minute window of latest bike observations by neighborhood, and you want to avoid duplicating that KQL logic across every tile. What should you create?
A. A new parameter
B. A base query
C. A text tile
D. A new dashboard page

**16.** You want dashboard viewers external to your team to see only the bike station data their own individual permissions allow, based on row-level security configured on the underlying KQL database. Which data source authorization option should you choose?
A. Dashboard editor's identity
B. Pass-through identity
C. Anonymous access
D. Base query identity

---

## Answer Key & Rationale

**1. B — A tile.** Each dashboard consists of one or more tiles, and each tile displays the results of a KQL query as a real-time data visualization.

**2. B — Pass-through identity.** Each person viewing the dashboard queries the data source using their own individual permissions — useful when you need viewers subject to their own row-level or object-level security.

**3. B — Dashboard editor's identity.** Everyone viewing the dashboard accesses data using the permissions of the person who created/edited it, regardless of the viewer's own access level.

**4. C — A table.** When you first add a tile and specify a query, the results initially display as a plain table; you then edit the tile to define a chart, map, or other visualization.

**5. B — Text tiles.** These provide additional information or context alongside your data visualization tiles, without querying data themselves.

**6. B — One page by default; more can be added.** Pages act as containers for tiles, letting you organize related content — for example, separate pages per data source or subject area.

**7. B — An underscore (`_`).** Parameters have a variable name referenced in tile queries with an underscore prefix, as in `_selected_neighbourhoods`.

**8. B — It shows all neighborhoods when no specific selection has been made.** The `isempty()` check handles the "nothing selected" case by falling back to showing everything, rather than showing no data at all.

**9. B — Editors can set a minimum refresh rate to prevent viewers from refreshing too frequently.** Editors set a default refresh rate that viewers can adjust during their session, but editors also control a minimum threshold to protect system performance.

**10. B — To retrieve a general set of records shared by multiple tiles, avoiding duplicated logic.** Base queries centralize a shared dataset (e.g., "all bike data from the last 30 minutes"), and individual tile queries then reference and further filter/group that base query instead of each repeating the same underlying logic.

**11. True.** Editors set the default refresh rate, and viewers can adjust it during their own session — within whatever minimum threshold the editor has set.

**12. True.** Base queries use the same underscore-prefixed variable naming convention as parameters (e.g., `_base_bike_data`), and tile queries reference them the same way — as the starting point of the query, followed by further `project`, `order by`, or filtering.

**13. False.** Tile queries can be tested and edited — the module explicitly shows entering and testing a query when a tile is first added, with the clear implication it remains editable afterward, not locked in place.

**14. False.** The module's exact phrasing is "a source of real-time data; *such as* a KQL database in an eventhouse" — this is given as an example, not as the only possible option.

**15. B — A base query.** This matches the described scenario directly: shared 30-minute-window logic used across multiple tiles, centralized once to avoid duplicating the same KQL across each tile.

**16. B — Pass-through identity.** This is the option that makes each viewer's own permissions (including any row-level security on the KQL database) apply when they query the data — exactly what's needed for viewers outside your team to see only what they're individually authorized to see.

---

**Score guide:** 14–16 correct = strong grasp, ready to move to the next module. 10–13 = solid but review the two authorization types and the base query vs. parameter distinction. Below 10 = re-read units 2–4 before moving on.
