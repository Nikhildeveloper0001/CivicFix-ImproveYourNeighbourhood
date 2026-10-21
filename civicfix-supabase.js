/* CivicFix Supabase adapter. Uses the existing UI and card renderer. */
(function () {
  const SUPABASE_URL = "https://qvaapvsuoundibrmbgzj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_prT6hQR1ORGyvxiIHD-53g_IDUbABNW";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.civicfixSupabase = client;
  let currentUser = null;
  let reportRows = [];

  const byId = id => document.getElementById(id);
  const toast = message => typeof window.showToast === "function" ? window.showToast(message) : alert(message);
  const normalize = row => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    category: row.category,
    description: row.description,
    location: row.location,
    severity: row.severity,
    status: row.status,
    date: row.observed_date,
    image: row.image_url || "",
    createdAt: row.created_at
  });

  async function refreshReports() {
    const { data, error } = await client.from("reports").select("id,user_id,title,category,description,location,severity,status,observed_date,image_url,created_at,updated_at").order("created_at", { ascending: false });
    if (error) throw error;
    reportRows = (data || []).map(normalize);
    // Keep the existing sample cards while adding real public reports.
    issues = [...reportRows, ...sampleIssues];
    updateStatistics();
    filterIssues();
  }

  async function refreshSession() {
    const { data: { session } } = await client.auth.getSession();
    currentUser = session?.user || null;
    if (currentUser) {
      localStorage.setItem("civicfix_current_user_v1", JSON.stringify({
        id: currentUser.id,
        name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "CivicFix User",
        email: currentUser.email
      }));
    } else {
      localStorage.removeItem("civicfix_current_user_v1");
    }
    // Reload fields after account changes so the previous user's profile never remains visible.
    if (typeof loadProfileSettings === "function") loadProfileSettings();
    if (typeof updateAccountProfile === "function") updateAccountProfile();
    const note = document.querySelector(".auth-note");
    if (note) note.textContent = "Secure account authentication is provided by Supabase.";
  }

  // Replace demo localStorage authentication with Supabase Auth.
  byId("authForm").addEventListener("submit", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const email = byId("authEmail").value.trim().toLowerCase();
    const password = byId("authPassword").value;
    const isSignup = byId("authNameGroup").hidden === false;
    const name = byId("authName").value.trim();
    const submit = byId("authSubmit");
    submit.disabled = true;
    try {
      let result;
      if (isSignup) {
        if (!name) throw new Error("Please enter your name.");
        result = await client.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (result.error) throw result.error;
        if (!result.data.session) {
          alert("Account created. Check your email to confirm, then sign in.");
          return;
        }
        toast("Account created successfully.");
      } else {
        result = await client.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        toast("Signed in successfully.");
      }
      await refreshSession();
      closeAuthModal();
      await refreshReports();
    } catch (error) {
      toast(error.message || "Authentication failed. Please try again.");
    } finally {
      submit.disabled = false;
    }
  }, true);

  // Ensure sign out really clears the Supabase session and avatar state.
  async function signOut(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const { error } = await client.auth.signOut();
    if (error) { toast(error.message); return; }
    await refreshSession();
    if (typeof closeUserMenu === "function") closeUserMenu();
    if (typeof closeAccountDetails === "function") closeAccountDetails();
    toast("You have signed out.");
  }
  byId("userMenuSignOut").addEventListener("click", signOut, true);
  byId("accountSignOut").addEventListener("click", signOut, true);

  // Save report and optional image in Supabase, never in localStorage.
  byId("issueForm").addEventListener("submit", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!byId("issueForm").reportValidity()) return;
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) {
      openAuthModal("signin");
      toast("Please sign in before submitting a report.");
      return;
    }
    const title = byId("issueTitle").value.trim();
    const category = byId("issueCategory").value;
    const description = byId("issueDescription").value.trim();
    const location = byId("issueLocation").value.trim();
    const severity = byId("issueSeverity").value;
    const date = byId("issueDate").value;
    const file = byId("issuePhoto").files[0];
    if (date > new Date().toISOString().slice(0, 10)) { toast("The observed date cannot be in the future."); return; }
    if (file && (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024)) { toast("Choose a JPG, PNG or WebP image smaller than 2 MB."); return; }
    const submit = byId("issueForm").querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      let imageUrl = null;
      if (file) {
        const path = `${session.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const upload = await client.storage.from("civicfix-reports").upload(path, file, { contentType: file.type, upsert: false });
        if (upload.error) throw upload.error;
        imageUrl = client.storage.from("civicfix-reports").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await client.from("reports").insert({
        user_id: session.user.id, title, category, description, location, severity,
        status: "Reported", observed_date: date, image_url: imageUrl
      });
      if (error) throw error;
      byId("issueForm").reset();
      byId("imagePreview").removeAttribute("src");
      byId("imagePreview").style.display = "none";
      reportSection.classList.remove("visible");
      byId("searchInput").value = "";
      byId("categoryFilter").value = "all";
      byId("statusFilter").value = "all";
      await refreshReports();
      byId("issues").scrollIntoView({ behavior: "smooth" });
      toast("Report submitted successfully.");
    } catch (error) {
      toast(error.message || "Could not submit report. Check database setup and policies.");
    } finally {
      if (submit) submit.disabled = false;
    }
  }, true);

  // View details by database ID; details page fetches the latest status.
  byId("issueGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-view-id]");
    if (!button) return;
    const report = reportRows.find(item => String(item.id) === button.dataset.viewId);
    if (!report) return; // sample cards continue using the original handler
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.href = `issue-details.html?id=${encodeURIComponent(report.id)}`;
  }, true);

  // My Reports shows only reports owned by the signed-in account.
  byId("myReportsLink").addEventListener("click", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) { openAuthModal("signin"); toast("Sign in to view your reports."); return; }
    const mine = reportRows.filter(report => report.user_id === session.user.id);
    issues = mine;
    byId("searchInput").value = "";
    byId("categoryFilter").value = "all";
    byId("statusFilter").value = "all";
    updateStatistics();
    filterIssues();
    byId("issues").scrollIntoView({ behavior: "smooth" });
    toast(mine.length ? "Showing your reports." : "You have not submitted any reports yet.");
  }, true);

  // Return to the public feed when Explore Issues is selected after My Reports.
  document.querySelectorAll('a[href="#issues"]').forEach(link => {
    if (link.id === "myReportsLink" || link.id === "userMenuReports") return;
    link.addEventListener("click", () => {
      setTimeout(() => refreshReports().catch(error => console.error(error)), 0);
    });
  });

  // Refresh public feed on return to Explore Issues and after auth state changes.
  client.auth.onAuthStateChange(() => {
    setTimeout(() => refreshSession().catch(console.error), 0);
  });
  refreshSession().then(refreshReports).catch(error => {
    console.error("CivicFix backend connection failed:", error);
    toast("Could not load online reports. Check the Supabase setup and connection.");
  });
})();
