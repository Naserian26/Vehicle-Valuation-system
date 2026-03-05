# 🚗 KRA Vehicle Valuation System

A full-stack web application for the **Kenya Revenue Authority (KRA)** to manage vehicle tax valuations, user access control, and system administration.

---

## 📸 Preview

> Dashboard · Vehicle DB · Tax Valuation · Admin Panel

---

## 🧱 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| Vite | 7.x | Build tool & dev server |
| Tailwind CSS | 4.x | Styling |
| React Router DOM | 7.x | Client-side routing |
| Axios | 1.x | HTTP requests |
| Chart.js + react-chartjs-2 | 4.x | Dashboard charts |
| jsPDF + jspdf-autotable | 4.x | PDF export |
| SheetJS (xlsx) | 0.18 | Excel export |
| Lucide React | 0.563 | Icons |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Flask | 3.1 | Web framework |
| Flask-JWT-Extended | 4.7 | Authentication |
| Flask-PyMongo | 3.0 | MongoDB ODM |
| Flask-Mail | 0.10 | Email (invites, passwords) |
| Flask-Bcrypt | 1.0 | Password hashing |
| Flask-CORS | 6.0 | Cross-origin requests |
| pandas + numpy | 3.x / 2.x | Data processing |
| openpyxl | 3.1 | Excel file handling |

### Database
- **MongoDB** — local (MongoDB Compass) or cloud (MongoDB Atlas)

---

## ✨ Features

### 👥 Authentication & Security
- Email-based registration with temporary password
- JWT access tokens
- Role-based access control (RBAC) — Super Admin, Business Admin, Viewer
- Mandatory password change on first login
- Password strength enforcement
- Session timeout after inactivity
- Forgot password / reset password via email
- Admin invite system via tokenized email links

### 📊 Dashboard
- Live vehicle statistics (total, by year)
- Top vehicles by volume (bar chart)
- Quick action shortcuts based on user role
- Role-aware UI — users only see what they can access

### 🚗 Vehicle DB
- Paginated vehicle directory (2025 / 2020 / All)
- Search by make or model
- Add / Edit / Delete vehicles (permission-controlled)
- One-click navigate to Tax Valuation from any vehicle card

### 💰 Tax Valuation
- Automatic depreciation calculation based on vehicle age
- Import Duty, Excise Duty, VAT, IDF, RDL breakdown
- Interactive doughnut chart
- Year & Month picker
- Copy quote to WhatsApp
- Print-ready output
- Pre-filled from Vehicle DB or manual entry

### 🛡️ Admin Panel
- **User Management** — view all users, invite Business Admins
- **Access Matrix** — toggle feature permissions per role in real time
- **System Logs** — monitor all login, role change, and security events
  - Filter by level (INFO / WARNING / ERROR / CRITICAL)
  - Filter by event type
  - Search by user, message, or IP
  - **Export to PDF** — branded KRA report with summary
  - **Export to Excel** — 3 sheets (All Logs, Summary, Errors only)
- **Email Management** — view all sent invites, resend or re-invite

### 🎨 UI/UX
- Bold black / white / red design system
- Light mode default with dark mode toggle
- Fully responsive sidebar with role-based navigation
- Auto-refresh on Logs and Email pages (every 30 seconds)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local via Compass, or Atlas cloud)

---

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/vehicle-valuation.git
cd vehicle-valuation
```

---

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:
```env
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_here
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_DEFAULT_SENDER=your_email@gmail.com
```

> ⚠️ Never commit your `.env` file. It is already in `.gitignore`.

Configure your database in `config.py`:
```python
OFFLINE_MODE = True   # True = local MongoDB, False = MongoDB Atlas
```

Start the backend:
```bash
python app.py
```
Backend runs on `http://localhost:5000`

---

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

---

### 4. First Login
1. Register with your email — a temporary password will be sent to you
2. Log in with the temporary password
3. You will be prompted to set a new secure password
4. You're in!

---

## 📁 Project Structure

```
vehicle-valuation/
├── backend/
│   ├── app.py              # Flask app entry point
│   ├── config.py           # App configuration
│   ├── admin.py            # Logs & email endpoints
│   ├── rbac_auth.py        # Role-based access control
│   ├── requirements.txt    # Python dependencies
│   └── .env                # ⚠️ Not committed — create manually
│
├── frontend/
│   ├── src/
│   │   ├── assets/         # KRA logos and images
│   │   ├── components/     # Sidebar, ProtectedRoute
│   │   ├── contexts/       # AuthContext, ThemeContext
│   │   ├── pages/          # All page components
│   │   └── App.jsx         # Routes and layout
│   ├── public/
│   ├── vite.config.js      # Vite + proxy config
│   └── package.json
│
└── README.md
```

---

## 🔐 User Roles

| Permission | Super Admin | Business Admin | Viewer |
|---|:---:|:---:|:---:|
| View Dashboard | ✅ | ✅ | ✅ |
| Search Vehicle DB | ✅ | ✅ | ✅ |
| Calculate Taxes | ✅ | ✅ | ✅ |
| Add Vehicles | ✅ | ✅ | ❌ |
| Edit / Delete Vehicles | ✅ | ✅ | ❌ |
| User Management | ✅ | ✅ | ❌ |
| Invite Admins | ✅ | ❌ | ❌ |
| System Logs | ✅ | ✅ | ❌ |
| Email Management | ✅ | ✅ | ❌ |
| Toggle All Permissions | ✅ | ❌ | ❌ |

> Permissions for Business Admin and Viewer roles can be toggled in real time via the Access Matrix.

---

## ⚙️ Environment Variables

| Variable | Description |
|---|---|
| `SECRET_KEY` | Flask secret key |
| `JWT_SECRET_KEY` | JWT signing key |
| `MAIL_USERNAME` | Gmail address used to send emails |
| `MAIL_PASSWORD` | Gmail App Password (not your login password) |
| `MAIL_DEFAULT_SENDER` | Display sender address |

> To generate a Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords

---

## 📄 License

This project is built for the **Kenya Revenue Authority** internal use.

---

## 👩‍💻 Developer

Built by **Naserian Mercy**
