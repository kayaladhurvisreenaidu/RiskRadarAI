

# RiskRadar AI - Implementation Plan

## Overview
A premium, production-quality wellness-tech web application for athlete risk monitoring with Apple Health-inspired aesthetics, real sensor integration, and comprehensive data tracking.

---

## 🎨 Design System

### Color Palette
- **Background**: Soft lilac gradient (very light → muted purple)
- **Primary**: Midnight purple `#2B124C`
- **Secondary**: Soft cream, pastel lavender, sand tones
- **Accent**: Emerald (safe states), Ruby (danger states)

### Card Design
- Glassmorphism with semi-transparent white backgrounds
- Backdrop blur effects
- Rounded corners (14-18px)
- Soft shadow halos
- Generous padding for breathing room

### Typography
- Inter font family for clean, modern readability
- Bold headlines, refined body text

---

## 🧭 Navigation

### Right Floating Vertical Nav
A fixed vertical navigation bar on the right side of the screen:
- Midnight purple background with premium finish
- Five circular icon buttons with soft cream backgrounds
- Subtle glow on hover
- Floating pill tooltips (cream bg, purple text)

**Routes:**
1. 📊 Dashboard → `/dashboard`
2. 🎯 CNS Tap Index → `/cns-tap-index`
3. 📈 Stats → `/stats`
4. 📡 Live Sensor → `/live-sensor`
5. 👤 Account → `/account`

---

## 📊 Page 1: Dashboard (`/dashboard`)

### Layout
- Centered "RiskRadar AI" title (no tagline)
- Elegant grid with compact, well-spaced cards
- 1 wide rectangular card, 6 square cards, 1 small rectangular card

### Cards with Input/Result Modes

**1. Daily Load (Wide Card)**
- Input: Duration (**20-180 mins**), RPE (1-10)
- Calculation: Daily Load = Duration × RPE
- Animated toggle between input/result modes
- Pencil edit icon in result mode

**2. Resting HR (Square Card)**
- Input: Heart rate (35-90 bpm)

**3. HRV (Square Card)**
- Input: HRV value (20-130 ms)

**4. Sleep Quality (Square Card)**
- Inputs: Sleep hours (0-24) + Quality slider (0-1)
- Weighted sleep score calculation (0-100)

**5. ACWR (Square Card)**
- Input: Acute:Chronic ratio (0.3-3.0)

**6. Past Injury (Square Card)**
- Dropdown: Yes (1) / No (0)

**7. Days Since Injury (Square Card)**
- Number input (0-365)

**8. Overall Risk Factor (Prominent Display)**
- Combines all metrics into normalized score (0-100)
- Large, bold midnight purple display
- Interpretation: Low / Moderate / High

**9. Know Your Risk Factor (Small Card)**
- Manual input (0-100)
- Emoji indicator: 🟢 <35, 🟡 35-69, 🔴 70+
- Short analysis text

---

## ⚠️ Input Validation with Contextual Comments

Each field displays a **red border** and **specific error message** when out of range:

| Field | Valid Range | Out-of-Range Comment |
|-------|-------------|---------------------|
| **Duration** | 20-180 mins | "Training duration should be between 20-180 minutes for accurate load calculation" |
| **RPE** | 1-10 | "Rate of Perceived Exertion must be on a 1-10 scale" |
| **Resting HR** | 35-90 bpm | "Resting heart rate outside normal athletic range (35-90 bpm)" |
| **HRV** | 20-130 ms | "HRV reading appears abnormal. Typical range: 20-130 ms" |
| **Sleep Hours** | 0-24 hrs | "Please enter valid sleep hours (0-24)" |
| **Sleep Quality** | 0-1 | "Quality score must be between 0 (poor) and 1 (excellent)" |
| **ACWR** | 0.3-3.0 | "ACWR outside safe training zone. Optimal: 0.8-1.3" |
| **Days Since Injury** | 0-365 | "Please enter days since last injury (0-365)" |
| **Risk Factor** | 0-100 | "Risk factor must be a percentage (0-100)" |

### Validation Behavior
- Input border turns red immediately on invalid value
- Error message appears below input
- Submit button disabled until all values valid
- Result not computed until correction made

---

## 🎯 Page 2: CNS Tap Index (`/cns-tap-index`)

### Layout
- Soft lilac background
- Centered "CNS TAP INDEX" header
- Main glass card with tap interface

### Functionality
- "TAP →" label pointing to circular tap zone
- Precise 10-second timer using `performance.now()`
- Tap counting only while timer active
- Zone disabled after timer ends

### Scoring System
- Normalize to 1-10 scale (athlete baseline: 40-60 taps)
- Fatigue interpretation:
  - 1-3: High Fatigue ⚠️
  - 4-6: Moderate Fatigue ⚡
  - 7-10: Low Fatigue ✅

---

## 📈 Page 3: Stats (`/stats`)

### Layout
- Same lilac gradient background
- Glass cards arrangement

### Components
**Right Section: Sleep Hours Graph**
- Recharts line graph showing sleep trends over time

**Left Top: Sleep Quality Gauge**
- Circular mellow gauge design

**Left Bottom: Past Data Table**
- Columns: Timestamp | Metric | Value
- Scrollable history from localStorage

---

## 📡 Page 4: Live Sensor Monitor (`/live-sensor`)

### Design
- **Dark mode** professional engineering console
- Near-black background
- Two-column layout

### Left Column: Status Card
- **SAFE State**: Green shield icon, emerald styling
- **DANGER State**: Red alert icon, pulsing glow animation

### Right Column: Terminal Logs
- Black background, monospace font
- Fake header: `> /dev/ttyUSB0`
- Last 5 logs displayed with timestamps

### Web Serial Integration
- Full Web Serial API implementation
- Baud rate: 115200
- Proper cleanup and error handling

---

## 👤 Page 5: Account (`/account`)

### Profile Card (Glassmorphism)
- Editable fields: Name, Age, Athlete Type
- Save to localStorage

### Data Management
- **Export JSON**: Download full data in exact specified format
- **Clear All Data**: Reset localStorage with confirmation

### JSON Export Structure (Exact Order)
```json
{
  "athlete_id": 701,
  "system_date": "2026-01-31",
  "daily_load": 150,
  "resting_hr": 55,
  "hrv": 65,
  "sleep_quantity": 85,
  "past_injury": 0,
  "days_since_injury": 30
}
```

---

## 🎬 Animations (Framer Motion)

- Page transitions with fade/slide
- Card hover glows and subtle lifts
- Input/Result mode smooth transitions
- Tap zone pulse feedback
- DANGER state pulse animation
- Validation shake on error

---

## 💾 Data Persistence

- All form submissions → localStorage
- History with timestamps
- Profile data persistence
- Console logging on all submissions
- Downloadable JSON export from Account page

