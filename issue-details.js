"use strict";
const main = document.getElementById("issueDetailsMain");
const safe = value => String(value ?? "—").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function showIssue(issue) {
  if (!issue || !issue.id) {
    main.innerHTML = `<div class="details-error"><h2>Issue details unavailable</h2><p>Please return to Explore Issues and select View Details on a report.</p><p style="margin-top:16px"><a class="btn btn-primary" href="index.html#issues">Back to Explore Issues</a></p></div>`;
    return;
  }
  const imageValue = issue.image_url || issue.image || "";
  const image = typeof imageValue === "string" && (imageValue.startsWith("https://") || imageValue.startsWith("data:image/")) ? imageValue : "";
  const date = issue.observed_date || issue.date || issue.created_at || issue.createdAt;
  main.innerHTML = `
    <a class="details-back" href="index.html#issues"><i class="fa-solid fa-chevron-left"></i> Back to Explore Issues</a>
    <article class="details-card">
      ${image ? `<img class="details-photo" src="${safe(image)}" alt="${safe(issue.title)}" onerror="this.style.display='none'">` : ""}
      <div class="details-content">
        <div class="badges"><span class="badge">${safe(issue.category)}</span><span class="badge">${safe(issue.status)}</span></div>
        <h1>${safe(issue.title)}</h1><p style="color:#657180">Report ID: ${safe(issue.id)}</p>
        <p class="details-description">${safe(issue.description)}</p>
        <div class="details-grid">
          <div class="detail-field"><span>Location</span><strong>${safe(issue.location)}</strong></div>
          <div class="detail-field"><span>Severity</span><strong>${safe(issue.severity)}</strong></div>
          <div class="detail-field"><span>Status</span><strong>${safe(issue.status)}</strong></div>
          <div class="detail-field"><span>Date reported</span><strong>${safe(date ? String(date).slice(0,10) : "—")}</strong></div>
        </div>
      </div>
    </article>`;
}

(async function () {
  const id = new URLSearchParams(location.search).get("id");
  if (id && window.supabase) {
    const client = window.supabase.createClient(
      "https://qvaapvsuoundibrmbgzj.supabase.co",
      "sb_publishable_prT6hQR1ORGyvxiIHD-53g_IDUbABNW"
    );
    const { data, error } = await client.from("reports").select("id,title,category,description,location,severity,status,observed_date,image_url,created_at").eq("id", id).maybeSingle();
    if (error) {
      main.innerHTML = `<div class="details-error"><h2>Could not load report</h2><p>${safe(error.message)}</p><a class="btn btn-primary" href="index.html#issues">Back to Explore Issues</a></div>`;
      return;
    }
    showIssue(data);
    return;
  }
  try { showIssue(JSON.parse(sessionStorage.getItem("civicfix_selected_issue_v1") || "null")); }
  catch { showIssue(null); }
})();
