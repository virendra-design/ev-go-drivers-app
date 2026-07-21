# ev-go-drivers-app
EV GO Drivers App - Mobile PWA for Fleet Management &amp; Duty Telemetry
# ⚡ EV GO Drivers App

<p align="center">
  <img src="https://lh3.googleusercontent.com/d/1qorj2i350GfWe3UurwbM2_opB5Ojr3e4" alt="EV GO Logo" width="220"/>
</p>

<p align="center">
  <b>A Progressive Web Application (PWA) built for EV Fleet Drivers to manage daily duties, check-ins, telemetry, payouts, and emergency dispatch.</b>
</p>

---

## 🌟 Key Features

* 📸 **Facial Verification & Telemetry:** In-app camera selfie capture with real-time GPS telemetry during shift check-in/check-out.
* ⏱ **Live Duty Timer & Payout Accrual:** Real-time accrued payout ticker based on client shift rates (Amazon, Fairdeal, Flipkart, Delhivery).
* 📊 **7-Day Duty Logs Consolidation:** Automatically groups multiple daily check-ins into single calendar-day cards showing total active hours.
* 💰 **Finance & Custom Date Filters:** Full range filtering, lifetime total earnings, base pay breakdown, and penalty deductions highlighted in red.
* 📄 **Monthly Salary Payslip with Month Filter:** Dynamic month selector dropdown (e.g., July 2026) calculating unique calendar working days accurately.
* 👤 **Driver Profile & Photo Updates:** In-app driver profile management with direct photo updates stored on Google Drive.
* 🚨 **Emergency SOS Dispatch:** One-tap emergency dispatch logging GPS coordinates and direct click-to-call hotline numbers for Fleet Control, Breakdown RSA, and Police.
* 🔄 **Persistent App Session:** Drivers stay securely logged in across page reloads and tab closes until explicitly logging out.

---

## 🛠️ Technology Stack

* **Frontend:** HTML5, CSS3 (Mobile-First CSS Tokens), Modern JavaScript (ES6+)
* **Backend:** Google Apps Script (`Code.gs`, `Finance.gs`, `Attendance.gs`, etc.)
* **Database:** Google Sheets (Automated multi-sheet ledger: *Employees*, *Attendance*, *Notifications*, *SOS_Alerts*)
* **Storage:** Google Drive API (For Document & Profile Photo Uploads)
* **Maps:** Leaflet.js & OpenStreetMap GPS Telemetry

---

## 🚀 Deployment Instructions

### Method 1: Deploy via Google Apps Script Editor

1. Open [Google Sheets](https://sheets.google.com) and create a new spreadsheet named **`EV GO Drivers App Database`**.
2. Click **Extensions** $\rightarrow$ **Apps Script**.
3. Create the 10 core project files in the Apps Script editor:
   * `Code.gs`
   * `Utils.gs`
   * `Auth.gs`
   * `Attendance.gs`
   * `Finance.gs`
   * `Notification.gs`
   * `SOS.gs`
   * `Index.html`
   * `Style.html`
   * `JS.html`
4. Paste the respective code from the `apps-script/` directory into each file and click **Save** (`Ctrl + S`).
5. Click **Deploy** $\rightarrow$ **New deployment**.
6. Select **Web app**:
   * **Execute as:** `Me`
   * **Who has access:** `Anyone`
7. Click **Deploy**, authorize permissions, and copy your live Web App URL.

---

## 📝 Demo Login Credentials

* **Employee ID / Mobile:** `EMP7399` / `9876543210`
* **PIN:** `1234`

---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
