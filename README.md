# CivicFix-ImproveYourNeighbourhood
  https://civicfix-improveyourneighbourhood.netlify.app/
  # 🏙️ CivicFix — Smart Civic Issue Reporting Platform

**CivicFix** is a web-based civic issue reporting platform designed to help citizens report local problems and make their communities cleaner, safer, and better maintained.

The platform provides a simple interface for reporting civic issues, viewing public reports, and tracking their reported status. It aims to improve communication between citizens and the authorities responsible for resolving public issues.

## ✨ Features

- **Report Civic Issues:** Submit reports about potholes, damaged streetlights, garbage accumulation, water leakage, and other public infrastructure problems.
- **Public Issue Reports:** Browse and view reported civic issues.
- **Issue Categories:** Organize reports by the type of civic problem.
- **Status Tracking:** View the current status of reported issues.
- **User Authentication:** Sign up and sign in using Supabase authentication.
- **User Profile Management:** Manage profile information and profile pictures.
- **Search and Filtering:** Find relevant issues using available filters.
- **Responsive Interface:** Access the platform through supported desktop and mobile browsers.
- **Backend Integration:** Use Supabase for backend services and data management.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Page structure |
| CSS3 | Styling and responsive layouts |
| JavaScript | Frontend logic and interactivity |
| Supabase | Backend services, authentication and database |
| Font Awesome | Icons |

## 📂 Project Structure

```text
CivicFix/
├── index.html
├── style.css
├── script.js
├── issueDetails.html
├── issueDetails.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser
- Visual Studio Code
- The VS Code Live Server extension (recommended)
- A Supabase project for backend functionality

### Installation

**1. Clone the repository**

 `https://github.com/Nikhildeveloper0001/CivicFix-ImproveYourNeighbourhood/commits?author=Nikhildeveloper0001` and `https://github.com/Nikhildeveloper0001/CivicFix-ImproveYourNeighbourhood/tree/main` .

```bash
git clone https://github.com/NikhilDeveloper0001/CivicFix-ImproveYourNeighbourhood.
```

**2. Open the project**

```bash
cd 
code . CivicFix-ImproveYourNeighbourhood      
```

Alternatively, download the repository as a ZIP file and open the extracted folder in VS Code.

**3. Run the application**

Open `index.html` in VS Code and select **Open with Live Server**.

Your application should open in your browser at a local development address.

## ⚙️ Supabase Configuration

CivicFix uses Supabase for backend functionality and user authentication.

1. Create a project in [Supabase](https://supabase.com/).
2. Open your project's API settings.
3. Obtain the Project URL and publishable key.
4. Configure the existing JavaScript integration with your project's credentials.
5. Ensure the required database tables, permissions, and authentication settings are configured.

Use the configuration pattern appropriate to your existing code:

```javascript
  const SUPABASE_URL = "https://qvaapvsuoundibrmbgzj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_prT6hQR1ORGyvxiIHD-53g_IDUbABNW";
```

**Security note:** Never expose a Supabase `service_role` key or secret key in frontend code. Use only the appropriate publishable key in the browser, and configure Row Level Security (RLS) policies to protect user data.

If your current JavaScript already initializes Supabase, retain that implementation rather than adding a duplicate client.

## 🔄 How It Works

1. A citizen creates an account or signs in.
2. The citizen submits a report describing a civic issue.
3. The application stores and displays reports through its configured backend.
4. Users can browse public reports and view their reported status.
5. Authorized backend workflows or responsible authorities can update issue statuses when those workflows are implemented.

## 🌐 Deployment

CivicFix can be deployed as a static frontend using a hosting service such as [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/).

General deployment steps:

1. Push the project to GitHub.
2. Import the repository into your chosen hosting platform.
3. Configure the correct project root and deployment settings.
4. Deploy the frontend.
5. Verify Supabase authentication, database access, image handling, and redirects on the deployed domain.

**Important:** Frontend deployment does not automatically configure your Supabase database or authentication. Configure your Supabase authentication redirect URLs and security policies separately.

## 🔐 Security and Privacy

- Never commit passwords, private API keys, or service-role credentials.
- Use appropriate Row Level Security policies.
- Validate user-submitted data.
- Restrict access to private profile information.
- Configure authentication redirect URLs for production.

## 🔮 Future Improvements

Potential enhancements include:

- Authority dashboard for managing civic complaints.
- Location-based issue reporting and maps.
- Image uploads and improved evidence management.
- Notifications when report statuses change.
- Duplicate issue detection.
- Analytics for identifying recurring civic problems.
- Improved accessibility and multilingual support.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the application.
5. Submit a pull request describing your changes.

## 👨‍💻 Author

Nikhil Dwivedi

GitHub: [Nikhildeveloper0001](https://github.com/Nikhildeveloper0001)

---

*Built to make civic problem reporting simpler, more transparent, and more accessible.*

