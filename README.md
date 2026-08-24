# FeelFX

> **FeelFX analyzes the video → identifies meaningful moments → makes motion-design decisions → renders them over the original footage.**



https://github.com/user-attachments/assets/45f8ce4f-c106-4e13-942c-8dec0a9a9d2a



### 🚀 What you're seeing above

The video above is a live demonstration of FeelFX analyzing a **rocket launch video** and automatically deciding how to enhance it.

FeelFX doesn't simply generate subtitles. It **watches the video, understands what's happening, detects the emotional/visual feel, and generates motion graphics that match the moment.**

* 🚀 **Rocket launch** → intense acceleration, impact, energy and launch effects
* 🇮🇳 **India** → tricolor visual treatment
  
The important part is that **none of these effects are manually placed on the timeline**.

## 🚀 What FeelFX Does

Instead of asking:

> *"What subtitles should I put on this video?"*

FeelFX asks:

> **"What is happening, what does it feel like, and what motion graphics would make it hit harder?"**

For example:

| Video content            | FeelFX response                                              |
| ------------------------ | ------------------------------------------------------------ |
| 🚀 Rocket launch         | Explosive launch trails, impact pulses, energetic typography |
| 🏖️ Beach                | Water/splash effects, fluid motion, atmospheric graphics     |
| 🇮🇳 India / Indian flag | Tricolor typography and visual accents                       |
| 🛰️ Rocket name          | Cinematic keyword reveal                                     |
| ✈️ Travel                | Route lines, location pins, fluid transitions                |
| 🎵 Music                 | Beat-driven, energetic motion                                |
| 💼 Corporate             | Clean, restrained, professional graphics                     |
| 🎓 Educational           | Minimal explanatory graphics                                 |

The goal is **not automatic subtitling**.

The goal is **automatic visual storytelling**.

---

## 🧠 Local AI Video Understanding

FeelFX analyzes videos locally in the browser.

The pipeline currently combines:

```text
VIDEO
  ↓
Visual Analysis
  ↓
Speech Detection
  ↓
Local Whisper Transcription
  ↓
Semantic Understanding
  ↓
Feel Detection
  ↓
Key Moment Detection
  ↓
Motion Decision Engine
  ↓
Motion Graphics DSL
  ↓
Three.js + GSAP
  ↓
LIVE GRAPHICS OVER VIDEO
```

No video needs to be uploaded to a remote processing server.

---

## 🎭 Feel Detection

FeelFX currently recognizes several visual/content styles:

```text
corporate
educational
casual
travel
music
cinematic
energetic
```

The detected feel influences:

* typography
* pacing
* animation style
* intensity
* particle usage
* transitions
* visual effects
* keyword treatment

Example:

```json
{
  "feel": "travel",
  "confidence": 0.84,
  "style": {
    "typography": "editorial",
    "movement": "fluid",
    "pacing": "relaxed"
  }
}
```

---

## ✨ Context-Aware Motion Graphics

FeelFX doesn't simply animate every detected word.

It identifies **important semantic keywords and moments**.

For example, if the transcript contains:

```text
India successfully launched the GSLV rocket
from Sriharikota...
```

FeelFX can decide:

```text
INDIA
    ↓
🇮🇳 Tricolor treatment

GSLV
    ↓
🚀 Cinematic rocket treatment

LAUNCHED
    ↓
💥 Impact / acceleration treatment

SRIHARIKOTA
    ↓
📍 Location treatment
```

The result is closer to a **motion-designed edit** than traditional subtitles.

---

## 🎨 Motion Graphics Engine

FeelFX uses **Three.js** for real-time rendering and **GSAP** for animation orchestration.

The engine can generate elements such as:

```text
Text
Arrows
Circles
Highlights
Images
Particles
Route lines
Location markers
Camera movement
Impact effects
Energy effects
Environmental effects
```

These elements are synchronized to the video's timestamps.

---

## 🧩 Motion DSL

The AI ultimately produces structured motion instructions rather than directly manipulating the renderer.

Example:

```json
{
  "generatedBy": "FeelFX AI",
  "feel": "energetic",
  "events": [
    {
      "time": 4.2,
      "event": "rocket launch",
      "motion": {
        "type": "rocketLaunch",
        "animation": "explosive"
      }
    },
    {
      "time": 6.1,
      "event": "India",
      "motion": {
        "type": "keyword",
        "style": "tricolor"
      }
    }
  ]
}
```

This separation makes the system extensible:

```text
AI
 ↓
Motion DSL
 ↓
Renderer
```

The AI decides **what should happen**.

The renderer decides **how it happens**.

---

## 🏗️ Architecture

```text
┌───────────────────────────┐
│          VIDEO            │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│    AI VIDEO ANALYZER      │
│                           │
│  • Vision                 │
│  • Speech                 │
│  • Audio                  │
│  • Transcript             │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│      FEEL ENGINE          │
│                           │
│  Corporate                │
│  Educational              │
│  Travel                   │
│  Music                    │
│  Cinematic                │
│  Energetic                │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│     EVENT ENGINE          │
│                           │
│  Detect important moments │
│  Detect keywords          │
│  Generate timestamps      │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│       MOTION DSL          │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│   THREE.JS + GSAP ENGINE  │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│     CINEMATIC VIDEO       │
│      + MOTION GRAPHICS    │
└───────────────────────────┘
```

---

## 🛠️ Tech Stack

* **TypeScript**
* **Vite**
* **Three.js**
* **GSAP**
* **Transformers.js**
* **Whisper**
* **WebGL**
* **Local/browser AI**

---

## 💻 Run Locally

Clone the repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd Feel.FX
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local Vite URL in your browser.

Then:

```text
LOAD VIDEO
     ↓
FEEL THE VIDEO
     ↓
AI analyzes the video
     ↓
Motion decisions generated
     ↓
Play the video
     ↓
Watch FeelFX augment it in real time
```

---

## 🔒 Local-First

FeelFX is designed around **local video intelligence**.

The long-term goal is:

```text
Your video
    ↓
Your browser
    ↓
Local AI
    ↓
Local motion engine
    ↓
Finished visual experience
```

Rather than requiring every video to be uploaded to a cloud AI service.

---

## 🧪 Current Status

FeelFX is currently an experimental prototype.

### Working

* [x] Video loading
* [x] Local video playback
* [x] Local speech transcription
* [x] Visual analysis
* [x] Semantic video understanding
* [x] Feel detection
* [x] Timestamped events
* [x] Motion DSL
* [x] Three.js rendering
* [x] GSAP animation
* [x] Motion graphics synchronized with video
* [x] Context-aware keyword graphics
* [x] Feel-specific visual treatments

### In development

* [ ] More sophisticated scene understanding
* [ ] Better object/action recognition
* [ ] Beat-aware animation
* [ ] Camera-aware graphics placement
* [ ] Automatic composition
* [ ] More cinematic environmental effects
* [ ] Export rendered videos
* [ ] More powerful motion DSL
* [ ] Fully generative motion-design decisions

---

## 🎯 The Vision

Traditional video editors provide:

```text
Timeline
+ Assets
+ Effects
+ Keyframes
```

FeelFX is exploring a different interaction model:

```text
VIDEO
  +
MEANING
  +
FEEL
  ↓
MOTION
```

You don't tell the editor:

> "Add a circle at 00:04.2."

You give it the video.

FeelFX should understand:

> **"This is a rocket launch. This is the moment of ignition. This word matters. The energy is building."**

And then decide what the motion design should be.

---

## ⚡ Feel the Video

**FeelFX**

*Don't subtitle the video.*

**Feel it.**


