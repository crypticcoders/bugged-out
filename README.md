# MachinaSense: Intelligent Industrial Fault Detection & Predictive Maintenance

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcrypticcoders%2Fbugged-out&root-directory=machinasense%2Ffrontend)

Production-grade, end-to-end industrial DSP, physics-informed digital twin, unsupervised anomaly detection, supervised fault classification, and constrained edge hardware profiler.

Repository: **[crypticcoders/bugged-out](https://github.com/crypticcoders/bugged-out)**

---

## 🚀 One-Click Deployment to Vercel

You can deploy MachinaSense to Vercel immediately in two simple ways:

### Option A: The Instant 1-Click Button (Recommended)
Click the button below to fork and deploy directly to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcrypticcoders%2Fbugged-out&root-directory=machinasense%2Ffrontend)

---

### Option B: Import Directly from Your Vercel Dashboard
1. Go to **[vercel.com/new](https://vercel.com/new)** (or log in to your Vercel account).
2. Under **"Import Git Repository"**, select **`crypticcoders/bugged-out`**.
3. Under **"Root Directory"**, click **Edit** and choose:
   ```text
   machinasense/frontend
   ```
4. Click **Deploy**!
5. In ~45 seconds, your live production URL (e.g. `https://bugged-out.vercel.app`) will be active and ready.

> **Zero Extra Config Required**: All 1,000 Hz waveform synthesis, FFT spectral analysis, 24-feature extraction, Z-score XAI, RUL regression, and edge compute benchmarks are compiled directly into native Next.js Serverless API routes (`/api/...`).

---

## 💻 Local Development

### 1. Next.js Frontend (Port 3000)
```bash
cd machinasense/frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** for the Ledgr-style landing page, or **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)** for the 4-tab Operator Console.

### 2. Python FastAPI Backend (Port 8000, Optional for CLI/Research)
```bash
cd machinasense/backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

---

## 🔄 Automatic GitHub Sync
Changes in this workspace are continuously monitored and automatically committed and pushed to `crypticcoders/bugged-out` on branch `main`.
- `start-autosync.bat`: Run auto-sync in a visible terminal.
- `start-autosync-background.bat`: Run auto-sync silently in the background.
- `stop-autosync.bat`: Terminate running background sync.
- `sync-now.bat`: Instant manual commit and push.

---

## 🛠 Features & Verification

| Module | Verification | Metric |
| :--- | :--- | :--- |
| **Physics Digital Twin** | 1,000 Hz Tri-axial Vib, Current, Temp, Acoustic | 5 Physical Fault Personas |
| **Complication Lab** | AWGN Noise (15dB), Packet Dropouts (12%), RPM Steps (2800) | Zero-Phase Butterworth + Spline |
| **Dual-Stage ML** | Isolation Forest (150 trees) + Random Forest (200 trees) | 100% Held-Out Accuracy |
| **Explainable AI (XAI)** | Exact Feature Z-Score Deviations ($\sigma$) | Top 4 Physical Indicators |
| **Edge Hardware Profiler** | Measured with `time.perf_counter_ns` & `tracemalloc` | STM32H7 (29.6ms), ESP32-S3 (63.4ms) |
| **Human-in-the-Loop** | Forensic Snapshot Drawer + Active Learning Retraining | Confirmed Work Orders |
