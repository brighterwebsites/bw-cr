##pipeline
- Right side (main panel) Calendar but list view this week only show Tasks or deliverables in a list BUT need to add a check button to tasks and deliverables that says "show on calendar"  so just for importanting things not everything. 

##Customers


##Tasks

- Copy Task to New task 
- Email Customer with update (see Email)
- Task Templates. 


##Assets


## SEO

Nav: top-level **SEO** → Performance · Opportunities · Pages (asset filter on each). See [`UI-SEO.md`](UI-SEO.md).

- GSC connect per asset; **Duplicate setup from…** (config only, re-auth required)
- SCOS keys: [`SCOS-keys.md`](SCOS-keys.md)

Pages 
$$\text{URL} \rightarrow \text{Impressions} \rightarrow \text{CTR} \rightarrow \text{Avg. Position} \rightarrow \mathbf{\text{Views}} \rightarrow \mathbf{\text{Avg. Engagement Time}} \rightarrow \mathbf{\text{Engagement Rate}}$$


#oppurutnities 
- [x] Sticky table header on scroll (Pages + Opportunities tables)
- [x] Title/Path merged column (Title top, Path bottom, path links to canonical_url in new tab)
- [x] Removed per-row "Create task" link; Dismiss is now an icon (reappears on next sync if still an issue)
- [x] Multi-select + batch "Create task(s) from selected" — groups by asset + opportunity type + WP post type (1 task per group, not mixed post types), description lists URL + WP Post ID per page, `agent_note` field added to tasks (single free-text field for now — Skill/approval-gate/error-handler come later once Hermes dispatch is real)

- (Oppurunity) Task templates - (Plan for editable task templates now/later?) see table below but for now Im thinking 
Title "Fix [Low CTR] [2] [Post Type]" -
Descr:For [URL/POSTID List]  [Task Action Plan]
For url1, 123; url3, 234; Rewrite the Page Title and Meta Description to be more enticing  agent run: seo-update-single-page-meta on Post IDs 123,234 )
(for now can we just add an agent note field on tasks?)


- Oppurunity Template info  (just notes for now - am currious about how)
Oppurtunity Type, Search Console (Pre-Click),GA4 (Post-Click),What It Means,Task Action Plan
Low CTR, "High Impressions, Low CTR","High Views, High Engagement","Your content is great, but searchers aren't clicking in Google.",SEO Fix: Rewrite the Page Title and Meta Description to be more enticing.
Low Engagement, "High CTR, High Clicks","High Views, LOW Engagement Time","You got the traffic, but the content failed or the UX is broken.","Content Fix: Fix page formatting, speed up load times, or rewrite the intro to match search intent."
Striking Distance, Position 8–15 (Striking Distance),High Engagement Time,"Google ranks you on page 2, but actual human readers love this page.","Optimization Win: Update headings, add internal links, and refresh stats to push this page to Top 5."
Content Quality, 0/Low Impressions, CTR, Position, Low Views, Low Engagement, "Page is dead weight", "Archive, Rewrite, Find Consolidation oppurtunities"
Crawled Not Indexed, "Index status Crawled not indexed, NA, "Thin Unhelpful Content not getting indexed or dropped", "Archive, Rewrite, Find Consolidation oppurtunities"




###Email 
- Email Capability to email from (screen Types)
--task (also send not empty values from  from Task Title, Status, Due - as nice table or html )
--project (also send not empty values from  from Project Name, Pipeline stage, Scope, 
, Start, Deadline - as nice table or html [includ deliverable table] [Include outstanding deliverables] [Include completed deliverables])
--deliverable also send not empty values from  from Title	Type	Status- as nice table or html )
--customer record (no extras)

Always send to customer and CC copy to "Agency Email" - dont hardcode values 
Open modal (maybe a popup works better here?)
 - show from Screen Type for UX
 - Editable TO: field but prefills to customer, (with a BC and CC field available later if better)
 - Editable Subject: (screen Title/name eg Project.Name or Task.Title)
 - Editable Message: (templates for each screen that can be editable before sending)
 - Schedule to send Date/Time (if possible)
 - Send now

- Email sent list on Customer record accordian 
- add row - simple log
- show last first
- Date - Subject - Screen Type

- Some screens might get templated predined emails (like send task status update, or send performance update or send full update etc)



##Ideas only
- Design phase - able to show a page list by type in accordians - each can be marked as approved by customer (all page, per page)
- If designer/customer logins ever get portal access, worth adding client-side isAdmin gating too


###Proposal Stage
 
- move the brighter website "proposal agreement" to stripe payment link > into this sytem (currently a plugin in wordpress)
- Simple Email from System (link to google doc proposal or text proposal for now)
- Eventually be able to capture the specific deliverables at proposal stage and Create and pull into the new project (in proposal stage)

- Sends Pretty/yourls shortlink to Agreement and Payment link 



###Agent Connection 
- Hermes
- Need Hermes Profile/Telegram Group per site/cust/assest? prob per asset
- TASK > DO TASK > LOG > UPDATE TASK
- For tasks assigned to Agent [send now], [Schedule Send (or add date in task instead? - pro/cons?)]

Fields Agent Might need Tasks (own table or in tasks? 
Agent Instructions:  Specific details sent just to agent (not for )
Skill - where there is a specific skill to use
Approval handling - Overide or Specificy Approval to write, (Apply Immediately(approved to write), Recommend and Report (suggest and wait), others?
Error handling.  "Continue, Log task ID,  slug + post id, Error Count + Error Types Summary", "Stop on First Failure, Log task, URL and exact error", Stop after x Failures.... etc.  




### 