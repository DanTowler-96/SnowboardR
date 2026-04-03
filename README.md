# SnowboardR - The Snowboard Finder App

A personalised snowboard recommendation app that matches riders to their ideal board based on physical stats, ability level, riding style, and terrain preferences.

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
- **Scored recommendations** — every board receives a percentage match score calculated across 6 weighted criteria
- **Card-based results** — top picks and "also consider" boards displayed as visual cards with match %, specs, price, and recommended size
- **Detailed board modal** — click any card to see a full product description, a personalised explanation of why that board suits you, and an affiliate buy link
- **Clean quiz reset** — "New search" clears all inputs and returns to the quiz

---

## Tech Stack

- **HTML5**
- **CSS3** - custom dark theme, card layout, modal and animation
- **Vanilla JS** - ES modules, no build step or dependencies
- **boards.json** - flat file board database with specs, descriptions and affiliate links

---

## Why This Project Works for a Frontend Portfolio

This project demonstrates:

- A custom scoring algorithm with weighted criteria and normalised output
- Modular JS with clear separation between data, logic and UI layers
- Dynamic filtering and re-rendering without a framework
- Responsive dark-themed UI built entirely with vanilla CSS
- Local data management using a structured JSON board database
- Accessible form design with custom validation and keyboard support

---

## Key Implementation Notes

The app is split across 3 js files with clear responsibilities. `boardFinder.js` acts as the data layer, `scoringEngine.js` owns all matching logic and `main.js` handles everything the user sees and interacts with.

```
├── index.html          # App shell, quiz form, results panel, modal
├── styles.css          # Full styling — dark theme, card layout, modal, animations
├── main.js             # UI logic — form handling, card/modal rendering, panel switching
├── boardFinder.js      # Data layer — loads boards.json, runs scoring, exposes findBoards()
├── scoringEngine.js    # Scoring logic — all six scoring functions + scoreAllBoards()
└── boards.json         # Board database — 24 boards with specs, descriptions, images, affiliate links
```

---

## How the Scoring Works

Each board is scored out of a maximum of **120 points** across six criteria, then normalised to a 0–100% match score.

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

The recommended size shown on each card is calculated separately using the same height/weight logic — it picks the single best size from the board's available sizes.

---

## Board Database

`boards.json` contains 24 boards from 10 brands:

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

To add a new board, append an entry to `boards.json` following the schema above. Key things to get right:

- **`tags`** — these drive the style fit score. Use values from the lists below that match the board's character:
  - Flex: `soft-flex`, `med-flex`, `stiff-flex`
  - Profile: `camber`, `rocker`
  - Shape: `twin`, `directional-twin`, `directional`
  - Other: `freestyle`, `strong-edge`, `setback`, `wide-nose`, `powder-shape`
- **`ability_level`** — one of: `beg`, `beg-int`, `int`, `int-adv`, `adv`
- **`riding_style`** — one of: `all-mountain`, `freeride`, `park`, `piste`, `powder`, `touring`
- **`width`** — one of: `narrow`, `regular`, `mid-wide`, `wide`
- **`image_url`** — right-click the product image on the brand's website and copy the image address
- **`affiliate_url`** — your tracked affiliate link for the board

To update an existing board (e.g. new season colourway or price), find it by `id` in `boards.json` and edit the relevant fields.

---

## Running Locally

The app is plain HTML/CSS/JS with no build step or dependencies. Because it fetches `boards.json` via `fetch()`, it needs to be served over HTTP rather than opened as a file directly.

The easiest way is with VS Code's **Live Server** extension:

1. Open the project folder in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. The app opens at `http://127.0.0.1:5500`

Alternatively, any static file server works:

```bash
# Python
python3 -m http.server 5500

# Node (npx)
npx serve .
```

---

## Affiliate Links

Each board has an `affiliate_url` field in `boards.json`. The link is only shown when a user opens the board's detail modal — it does not appear on the card itself. To update a link, find the board by `id` and replace the `affiliate_url` value.

---

## Potential Future Improvements

- Share results via URL (encode inputs as query params so results can be bookmarked or sent to someone)
- Add a "women's boards" toggle to surface women's-specific models
- Add more boards — particularly more beginner options and women's models

---

## Author Notes

This is a strong frontend portfolio piece because it goes beyond a normal CRUD app and demonstrates real product thinking. In interviews, highlight the custom scoring engine, the modular JS architecture, the filtering logic and the JSON data design.