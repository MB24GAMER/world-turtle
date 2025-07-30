# World Turtle Game

A fun tapping game with referral system and admin panel.

## Features

- 🐢 Tap the turtle to earn fragments
- 🏆 Leaderboard system
- 🤝 Referral system via Telegram
- 📊 Admin panel for task management
- 🔐 Secure credential management

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account",...}
```

### 3. Telegram Bot Setup

1. **Create a Telegram Bot:**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot` and follow the instructions
   - Copy the bot token

2. **Update Bot Token:**
   - Open `bot.js`
   - Replace `YOUR_BOT_TOKEN_HERE` with your actual bot token

### 4. Start the Application
```bash
npm start
```

This will start both:
- Web server on `http://localhost:3000`
- Telegram bot for referrals

## How the Referral System Works

1. **User gets referral link:** `https://t.me/YourBot?start=ref_USERID`
2. **Friend clicks link:** Telegram opens bot with referral parameter
3. **Bot registers friend:** Creates account and records referral
4. **Both users get rewards:** 500 fragments each

## Admin Panel

Access at: `http://localhost:3000/admin/index.html`
- Password: `admin123`
- Manage tasks and users

## API Endpoints

- `POST /api/register` - Register new user
- `POST /api/refer` - Record referral
- `GET /api/user/:userId` - Get user info
- `POST /api/tasks` - Add task
- `GET /api/tasks` - Get all tasks
- `DELETE /api/tasks/:taskId` - Delete task

## Security Notes

- Change the admin panel password in production
- Use proper authentication for admin panel
- Keep your bot token and credentials secure 