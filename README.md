# SnowboardR — The Snowboard Finder App

A personalised snowboard recommendation app that matches riders to their ideal board based on physical stats, ability level, riding style, and terrain preferences.

**Live:** [snowboardr.onrender.com](https://snowboardr.onrender.com)

---

## Screenshots

### Desktop

![DESKTOP SCREENSHOT 1](/SCREENSHOTS/DESKTOP/DESKTOP_1.png)
![DESKTOP SCREENSHOT 2](/SCREENSHOTS/DESKTOP/DESKTOP_2.png)
![DESKTOP SCREENSHOT 3](/SCREENSHOTS/DESKTOP/DESKTOP_3.png)
![DESKTOP SCREENSHOT 4](/SCREENSHOTS/DESKTOP/DESKTOP_4.png)
![DESKTOP SCREENSHOT 5](/SCREENSHOTS/DESKTOP/DESKTOP_5.png)
![DESKTOP SCREENSHOT 6](/SCREENSHOTS/DESKTOP/DESKTOP_6.png)

### Mobile

![MOBILE SCREENSHOT 1](/SCREENSHOTS/MOBILE/MOBILE_1.png)
![MOBILE SCREENSHOT 2](/SCREENSHOTS/MOBILE/MOBILE_2.png)
![MOBILE SCREENSHOT 3](/SCREENSHOTS/MOBILE/MOBILE_3.png)
![MOBILE SCREENSHOT 4](/SCREENSHOTS/MOBILE/MOBILE_4.png)
![MOBILE SCREENSHOT 5](/SCREENSHOTS/MOBILE/MOBILE_5.png)

---

## Features

- **Smart matching quiz** — collects height, weight, boot size, ability level, preferred feel, riding style, and terrain focus (up to 3 terrains)
- **Scored recommendations** — every board receives a percentage match score calculated across 6 weighted criteria, computed server-side
- **Card-based results** — top picks and "also consider" boards displayed as visual cards with match %, specs, price, and recommended size
- **Detailed board modal** — click any card to see a full product description, a personalised explanation of why that board suits you, and an affiliate buy link
- **User accounts** — register and log in to save quiz results across sessions
- **Saved searches** — revisit past searches with full input and result history
- **Protected admin API** — add, update, and delete boards via authenticated REST endpoints
- **Clean quiz reset** — "New search" clears all inputs and returns to the quiz

---

## Tech Stack

### Frontend
- **HTML5**
- **CSS3** — custom dark theme, card layout, modal and animations
- **Vanilla JS** — ES modules, no framework or build step

### Backend
- **Node.js** with **Express** — REST API server
- **SQLite** via `better-sqlite3` — relational database for boards, users, and saved results
- **bcrypt** — password hashing
- **JWT** — stateless user authentication
- **dotenv** — environment variable management

### Deployment
- **Render** — cloud hosting with auto-deploy on push to GitHub

---

## Project Structure

```
SnowboardR/
├── CLIENT/
│   ├── ASSETS/
│   │   └── snowboardr-logo.svg
│   ├── index.html          # App shell — quiz, results, modals
│   ├── styles.css          # Full styling — dark theme, card layout, animations
│   ├── main.js             # UI logic — rendering, auth, saved results
│   └── boardFinder.js      # API client — posts quiz inputs, returns scored results
├── SERVER/
│   ├── ROUTES/
│   │   ├── boards.js       # GET /api/boards, POST /api/boards/find
│   │   ├── admin.js        # POST/PUT/DELETE /api/admin/boards (protected)
│   │   ├── auth.js         # POST /api/auth/register, POST /api/auth/login
│   │   └── results.js      # GET/POST /api/results (protected)
│   ├── DATA/
│   │   └── boards.json     # Source board data — seeded into SQLite on first run
│   ├── scoringEngine.js    # All scoring logic — runs server-side only
│   ├── index.js            # Express entry point — auto-seeds database on startup
│   ├── seed.js             # One-time database seed script
│   └── migrate.js          # Creates users and saved_results tables
├── .gitignore
├── package.json
└── README.md
```

---

## API Reference

### Boards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | Returns all boards from the database |
| POST | `/api/boards/find` | Scores and ranks boards against user inputs |

### Admin (requires `x-api-key` header)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/boards` | Add a new board |
| PUT | `/api/admin/boards/:id` | Update an existing board |
| DELETE | `/api/admin/boards/:id` | Delete a board |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create an account, returns JWT |
| POST | `/api/auth/login` | Log in, returns JWT |

### Results (requires `Authorization: Bearer <token>` header)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/results` | Save quiz results for the logged in user |
| GET | `/api/results` | Retrieve all saved results for the logged in user |

---

## How the Scoring Works

Each board is scored out of a maximum of **120 points** across six criteria, then normalised to a 0–100% match score. Scoring runs entirely on the server — the algorithm is never exposed to the client.

| Criterion | Max Points | How it's calculated |
|---|---|---|
| Ability level | 25 | Matrix match between user ability and board's target ability level |
| Riding style | 25 | Cross-score matrix — e.g. a freeride user scores a powder board higher than a park board |
| Weight | 25 | Full points if within the board's weight range; degrades with distance outside |
| Style fit | 25 | Union of terrain and feel attribute tags matched against the board's tag list |
| Boot width | 15 | Boot size mapped to board width category (narrow / regular / mid-wide / wide) |
| Height | 10 | Preferred size range derived from height and weight; checked against available sizes |

Boards where the user's weight is more than 15kg outside the board's range are filtered out entirely as ineligible.

Results are split into two sections:
- **Top picks** — boards scoring 75% or above (up to 3)
- **Also consider** — the next 5 results below that threshold

---

## Board Database

The database contains 24 boards from 10 brands, seeded automatically from `boards.json` on first run:

**Burton** — Custom, Process, Deep Thinker, Family Tree Straight Chuter  
**Jones** — Mountain Twin, Hovercraft, Ultra Mountain Twin  
**Lib Tech** — Travis Rice Pro, Skate Banana, Cold Brew  
**Capita** — Defenders of Awesome, DOA Ultrafear, Super DOA  
**GNU** — Carbon Credit, Money  
**Never Summer** — Proto Type Two, Swift  
**Rome** — Artifact  
**Salomon** — Huck Knife, Assassin  
**YES.** — Basic  
**K2** — Raygun, Manifest  
**Arbor** — Foundation  

Each board entry includes:

```json
{
  "id": "burton-custom-2024",
  "brand": "Burton",
  "model": "Custom",
  "category": "all-mountain",
  "ability_level": "int-adv",
  "riding_style": "all-mountain",
  "flex": 6,
  "shape": "directional-twin",
  "profile": "camber",
  "min_weight": 65,
  "max_weight": 95,
  "sizes": [150, 152, 154, 156, 158, 160, 162],
  "width": "regular",
  "preferred_feel": ["balanced", "aggressive"],
  "edge_hold": "strong",
  "powder_friendly": false,
  "tags": ["camber", "med-flex", "directional-twin", "strong-edge"],
  "description": "Short card description",
  "full_description": "Longer product write-up shown in the modal",
  "why_recommended": "Personalised explanation shown in the modal",
  "price": 549,
  "image_url": "https://...",
  "affiliate_url": "https://..."
}
```

---

## Adding or Updating Boards

To add a new board, append an entry to `SERVER/DATA/boards.json` following the schema above, then re-run the seed script:

```bash
node SERVER/seed.js
```

Or use the admin API with a tool like Thunder Client:

```
POST /api/admin/boards
x-api-key: your-admin-key
```

Key things to get right when adding boards:

- **`tags`** — these drive the style fit score:
  - Flex: `soft-flex`, `med-flex`, `stiff-flex`
  - Profile: `camber`, `rocker`
  - Shape: `twin`, `directional-twin`, `directional`
  - Other: `freestyle`, `strong-edge`, `setback`, `wide-nose`, `powder-shape`
- **`ability_level`** — one of: `beg`, `beg-int`, `int`, `int-adv`, `adv`
- **`riding_style`** — one of: `all-mountain`, `freeride`, `park`, `piste`, `powder`, `touring`
- **`width`** — one of: `narrow`, `regular`, `mid-wide`, `wide`

---

## Running Locally

```bash
# Clone the repo
git clone https://github.com/DanTowler-96/SnowboardR.git
cd SnowboardR

# Install dependencies
npm install

# Create a .env file at the root
echo "ADMIN_API_KEY=your-admin-key" >> .env
echo "JWT_SECRET=your-jwt-secret" >> .env

# Seed the database
node SERVER/seed.js
node SERVER/migrate.js

# Start the server
node SERVER/index.js
```

The app will be running at `http://localhost:3000`.

---

## Potential Future Improvements

- Share results via URL — encode inputs as query params so results can be bookmarked or shared
- Delete saved searches from the saved results panel
- Add a women's boards toggle to surface women's-specific models
- Expand the board database — more beginner options and women's models
- Migrate to PostgreSQL for production-grade database hosting

---

## Author Notes

This project started as a pure frontend portfolio piece and was converted to a full stack application to demonstrate backend skills alongside the existing frontend work. In interviews, key talking points are the server-side scoring engine, the REST API design, JWT authentication flow, relational database schema, and end-to-end deployment.