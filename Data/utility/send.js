class Send {
  constructor(api, event) {
    this.api = api;
    this.event = event;
    this.threadID = event.threadID;
    this.messageID = event.messageID;
  }

  async reply(message, callback) {
    return new Promise((resolve, reject) => {
      this.api.sendMessage(message, this.threadID, (err, info) => {
        if (err) reject(err);
        else {
          if (callback) callback(info);
          resolve(info);
        }
      }, this.messageID);
    });
  }

  async send(message, threadID = this.threadID, callback) {
    return new Promise((resolve, reject) => {
      this.api.sendMessage(message, threadID, (err, info) => {
        if (err) reject(err);
        else {
          if (callback) callback(info);
          resolve(info);
        }
      });
    });
  }

  async reaction(emoji, messageID = this.messageID) {
    return new Promise((resolve, reject) => {
      this.api.setMessageReaction(emoji, messageID, (err) => {
        if (err) reject(err);
        else resolve(true);
      }, true);
    });
  }

  async unsend(messageID, threadID = this.threadID) {
    return new Promise((resolve, reject) => {
      this.api.unsendMessage(messageID, threadID, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  async replyAndAutoUnsend(message, delay = 15000) {
    const info = await this.reply(message);
    setTimeout(() => {
      this.unsend(info.messageID, info.threadID || this.threadID).catch(() => {});
    }, delay);
    return info;
  }

  async shareContact(message, userID, callback) {
    return new Promise((resolve, reject) => {
      this.api.shareContact(message, userID, this.threadID, (err, info) => {
        if (err) reject(err);
        else {
          if (callback) callback(info);
          resolve(info);
        }
      }, this.messageID);
    });
  }
}

module.exports = Send;
