const fs = require('fs-extra');
const path = require('path');

const APPROVED_FILE = path.join(__dirname, '../../../Data/config/approved_users.json');

module.exports = {
  getApprovedUsers: function() {
    try {
      if (fs.existsSync(APPROVED_FILE)) {
        return fs.readJsonSync(APPROVED_FILE);
      }
    } catch (e) {}
    return [];
  },

  isApproved: function(uid) {
    const approved = this.getApprovedUsers();
    return approved.includes(uid);
  },

  addApproved: function(uid) {
    const approved = this.getApprovedUsers();
    if (!approved.includes(uid)) {
      approved.push(uid);
      fs.writeJsonSync(APPROVED_FILE, approved, { spaces: 2 });
    }
  },

  removeApproved: function(uid) {
    const approved = this.getApprovedUsers();
    const index = approved.indexOf(uid);
    if (index > -1) {
      approved.splice(index, 1);
      fs.writeJsonSync(APPROVED_FILE, approved, { spaces: 2 });
    }
  },

  checkApproved: function(uid, api, threadID, messageID) {
    if (!this.isApproved(uid)) {
      api.sendMessage(
        "❮●❯━━━━❪💝❫━━━━❮●❯\n\n𝐎𝐧𝐥𝐲 𝐂𝐇𝐀𝐍𝐃 𝐓𝐑𝐈𝐂𝐊𝐄𝐑 𝐜𝐚𝐧 𝐮𝐬𝐞\nfb.com/CH4ND.TRICKER \n\n❮●❯━━━━❪💝❫━━━━❮●❯",
        threadID,
        messageID
      );
      return false;
    }
    return true;
  }
};