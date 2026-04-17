# 🤖 CHAND TRICKER BOT

> A powerful and feature-rich Facebook Messenger Bot with advanced automation capabilities

[![GitHub](https://img.shields.io/badge/GitHub-chandtricker-blue?style=flat-square&logo=github)](https://github.com/chandtricker/CHAND-TRICKER-BOT)
[![Node.js](https://img.shields.io/badge/Node.js-v14+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](#license)
[![Forks](https://img.shields.io/github/forks/chandtricker/CHAND-TRICKER-BOT?style=flat-square&color=orange)](https://github.com/chandtricker/CHAND-TRICKER-BOT/fork)
[![Stars](https://img.shields.io/github/stars/chandtricker/CHAND-TRICKER-BOT?style=flat-square&color=yellow)](https://github.com/chandtricker/CHAND-TRICKER-BOT/stargazers)

---

## 🍴 Fork This Project

> **Apna khud ka bot banana chahte hain? Abhi fork karein!**

<div align="center">

### 👇 Ek Click Mein Fork Karein 👇

[![Fork This Repository](https://img.shields.io/badge/🍴%20FORK%20THIS%20REPO-Click%20Here-brightgreen?style=for-the-badge&logo=github)](https://github.com/chandtricker/CHAND-TRICKER-BOT/fork)

</div>

### Fork Karne Ke Fayde:
- ✅ Apna personal copy milega
- ✅ Freely customize kar sakte hain
- ✅ Original project ko contribute kar sakte hain
- ✅ Apne naam se deploy kar sakte hain

### Fork Karne Ka Tarika:

```
1️⃣  Upar diye gaye "FORK THIS REPO" button par click karein
2️⃣  Apna GitHub account select karein
3️⃣  "Create Fork" par click karein
4️⃣  Fork ho jayega — ab clone karein aur shuru ho jayein!
```

```bash
# Fork ke baad apne system par clone karein:
git clone https://github.com/YOUR_USERNAME/CHAND-TRICKER-BOT.git
cd CHAND-TRICKER-BOT
npm install
npm start
```

> 💡 **Tip:** Agar project pasand aaye toh ⭐ Star bhi zaroor dein!

---

## 📋 Table of Contents

- [Fork This Project](#-fork-this-project)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Commands](#commands)
- [Database](#database)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

🎯 **Core Features:**
- ✅ Automated message handling and responses
- ✅ Advanced command system with auto-detect
- ✅ Multi-thread conversation management
- ✅ User tracking and authentication
- ✅ Currency conversion system
- ✅ Reaction handling and notifications
- ✅ Database persistence with SQLite
- ✅ Real-time event listening
- ✅ Message logging and analytics
- ✅ Cookie-based session management

🔧 **Advanced Capabilities:**
- Custom user approvals
- Automated notifications
- Thread-based conversations
- Event-driven architecture
- RESTful API endpoints
- Web-based terminal interface

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

```
✓ Node.js v14 or higher
✓ npm v6 or higher
✓ Git
✓ A valid Facebook account
```

**Check your versions:**
```bash
node --version
npm --version
git --version
```

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/chandtricker/CHAND-TRICKER-BOT.git
cd CHAND-TRICKER-BOT
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- `facebook-chat-api` - Facebook Messenger API
- `sqlite3` - Database management
- `express` - Web server framework
- `dotenv` - Environment configuration

### Step 3: Configure Environment

Create a `.env` file in the root directory:

```env
EMAIL=your_facebook_email@example.com
PASSWORD=your_facebook_password
DATABASE_PATH=./Data/system/database
LOG_PATH=./Data/system/database/botdata/logs
```

### Step 4: Start the Bot

```bash
npm start
# or
node index.js
```

---

## ⚙️ Configuration

### Main Configuration Files

#### 1. **config.json**
General bot configuration
```json
{
  "prefix": "!",
  "version": "1.0.0",
  "autoReply": true,
  "debugMode": false
}
```

#### 2. **fca-config.json**
Facebook Chat API settings
```json
{
  "selfListen": false,
  "listenEvents": true,
  "pageID": "YOUR_PAGE_ID"
}
```

#### 3. **envconfig.json** (Data/config/)
Environment-specific settings
```json
{
  "apiVersion": "v1.0",
  "database": {
    "type": "sqlite3",
    "path": "./Data/system/database/botdata"
  }
}
```

---

## 📖 Usage

### Basic Usage

1. **Start the Bot:**
   ```bash
   npm start
   ```

2. **Send a Message:**
   Send any message to the bot account on Facebook Messenger

3. **Use Commands:**
   ```
   !help          - Show all commands
   !info          - Bot information
   !status        - Check bot status
   !convert       - Currency conversion
   ```

### Advanced Usage

**Auto-detect System:**
The bot automatically detects:
- Message types (text, image, video, etc.)
- User intent
- Command patterns
- Conversation context

**Event Handling:**
The bot handles:
- Message events
- Typing notifications
- User reactions
- Group changes
- Friend requests

---

## 📁 Project Structure

```
CHAND-TRICKER-BOT/
│
├── 📄 index.js                          # Main entry point
├── 📄 CHAND.js                          # Core bot logic
├── 📄 cookieManager.js                  # Session management
├── 📄 scroll-to-bottom.js               # UI utility
│
├── 📁 Data/
│   ├── appstate.json                    # Facebook session data
│   ├── config/
│   │   ├── envconfig.json               # Environment config
│   │   └── islamic_messages.json        # Custom messages
│   ├── data/
│   │   ├── gali.txt                     # Word list
│   │   └── personalnotes.json           # User notes
│   ├── system/
│   │   ├── listen.js                    # Event listener
│   │   ├── controllers/                 # Business logic
│   │   │   ├── users.js
│   │   │   ├── threads.js
│   │   │   └── currencies.js
│   │   ├── database/                    # Database layer
│   │   │   ├── index.js
│   │   │   ├── models/
│   │   │   └── botdata/
│   │   └── handle/                      # Event handlers
│   │       ├── handleCommand.js
│   │       ├── handleEvent.js
│   │       ├── handleReply.js
│   │       └── ...
│   └── utility/
│       ├── send.js                      # Message sending
│       ├── utils.js                     # Utilities
│       ├── logs.js                      # Logging
│       └── approved.js                  # Approvals
│
├── 📁 public/                           # Web interface
│   ├── index.html
│   ├── login.html
│   └── terminal.html
│
├── 📁 Fca_Database/                     # Database files
│   └── database.sqlite
│
├── 📄 package.json                      # Dependencies
├── 📄 config.json                       # Bot config
└── 📄 README.md                         # This file
```

---

## 🔧 Commands Reference

### User Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `!help` | Show help menu | `!help` |
| `!info` | Bot information | `!info` |
| `!status` | Bot status | `!status` |
| `!convert` | Currency conversion | `!convert 100 USD to PKR` |
| `!ping` | Check response time | `!ping` |

### Admin Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `!approve` | Approve user | `!approve @username` |
| `!reject` | Reject user | `!reject @username` |
| `!setprefix` | Change command prefix | `!setprefix $` |
| `!reload` | Reload bot config | `!reload` |

---

## 💾 Database

### Database Structure

**SQLite Database** located at: `Data/system/database/botdata/database.sqlite`

### Tables

1. **users** - User information and preferences
2. **threads** - Conversation threads
3. **currencies** - Currency conversion rates
4. **messages** - Message history

### Database Operations

View database logs:
```bash
cat Data/system/database/botdata/logs/16-04-2026.log
```

---

## 🐛 Troubleshooting

### Issue: Bot not responding
**Solution:**
```bash
1. Check internet connection
2. Verify credentials in .env
3. Restart the bot: npm start
4. Check logs: cat log.txt
```

### Issue: Facebook login fails
**Solution:**
```bash
1. Verify email and password
2. Check if 2FA is enabled
3. Update appstate.json or re-login
4. Check cookies.txt
```

### Issue: Database errors
**Solution:**
```bash
1. Delete database.sqlite
2. Run: npm start (will rebuild DB)
3. Check file permissions
4. Verify SQLite installation
```

### Issue: Commands not working
**Solution:**
```bash
1. Check command prefix in config.json
2. Verify bot has message permissions
3. Check command handler logs
4. Restart bot and try again
```

---

## 📝 Logs

Logs are stored in: `Data/system/database/botdata/logs/`

**Log Format:**
```
[DATE] [TIME] [LEVEL] [MESSAGE]
```

**Log Levels:**
- `INFO` - General information
- `ERROR` - Error messages
- `WARNING` - Warning messages
- `DEBUG` - Debug information

---

## 🌐 Web Interface

Access the bot's web interface:
- **Dashboard:** http://localhost:3000/
- **Login:** http://localhost:3000/login
- **Terminal:** http://localhost:3000/terminal

---

## 🔐 Security Notes

⚠️ **Important:**
- Never share your `appstate.json` file
- Keep credentials secure in `.env`
- Use environment variables for sensitive data
- Regularly update dependencies
- Monitor logs for suspicious activity

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork the repository**

   [![Fork This Repository](https://img.shields.io/badge/🍴%20Fork%20Now-Click%20Here-brightgreen?style=for-the-badge&logo=github)](https://github.com/chandtricker/CHAND-TRICKER-BOT/fork)

2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Open a Pull Request**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**ChandTricker**
- GitHub: [@chandtricker](https://github.com/chandtricker)
- Repository: [CHAND-TRICKER-BOT](https://github.com/chandtricker/CHAND-TRICKER-BOT)

---

## ⭐ Support

If you find this project helpful, please consider giving it a ⭐ on GitHub!

---

## 📞 Contact & Support

For issues and questions:
- Open an [Issue](https://github.com/chandtricker/CHAND-TRICKER-BOT/issues)
- Start a [Discussion](https://github.com/chandtricker/CHAND-TRICKER-BOT/discussions)

---

## 🎉 Changelog

### Version 1.0.0 (April 16, 2026)
- ✨ Initial release
- 🎯 Core bot functionality
- 📊 Database integration
- 🌐 Web interface
- 🔧 Advanced command system

---

## 🙏 Acknowledgments

- Facebook Chat API community
- Node.js ecosystem
- All contributors and supporters

---

<div align="center">

**Made with ❤️ by ChandTricker**

[![Fork This Repository](https://img.shields.io/badge/🍴%20FORK%20THIS%20REPO-Support%20the%20Project-brightgreen?style=for-the-badge&logo=github)](https://github.com/chandtricker/CHAND-TRICKER-BOT/fork)

[⬆ back to top](#-chand-tricker-bot)

</div>
