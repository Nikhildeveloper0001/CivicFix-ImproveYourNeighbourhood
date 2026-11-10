"use strict";

// -----------------------------------
// 1. SAMPLE DATA
// -----------------------------------

const sampleIssues = [

    {
        id: "CFX-DEMO-001",
        title: "Pothole near Main Market",
        category: "Pothole",
        description:
            "A pothole on the road may cause difficulties for vehicles and pedestrians.",
        location: "Sample Market Road, New Delhi",
        severity: "High",
        status: "Reported",
        date: "2026-10-08",
        image:
            "https://commons.wikimedia.org/wiki/Special:FilePath/Potholes_on_road.jpg",
        createdAt: "2026-10-08T10:00:00.000Z"
    },
    {
        id: "CFX-DEMO-002",
        title: "Streetlight Not Working",
        category: "Streetlight",
        description:
            "A streetlight needs inspection because the road is poorly illuminated at night.",
        location: "Sample Park Lane, New Delhi",
        severity: "Medium",
        status: "In Progress",
        date: "2026-10-06",
        image:
            "https://commons.wikimedia.org/wiki/Special:FilePath/Damaged_dangerous_street_light_pole_20180524.jpg",
        createdAt: "2026-10-06T10:00:00.000Z"
    },
    {
        id: "CFX-DEMO-004",
        title: "Water Leakage on Road",
        category: "Water Leakage",
        description:
            "Water is leaking near the roadside and requires inspection.",
        location: "Sample College Road, New Delhi",
        severity: "High",
        status: "Resolved",
        date: "2026-10-02",
        image:
            "https://commons.wikimedia.org/wiki/Special:FilePath/Water_dripping_out_of_an_urban_water_supply_pipeline_in_India_20120311.jpg",
        createdAt: "2026-10-02T10:00:00.000Z"
    }
];

// ------------------------------------------------------------
// 1. ISSUE REPORTS: load, save, display, search and filter
// ------------------------------------------------------------
const STORAGE_KEY = "civicfix_reports_v1";
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const issueGrid = document.getElementById("issueGrid");
const issueForm = document.getElementById("issueForm");
const reportSection = document.getElementById("report");

let toastTimer;

// -----------------------------------
// ISSUE LOCATION PICKER (Leaflet)
// -----------------------------------
const locationPicker = (() => {
    const mapElement = document.getElementById("issueLocationMap");
    const latitudeInput = document.getElementById("locationLatitude");
    const longitudeInput = document.getElementById("locationLongitude");
    const statusElement = document.getElementById("locationSelectionStatus");
    const currentLocationButton = document.getElementById("useCurrentLocation");
    let map = null;
    let marker = null;

    function updateStatus(lat, lng) {
        latitudeInput.value = Number(lat).toFixed(7);
        longitudeInput.value = Number(lng).toFixed(7);
        statusElement.classList.add("is-selected");
        statusElement.innerHTML = `<i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            <span>Map position selected: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}</span>`;
    }

    function selectPosition(lat, lng, pan = false) {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            marker.on("dragend", () => {
                const point = marker.getLatLng();
                updateStatus(point.lat, point.lng);
            });
        }
        updateStatus(lat, lng);
        if (pan) map.setView([lat, lng], Math.max(map.getZoom(), 16));
    }

    function initialize() {
        if (!mapElement || map) return;
        if (typeof L === "undefined") {
            if (statusElement) statusElement.textContent = "The map could not load. Check your internet connection and refresh the page.";
            return;
        }
        map = L.map(mapElement, { scrollWheelZoom: false }).setView([28.6139, 77.2090], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
        }).addTo(map);
        map.on("click", event => selectPosition(event.latlng.lat, event.latlng.lng));
        // The report panel starts hidden, so Leaflet needs a size refresh after it is shown.
        window.setTimeout(() => map.invalidateSize(), 120);
    }

    function refreshSize() {
        if (!map) initialize();
        if (map) window.setTimeout(() => map.invalidateSize(), 180);
    }

    function useCurrentLocation() {
        if (!navigator.geolocation) {
            showToast("Location access is not supported by this browser. Select a point on the map instead.");
            return;
        }
        const button = currentLocationButton;
        if (button) { button.disabled = true; button.dataset.previousText = button.innerHTML; button.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Finding location...'; }
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            initialize();
            if (!map) {
                if (button) { button.disabled = false; button.innerHTML = button.dataset.previousText || '<i class="fa-solid fa-location-crosshairs"></i> Use My Current Location'; delete button.dataset.previousText; }
                showToast("The map is unavailable. Refresh the page or select the location after it loads.");
                return;
            }
            selectPosition(latitude, longitude, true);
            if (button) { button.disabled = false; button.innerHTML = button.dataset.previousText || '<i class="fa-solid fa-location-crosshairs"></i> Use My Current Location'; delete button.dataset.previousText; }
            showToast("Current location selected. Check the pin and enter the address before submitting.");
        }, error => {
            if (button) { button.disabled = false; button.innerHTML = button.dataset.previousText || '<i class="fa-solid fa-location-crosshairs"></i> Use My Current Location'; delete button.dataset.previousText; }
            const messages = {
                1: "Location permission was denied. Allow it in your browser or select a point on the map.",
                2: "Your location could not be determined. Try again or select a point on the map.",
                3: "Location request timed out. Try again or select a point on the map."
            };
            showToast(messages[error.code] || "Could not get your location. Select a point on the map.");
        }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
    }

    function reset() {
        if (marker && map) { map.removeLayer(marker); marker = null; }
        if (latitudeInput) latitudeInput.value = "";
        if (longitudeInput) longitudeInput.value = "";
        if (statusElement) {
            statusElement.classList.remove("is-selected");
            statusElement.innerHTML = '<i class="fa-solid fa-circle-info" aria-hidden="true"></i> No map position selected yet.';
        }
    }

    if (currentLocationButton) currentLocationButton.addEventListener("click", useCurrentLocation);
    if (issueForm) issueForm.addEventListener("reset", () => window.setTimeout(reset, 0));

    return { initialize, refreshSize, reset };
})();

window.civicfixLocationPicker = locationPicker;

// -----------------------------------
// 2. SAFE HTML OUTPUT
// -----------------------------------

const HTML_ENTITIES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
};

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => HTML_ENTITIES[char]);
}

// -----------------------------------
// 3. LOCAL STORAGE
// -----------------------------------

function loadIssues() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored === null) {
            return sampleIssues.map(issue => ({ ...issue }));
        }

        const parsed = JSON.parse(stored);

        if (!Array.isArray(parsed)) {
            throw new Error("Invalid stored data");
        }

        return parsed;
    } catch (error) {
        console.error("Could not load saved reports:", error);
        return sampleIssues.map(issue => ({ ...issue }));
    }
}

let issues = loadIssues();

function saveIssues() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
        return true;
    } catch (error) {
        console.error("Could not save reports:", error);
        showToast(
            "Storage is full or unavailable. Try a smaller image."
        );
        return false;
    }
}

// -----------------------------------
// 4. STATUS STYLING
// -----------------------------------

function getStatusClass(status) {
    if (status === "Resolved") {
        return "status-resolved";
    }

    if (status === "In Progress") {
        return "status-progress";
    }

    return "status-open";
}

// -----------------------------------
// 5. RENDER ISSUE CARDS
// -----------------------------------

function renderIssues(list) {
    if (list.length === 0) {
        issueGrid.innerHTML = `
            <div class="empty-state">
                <h3>No issues found</h3>
                <p>Try changing your search or filters.</p>
            </div>
        `;

        return;
    }

    issueGrid.innerHTML = list.map(issue => {
        const title = escapeHTML(issue.title);
        const category = escapeHTML(issue.category);
        const description = escapeHTML(issue.description);
        const location = escapeHTML(issue.location);
        const status = escapeHTML(issue.status);
        const id = escapeHTML(issue.id);
        // Accept uploaded Supabase Storage URLs, local previews, and sample images.
        const image = issue.image &&
            (issue.image.startsWith("data:image/") ||
             /^https:\/\//i.test(issue.image))
            ? issue.image
            : "";

        const safeImage = escapeHTML(image);

        return `
            <article class="issue-card">

                <img
                    class="issue-image"
                    src="${safeImage}"
                    alt="${title}"
                    loading="lazy"
                    onerror="this.style.display='none'"
                >

                <div class="issue-body">

                    <div class="badges">
                        <span class="badge">${category}</span>
                        <span class="badge ${getStatusClass(issue.status)}">
                            ${status}
                        </span>
                    </div>

                    <h3>${title}</h3>

                    <p class="issue-location">
                        <i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${location}
                    </p>
                    ${Number.isFinite(Number(issue.location_lat)) && Number.isFinite(Number(issue.location_lng)) && issue.location_lat !== null && issue.location_lng !== null ? `
                    <a class="issue-map-link" href="https://www.openstreetmap.org/?mlat=${Number(issue.location_lat)}&mlon=${Number(issue.location_lng)}#map=17/${Number(issue.location_lat)}/${Number(issue.location_lng)}" target="_blank" rel="noopener noreferrer">
                        <i class="fa-solid fa-map-location-dot" aria-hidden="true"></i> View on map
                    </a>` : ""}

                    <p class="issue-description">
                        ${description}
                    </p>

                    <div class="issue-footer">
                        <span>${escapeHTML(issue.date)}</span>

                        <button
                            type="button"
                            data-view-id="${id}"
                        >
                            View Details 
                        </button>
                    </div>

                </div>

            </article>
        `;
    }).join("");
}

// -----------------------------------
// 6. STATISTICS
// -----------------------------------

function updateStatistics() {
    const total = issues.length;

    const open = issues.filter(issue =>
        issue.status === "Reported"
    ).length;

    const progress = issues.filter(issue =>
        issue.status === "In Progress"
    ).length;

    const resolved = issues.filter(issue =>
        issue.status === "Resolved"
    ).length;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("openCount").textContent = open;
    document.getElementById("progressCount").textContent = progress;
    document.getElementById("resolvedCount").textContent = resolved;
}

// -----------------------------------
// 7. SEARCH AND FILTER
// -----------------------------------

function filterIssues() {
    const query = document
        .getElementById("searchInput")
        .value.trim()
        .toLowerCase();

    const category = document.getElementById("categoryFilter").value;
    const status = document.getElementById("statusFilter").value;

    const filtered = issues.filter(issue => {
        const matchesQuery = [
            issue.title,
            issue.description,
            issue.location,
            issue.category,
            issue.id
        ].some(value =>
            String(value).toLowerCase().includes(query)
        );

        const matchesCategory =
            category === "all" || issue.category === category;

        const matchesStatus =
            status === "all" || issue.status === status;

        return matchesQuery && matchesCategory && matchesStatus;
    });

    renderIssues(filtered);
}

document.getElementById("searchInput")
    .addEventListener("input", filterIssues);

document.getElementById("categoryFilter")
    .addEventListener("change", filterIssues);

document.getElementById("statusFilter")
    .addEventListener("change", filterIssues);

document.getElementById("resetFilters")
    .addEventListener("click", function () {
        document.getElementById("searchInput").value = "";
        document.getElementById("categoryFilter").value = "all";
        document.getElementById("statusFilter").value = "all";

        filterIssues();
    });

// -----------------------------------
// 8. OPEN AND CLOSE REPORT FORM
// -----------------------------------

// Show the report form when the user clicks a Report Issue button.
function openReportForm() {
    reportSection.classList.add("visible");
    if (window.civicfixLocationPicker) window.civicfixLocationPicker.refreshSize();
    reportSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    setTimeout(() => {
        document.getElementById("issueTitle").focus();
    }, 350);

    document.getElementById("navLinks").classList.remove("open");
    document.getElementById("menuToggle")
        .setAttribute("aria-expanded", "false");
}

document.querySelectorAll("[data-open-report]").forEach(button => {
    button.addEventListener("click", function (event) {
        event.preventDefault();
        openReportForm();
    });
});

document.getElementById("cancelReport")
    .addEventListener("click", function () {
        reportSection.classList.remove("visible");
        issueForm.reset();

        const preview = document.getElementById("imagePreview");
        preview.removeAttribute("src");
        preview.style.display = "none";

        document.getElementById("home").scrollIntoView({
            behavior: "smooth"
        });
    });

// -----------------------------------
// 9. MOBILE MENU
// -----------------------------------

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", function () {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", function () {
        if (link.hasAttribute("data-open-report")) {
            return;
        }

        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
    });
});

// -----------------------------------
// 10. IMAGE PREVIEW AND VALIDATION
// -----------------------------------

const photoInput = document.getElementById("issuePhoto");
const imagePreview = document.getElementById("imagePreview");

photoInput.addEventListener("change", function () {
    const file = photoInput.files[0];

    imagePreview.removeAttribute("src");
    imagePreview.style.display = "none";

    if (!file) {
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        photoInput.value = "";
        showToast("Please choose a JPG, PNG or WebP image.");
        return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
        photoInput.value = "";
        showToast("Image must be smaller than 2 MB.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        imagePreview.src = event.target.result;
        imagePreview.style.display = "block";
    };

    reader.onerror = function () {
        showToast("Could not read the selected image.");
    };

    reader.readAsDataURL(file);
});

// -----------------------------------
// 11. CREATE A NEW REPORT
// -----------------------------------

// Save a new issue report when the form is submitted.
issueForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!issueForm.reportValidity()) {
        return;
    }

    const title = document.getElementById("issueTitle")
        .value.trim();

    const category = document.getElementById("issueCategory")
        .value;

    const description = document.getElementById("issueDescription")
        .value.trim();

    const location = document.getElementById("issueLocation")
        .value.trim();

    const severity = document.getElementById("issueSeverity")
        .value;

    const date = document.getElementById("issueDate").value;

    if (
        title.length === 0 ||
        description.length < 10 ||
        location.length === 0
    ) {
        showToast("Please enter valid issue details.");
        return;
    }

    if (date > new Date().toISOString().slice(0, 10)) {
        showToast("The observed date cannot be in the future.");
        return;
    }

    const photoFile = photoInput.files[0];

    if (photoFile && photoFile.size > MAX_IMAGE_SIZE) {
        showToast("Image must be smaller than 2 MB.");
        return;
    }

    const createReport = function (imageData) {
        const newIssue = {
            id: "CFX-" + Date.now(),
            title: title,
            category: category,
            description: description,
            location: location,
            severity: severity,
            status: "Reported",
            date: date,
            image: imageData || "",
            createdAt: new Date().toISOString()
        };

        issues.unshift(newIssue);

        if (!saveIssues()) {
            issues.shift();
            return;
        }

        issueForm.reset();
        imagePreview.removeAttribute("src");
        imagePreview.style.display = "none";

        reportSection.classList.remove("visible");

        document.getElementById("searchInput").value = "";
        document.getElementById("categoryFilter").value = "all";
        document.getElementById("statusFilter").value = "all";

        updateStatistics();
        filterIssues();

        document.getElementById("issues").scrollIntoView({
            behavior: "smooth"
        });

        showToast(
            "Report created successfully. ID: " + newIssue.id
        );
    };

    if (!photoFile) {
        createReport("");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        createReport(event.target.result);
    };

    reader.onerror = function () {
        showToast("Could not process the selected photograph.");
    };

    reader.readAsDataURL(photoFile);
});

// -----------------------------------
// 12. ISSUE DETAILS
// -----------------------------------

issueGrid.addEventListener("click", function (event) {
    const button = event.target.closest("[data-view-id]");

    if (!button) {
        return;
    }

    const issue = issues.find(item =>
        item.id === button.dataset.viewId
    );

    if (!issue) {
        showToast("Issue not found.");
        return;
    }

    try {
        sessionStorage.setItem("civicfix_selected_issue_v1", JSON.stringify(issue));
        window.location.href = "issue-details.html";
    } catch (error) {
        showToast("Could not open issue details. Please try again.");
    }
});

// -----------------------------------
// 13. MY REPORTS
// -----------------------------------

document.getElementById("myReportsLink")
    .addEventListener("click", function (event) {
        event.preventDefault();

        const storedIds = new Set(
            issues
                .filter(issue =>
                    !issue.id.startsWith("CFX-DEMO-")
                )
                .map(issue => issue.id)
        );

        if (storedIds.size === 0) {
            showToast("You have not submitted any reports yet.");
            return;
        }

        document.getElementById("searchInput").value = "CFX-";
        document.getElementById("categoryFilter").value = "all";
        document.getElementById("statusFilter").value = "all";

        filterIssues();

        showToast(
            "Showing locally saved reports. This is not a user account."
        );

        document.getElementById("issues").scrollIntoView({
            behavior: "smooth"
        });
    });

// -----------------------------------
// 14. TOAST MESSAGES
// -----------------------------------

// Show a small message at the bottom of the page.
function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function () {
        toast.classList.remove("show");
    }, 4000);
}

// -----------------------------------
// 15. INITIALIZE APPLICATION
// -----------------------------------

document.getElementById("currentYear").textContent =
    new Date().getFullYear();

document.getElementById("issueDate").max =
    new Date().toISOString().slice(0, 10);

updateStatistics();
filterIssues();

// ------------------------------------------------------------
// 2. SIGN IN / SIGN UP AND ACCOUNT MENU
// This is a front-end . A real backend should handle accounts
// and passwords securely when you add one later.
// ------------------------------------------------------------

// Find the HTML elements used by the account feature.
const authOverlay = document.getElementById("authOverlay");
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authNameGroup = document.getElementById("authNameGroup");
const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");
const authSignInTab = document.getElementById("authSignInTab");
const authSignUpTab = document.getElementById("authSignUpTab");
const accountOverlay = document.getElementById("accountOverlay");
const userMenuOverlay = document.getElementById("userMenuOverlay");

// These names identify the accounts in this browser's localStorage.
const USERS_KEY = "civicfix_users_v1";
const CURRENT_USER_KEY = "civicfix_current_user_v1";
let authMode = "signin";

// Read the list of accounts saved in this browser.
function getUsers() {
    try {
        const savedUsers = localStorage.getItem(USERS_KEY) || "[]";
        const users = JSON.parse(savedUsers);
        return Array.isArray(users) ? users : [];
    } catch (error) {
        return [];
    }
}

// Open the Sign In / Sign Up modal.
function openAuthModal(mode) {
    setAuthMode(mode);
    authOverlay.classList.add("open");
    authOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Put the cursor in the email field for convenience.
    setTimeout(function () {
        authEmail.focus();
    }, 50);
}

// Close the authentication modal and clear its fields.
function closeAuthModal() {
    authOverlay.classList.remove("open");
    authOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    authForm.reset();
}

// Switch the same form between Sign In and Sign Up.
function setAuthMode(mode) {
    authMode = mode;
    const isSignUp = mode === "signup";

    authNameGroup.hidden = !isSignUp;
    authName.required = isSignUp;
    authPassword.autocomplete = isSignUp ? "new-password" : "current-password";

    if (isSignUp) {
        authTitle.textContent = "Create your account";
        authSubtitle.textContent = "Create a local CivicFix account.";
        authSubmit.textContent = "Create Account";
    } else {
        authTitle.textContent = "Welcome back";
        authSubtitle.textContent = "Sign in to your CivicFix account.";
        authSubmit.textContent = "Sign In";
    }

    authSignInTab.classList.toggle("active", !isSignUp);
    authSignUpTab.classList.toggle("active", isSignUp);
}

// Get the person currently signed in on this browser.
function getCurrentUser() {
    try {
        const savedUser = localStorage.getItem(CURRENT_USER_KEY) || "null";
        return JSON.parse(savedUser);
    } catch (error) {
        return null;
    }
}

// The user icon is the only navbar account button:
// signed in = open sidebar; signed out = open Sign In / Sign Up.
function openAccountDetails() {
    updateAccountProfile();
    const currentUser = getCurrentUser();

    if (!currentUser || !currentUser.email) {
        openAuthModal("signin");
        alert("Please sign in or create an account to view your account menu.");
        return;
    }

    let savedProfile = {};
    try {
        savedProfile = JSON.parse(localStorage.getItem(getProfileStorageKey()) || "{}");
    } catch (error) {
        savedProfile = {};
    }

    document.getElementById("userMenuName").textContent =
        savedProfile.name || currentUser.name || "CivicFix User";

    document.getElementById("userMenuEmail").textContent =
        currentUser.email || "--";

    userMenuOverlay.classList.add("open");
    userMenuOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

// Close the account sidebar.
function closeUserMenu() {
    userMenuOverlay.classList.remove("open");
    userMenuOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

// Show the signed-in user's name and email in the Profile dialog.
function openProfileDetails() {
    const currentUser = getCurrentUser();

    if (!currentUser || !currentUser.email) {
        closeUserMenu();
        openAuthModal("signin");
        return;
    }

    document.getElementById("accountNameValue").textContent = currentUser.name || "—";
    document.getElementById("accountEmailValue").textContent = currentUser.email || "—";

    closeUserMenu();
    accountOverlay.classList.add("open");
    accountOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

// Close the Profile dialog.
function closeAccountDetails() {
    accountOverlay.classList.remove("open");
    accountOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

// -------------------- Account menu clicks --------------------

document.getElementById("accountDetailsButton").addEventListener("click", openAccountDetails);
document.getElementById("userMenuClose").addEventListener("click", closeUserMenu);

// Close the sidebar if the user clicks the dark area outside it.
userMenuOverlay.addEventListener("click", function (event) {
    if (event.target === userMenuOverlay) {
        closeUserMenu();
    }
});

document.getElementById("userMenuDashboard").addEventListener("click", function () {
    closeUserMenu();
    document.getElementById("home").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("userMenuReports").addEventListener("click", function (event) {
    event.preventDefault();
    closeUserMenu();
    document.getElementById("myReportsLink").click();
});

document.getElementById("userMenuProfile").addEventListener("click", function (event) {
    event.preventDefault();
    openProfileDetails();
});

// Sign out from the sidebar.
function signOutUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
    closeUserMenu();
    closeAccountDetails();
    updateAccountProfile();
    showToast("You have signed out.");
}

document.getElementById("userMenuSignOut").addEventListener("click", signOutUser);

// --------------------- Profile dialog clicks ------------------

document.getElementById("accountClose").addEventListener("click", closeAccountDetails);

accountOverlay.addEventListener("click", function (event) {
    if (event.target === accountOverlay) {
        closeAccountDetails();
    }
});

document.getElementById("accountSignOut").addEventListener("click", signOutUser);

// ---------------- Authentication modal clicks ----------------

document.getElementById("authClose").addEventListener("click", closeAuthModal);
authSignInTab.addEventListener("click", function () {
    setAuthMode("signin");
});
authSignUpTab.addEventListener("click", function () {
    setAuthMode("signup");
});

// Clicking the dark background closes the modal.
authOverlay.addEventListener("click", function (event) {
    if (event.target === authOverlay) {
        closeAuthModal();
    }
});

// Escape closes whichever account window is currently open.
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && authOverlay.classList.contains("open")) {
        closeAuthModal();
    }
    if (event.key === "Escape" && accountOverlay.classList.contains("open")) {
        closeAccountDetails();
    }
    if (event.key === "Escape" && userMenuOverlay.classList.contains("open")) {
        closeUserMenu();
    }
});

// Create an account or sign in when the authentication form is submitted.
authForm.addEventListener("submit", function (event) {
    event.preventDefault();
    showToast("Authentication is handled by Supabase. Check that civicfix-supabase.js loaded correctly.");
});

// =====================================
// SETTINGS: SAVE AND LOAD USER PROFILE
// =====================================

// LocalStorage key for profile information
const PROFILE_KEY = "civicfix_user_profile";
function getProfileStorageKey() {
    const user = getCurrentUser();
    const accountId = user && (user.id || user.email);
    return PROFILE_KEY + "_" + (accountId
        ? String(accountId).toLowerCase().replace(/[^a-z0-9_-]/g, "_")
        : "signed_out");
}

// Get all settings elements
const settingsPage = document.getElementById("settingsPage");
const settingsForm = document.getElementById("settingsForm");

const profileName = document.getElementById("ProfileName");
const profileDob = document.getElementById("profileDob");
const profileGender = document.getElementById("ProfileGender");
const profileBio = document.getElementById("profileBio");

const profilePicture = document.getElementById("profilePicture");
const profilePreview = document.getElementById("profilePreview");

const cancelSettings = document.getElementById("cancelSettings");

let profileImageData = "";

// Load previously saved profile
function loadProfileSettings() {
    try {
        // File inputs cannot be restored from localStorage; clear the previous account's filename.
        profilePicture.value = "";
        const savedProfile = JSON.parse(
            localStorage.getItem(getProfileStorageKey()) || "{}"
        );

        profileName.value = savedProfile.name || "";
        profileDob.value = savedProfile.dob || "";
        profileGender.value = savedProfile.gender || "";
        profileBio.value = savedProfile.bio || "";

        profileImageData = savedProfile.picture || "";

        // Show the saved picture
        if (profileImageData) {
            profilePreview.src = profileImageData;
            profilePreview.hidden = false;
        } else {
            profilePreview.removeAttribute("src");
            profilePreview.hidden = true;
        }

    } catch (error) {
        console.error("Could not load profile settings:", error);
        showToast("Could not load saved profile.");
    }
}

// Preview a newly selected picture
profilePicture.addEventListener("change", function () {
    const file = profilePicture.files[0];

    if (!file) {
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        profilePicture.value = "";
        showToast("Choose a JPG, PNG or WebP image.");
        return;
    }

    // Keep the image small because localStorage has limited space
    if (file.size > 500 * 1024) {
        profilePicture.value = "";
        showToast("Choose a profile picture smaller than 500 KB.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        profileImageData = event.target.result;
        profilePreview.src = profileImageData;
    };

    reader.onerror = function () {
        showToast("Could not read the selected picture.");
    };

    reader.readAsDataURL(file);
});

// Save profile information
settingsForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const profile = {
        name: profileName.value.trim(),
        dob: profileDob.value,
        gender: profileGender.value,
        bio: profileBio.value.trim(),
        picture: profileImageData
    };

    if (!profile.name) {
        showToast(
            "Enter your name"
        );
        profileName.focus();
        return;
    }

    try {
        localStorage.setItem(
            getProfileStorageKey(),
            JSON.stringify(profile)
        );

        alert("Profile settings saved successfully.");
        settingsPage.hidden = true;

        updateAccountProfile();

    } catch (error) {
        console.error("Could not save profile:", error);

        showToast(
            "Could not save settings. Try using a smaller picture."
        );
    }
});

// Cancel changes and restore saved information
cancelSettings.addEventListener("click", function () {
    loadProfileSettings();

    settingsPage.hidden = true;
});

// Load profile information when the page opens
loadProfileSettings();

// Open Settings when the sidebar link is clicked
document.getElementById("userMenuSettings")
    .addEventListener("click", function (event) {

        event.preventDefault();

        settingsPage.hidden = false;

        loadProfileSettings();

        settingsPage.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

// Keep the saved profile name and picture in sync across the account UI.
function updateAccountProfile() {
    let savedProfile = {};

    try {
        savedProfile = JSON.parse(localStorage.getItem(getProfileStorageKey()) || "{}");
    } catch (error) {
        console.error("Could not read saved profile:", error);
    }

    const currentUser = getCurrentUser();
    const isSignedIn = Boolean(currentUser && currentUser.email);
    const name = savedProfile.name || currentUser?.name || "CivicFix User";
    // A saved photo is shown only while signed in; otherwise show the default icon.
    const picture = isSignedIn ? (savedProfile.picture || "") : "";

    const sidebarName = document.getElementById("userMenuName");
    const sidebarPicture = document.getElementById("sidebarProfilePic");
    const sidebarIcon = document.getElementById("sidebarDefaultIcon");
    const navbarAvatar = document.querySelector("#accountDetailsButton .account-avatar");

    if (sidebarName) sidebarName.textContent = isSignedIn ? name : "CivicFix User";

    if (sidebarPicture && sidebarIcon) {
        sidebarPicture.hidden = !picture;
        sidebarIcon.hidden = Boolean(picture);

        if (picture) {
            sidebarPicture.src = picture;
        } else {
            sidebarPicture.removeAttribute("src");
        }
    }

    if (navbarAvatar) {
        let navbarPicture = navbarAvatar.querySelector("img");
        const navbarIcon = navbarAvatar.querySelector("i");

        if (picture) {
            if (!navbarPicture) {
                navbarPicture = document.createElement("img");
                navbarPicture.alt = "Profile picture";
                navbarAvatar.appendChild(navbarPicture);
            }

            navbarPicture.src = picture;
            navbarPicture.hidden = false;
            if (navbarIcon) navbarIcon.hidden = true;
        } else {
            navbarPicture?.remove();
            if (navbarIcon) navbarIcon.hidden = false;
        }
    }
}

// The script is loaded at the end of the page, so the DOM is already available.
updateAccountProfile();
