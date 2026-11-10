
"use strict";

const main = document.getElementById("issueDetailsMain");

const safe = value =>
  String(value ?? "—").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

function getLocationLink(issue) {
  let lat = Number(issue.location_lat);
  let lng = Number(issue.location_lng);

  // Use coordinates stored in Supabase.
  let hasCoordinates =
    issue.location_lat != null &&
    issue.location_lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180;

  // Fallback: detect coordinates from the location text.
  if (!hasCoordinates) {
    const match = String(issue.location || "").match(
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
    );

    if (match) {
      lat = Number(match[1]);
      lng = Number(match[2]);

      hasCoordinates =
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180;
    }
  }

  const query = hasCoordinates
    ? `${lat},${lng}`
    : String(issue.location || "").trim();

  if (!query || query === "—") return "";

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// Improve the existing page design without changing HTML.
function addDetailsStyles() {
  if (document.getElementById("details-modern-styles")) return;

  const style = document.createElement("style");
  style.id = "details-modern-styles";

  style.textContent = `
    .details-wrap {
      width: min(1000px, calc(100% - 36px));
      margin: 34px auto 65px;
    }

    .details-back {
      margin-bottom: 20px;
    }

    .details-card {
      overflow: hidden;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 12px 35px rgba(20, 40, 70, .07);
    }

    .details-photo-wrap {
      background: #edf2f7;
    }

    .details-photo {
      width: 100%;
      max-height: 430px;
      min-height: 220px;
      object-fit: cover;
      cursor: zoom-in;
    }

    .details-content {
      padding: clamp(22px, 4vw, 38px);
    }

    .details-content h1 {
      margin: 16px 0 8px;
      color: #172b43;
      font-size: clamp(26px, 4vw, 36px);
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    .details-id {
      color: #8390a1;
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .details-description {
      margin: 22px 0;
      color: #526276;
      font-size: 14px;
      line-height: 1.8;
      white-space: pre-wrap;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-top: 24px;
    }

    .detail-field {
      padding: 19px;
      border: 1px solid #e5ebf2;
      border-radius: 13px;
      background: #f8fafd;
    }

    .detail-field span {
      display: block;
      margin-bottom: 9px;
      color: #7a899b;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .6px;
      text-transform: uppercase;
    }

    .detail-field strong {
      color: #263a51;
      font-size: 14px;
      line-height: 1.6;
      overflow-wrap: anywhere;
    }

    .details-location {
      display: flex;
      align-items: flex-start;
      gap: 9px;
    }

    .details-location-icon {
      color: #1764b2;
      margin-top: 3px;
    }

    .details-map-link {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      margin-top: 13px;
      color: #1764b2;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
    }

    .details-map-link:hover {
      color: #0d4380;
      text-decoration: underline;
    }

    .details-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
    }

    .details-error {
      padding: 30px;
      border-radius: 14px;
      background: white;
      border: 1px solid #e2e8f0;
    }

    @media (max-width: 650px) {
      .details-wrap {
        width: calc(100% - 24px);
        margin: 22px auto 40px;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .details-content {
        padding: 20px;
      }

      .details-card {
        border-radius: 14px;
      }
    }
  `;

  document.head.appendChild(style);
}

function showIssue(issue) {
  if (!issue || !issue.id) {
    main.innerHTML = `
      <div class="details-error">
        <h2>Issue details unavailable</h2>
        <p>Please return to Explore Issues and select View Details.</p>
        <a class="btn btn-primary" href="index.html#issues">
          Back to Explore Issues
        </a>
      </div>`;
    return;
  }

  const imageValue = issue.image_url || issue.image || "";

  const image =
    typeof imageValue === "string" &&
    (imageValue.startsWith("https://") ||
      imageValue.startsWith("data:image/"))
      ? imageValue
      : "";

  const date =
    issue.observed_date ||
    issue.date ||
    issue.created_at ||
    issue.createdAt;

  const location = issue.location || "Location unavailable";
  const mapLink = getLocationLink(issue);

  addDetailsStyles();

  main.innerHTML = `
    <a class="details-back" href="index.html#issues">
      <i class="fa-solid fa-arrow-left"></i>
      Back to Explore Issues
    </a>

    <article class="details-card">

      ${
        image
          ? `<img
              class="details-photo"
              src="${safe(image)}"
              alt="${safe(issue.title)}"
              onerror="this.style.display='none'"
            >`
          : ""
      }

      <div class="details-content">

        <div class="details-badges">
          <span class="badge">${safe(issue.category)}</span>
          <span class="badge">${safe(issue.status)}</span>
        </div>

        <h1>${safe(issue.title)}</h1>

        <p class="details-id">
          Report ID: ${safe(issue.id)}
        </p>

        <p class="details-description">${safe(issue.description)}</p>

        <div class="details-grid">

          <div class="detail-field">
            <span>Location</span>

            <div class="details-location">
              <i class="fa-solid fa-location-dot details-location-icon"></i>
              <strong>${safe(location)}</strong>
            </div>

            ${
              mapLink
                ? `<a
                    class="details-map-link"
                    href="${safe(mapLink)}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i class="fa-solid fa-map-location-dot"></i>
                    View on map
                  </a>`
                : ""
            }
          </div>

          <div class="detail-field">
            <span>Severity</span>
            <strong>${safe(issue.severity)}</strong>
          </div>

          <div class="detail-field">
            <span>Status</span>
            <strong>${safe(issue.status)}</strong>
          </div>

          <div class="detail-field">
            <span>Date Reported</span>
            <strong>${safe(date ? String(date).slice(0, 10) : "—")}</strong>
          </div>

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

    const { data, error } = await client
      .from("reports")
      .select(`
        id,
        title,
        category,
        description,
        location,
        severity,
        status,
        observed_date,
        image_url,
        created_at,
        location_lat,
        location_lng
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      main.innerHTML = `
        <div class="details-error">
          <h2>Could not load report</h2>
          <p>${safe(error.message)}</p>
          <a class="btn btn-primary" href="index.html#issues">
            Back to Explore Issues
          </a>
        </div>`;
      return;
    }

    showIssue(data);
    return;
  }

  try {
    const issue = JSON.parse(
      sessionStorage.getItem("civicfix_selected_issue_v1") || "null"
    );

    showIssue(issue);
  } catch {
    showIssue(null);
  }
})();
