# goldQOL

A Chrome extension that adds quality-of-life features to UCSB's [GOLD](https://my.sa.ucsb.edu/gold/) registration system, plus a small Express backend that pulls live enrollment numbers from the UCSB API.

## Features

All features run on GOLD's **Weekly Student Schedule** page (`WeeklyStudentSchedule.aspx`):

- **Registration cart next to your schedule.** Classes from your registration cart (`WeeklyCartSchedule.aspx`) appear beside your weekly calendar, so you don't have to switch between pages.
- **Schedule preview.** Click a lecture or section in the cart to add it to the calendar, and click it again to remove it. Clicking a section also adds its lecture if that lecture isn't already shown.
- **Conflict detection.** The extension tracks time overlaps between the classes on your calendar, including the ones you've added from the cart.
- **Live seat availability.** Each lecture and section shows how many seats are taken (`enrolled/max`). Full sections get their own styling.

## Project structure

```
goldQOL/
├── backend/
│   └── index.js            # Express server that proxies the UCSB Curriculums API
├── extension/
│   ├── manifest.json       # Chrome extension manifest (MV3)
│   ├── content_scripts.js  # Runs on the GOLD schedule page
│   ├── custom.css          # Styles injected into GOLD
│   ├── popup.html / .css   # Extension toolbar popup
│   └── assets/ext-icon.png
└── package.json
```

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (the backend uses the built-in `fetch`)
- Google Chrome or another Chromium-based browser
- A UCSB API key from the [UCSB Developer Portal](https://developer.ucsb.edu/) with access to the **Academics – Curriculums** API

### 1. Run the backend

The seat-availability feature needs this server running locally.

```bash
npm install
```

Create `backend/.env`:

```
GOLD_API=your_ucsb_api_key_here
```

Start the server:

```bash
node backend/index.js
```

It listens on `http://localhost:8080`.

### 2. Load the extension

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the `extension/` folder.
4. Sign in to GOLD and open **Weekly Student Schedule**.

## Backend API

### `POST /space/:enrollCode`

Looks up a class by its enrollment code and returns enrollment data for each of its sections.

```json
{
  "codes":    ["12345", "12352", "12360"],
  "enrolled": [150, 25, 25],
  "space":    [160, 25, 25]
}
```

The three arrays line up index by index: `codes[i]` has `enrolled[i]` students out of `space[i]` seats.

## Configuration

- **Quarter.** The quarter is hard-coded in `backend/index.js` (`const quarter = "20264"`). The format is `YYYYQ`, where `Q` is `1` for Winter, `2` for Spring, `3` for Summer and `4` for Fall. Change it each quarter.
- **Port.** The backend runs on port `8080`. If you change it, also change the URL in `fetchData()` in `extension/content_scripts.js`.

## Known limitations

- Seat counts only load while the backend is running locally.
- The extension depends on GOLD's page markup, so changes to GOLD can break it.
- Classes you add from the cart only appear in the preview. Nothing is registered in GOLD.
