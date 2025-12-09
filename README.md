# 🦩 Flamingo Cards

> A premium, real-time multiplayer card game for deep conversations and fun parties.

![Flamingo Cards Banner](src/assets/docs/flamingo_banner.png)

**Flamingo Cards** is a modern web application designed to bring people together through meaningful questions and fun challenges. Whether you're at a party, on a date, or hanging out with friends, Flamingo Cards provides the perfect icebreakers and conversation starters.

## Features

- **Real-time Multiplayer**: Connect with friends instantly using a unique game code. No login required!
- **Live Synchronization**: Game state, card flips, and player actions are synced in real-time across all devices using [PartyKit](https://partykit.io/).
- **Diverse Card Packs**: Choose from a wide variety of packs including:
  - 🌊 **Deep Questions**: For meaningful conversations.
  - 💕 **Couple's Convos**: To strengthen relationships.
  - 🔥 **Dare to Share**: Spicy challenges for the brave.
  - 🌶️ **Unpopular Opinions**: Spark debates with hot takes.
  - ...and many more!
- **Host Controls**: The host can manage the game, change packs, and kick players.
- **Responsive Design**: Works beautifully on mobile, tablet, and desktop.
- **Premium Aesthetics**: A sleek, dark-mode interface with smooth animations and glassmorphism effects.

## 📸 Screenshots

|                       Lobby                       |                        Gameplay                         |
| :-----------------------------------------------: | :-----------------------------------------------------: |
| ![Lobby Screen](src/assets/docs/lobby_mockup.png) | ![Gameplay Screen](src/assets/docs/gameplay_mockup.png) |
|        _Join games and choose your avatar_        |           _Swipe through cards in real-time_            |

## 🚀 Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/flamingo-cards.git
    cd flamingo-cards
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

### Running Locally

To run the full application (Client + Server), you need to run both the Vite development server and the PartyKit server.

1.  **Start the development server**

    ```bash
    npm run dev
    ```

    This will start the frontend at `http://localhost:5173`.

2.  **Start the PartyKit server**
    ```bash
    npm run party
    ```
    This will start the backend server at `http://127.0.0.1:1999`.

> **Note:** Both commands must be running for the multiplayer features to work.

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/), [Vite](https://vitejs.dev/), CSS Modules
- **Backend / Real-time**: [PartyKit](https://partykit.io/) (WebSockets, Durable Objects)
- **Routing**: [React Router](https://reactrouter.com/)
- **State Management**: React Hooks + WebSocket Sync
- **Icons**: Emoji & SVG

## 📂 Project Structure

```
flamingo/
├── server/
│   └── game-room.ts       # PartyKit server logic (Game State, WebSocket handlers)
├── src/
│   ├── components/        # Reusable UI components (Card, CardPack, etc.)
│   ├── data/              # Static data (Question Packs)
│   ├── hooks/             # Custom hooks (useGameSync for WebSocket logic)
│   ├── pages/             # Application pages (Home, Lobby, Play)
│   ├── App.jsx            # Main app component and routing
│   └── main.jsx           # Entry point
├── partykit.json          # PartyKit configuration
└── package.json           # Project dependencies and scripts
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
