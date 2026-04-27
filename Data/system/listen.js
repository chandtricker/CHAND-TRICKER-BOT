const handleCommand = require('./handle/handleCommand');
const handleEvent = require('./handle/handleEvent');
const handleReaction = require('./handle/handleReaction');
const handleReply = require('./handle/handleReply');
const handleNotification = require('./handle/handleNotification');
const handleCreateDatabase = require('./handle/handleCreateDatabase');
const handleAutoDetect = require('./handle/handleAutoDetect');
const logs = require('../utility/logs');
const path = require('path');

let resendModule = null;
try {
  resendModule = require(path.join(__dirname, '../../node_modules/lodash-pari/commands/resend.js'));
} catch (e) {}

function listen({ api, client, Users, Threads, Currencies, config }) {
  // Store reference globally for stopping
  const currentListenerId = global.listenerId;
  global.listenInstance = { api, client, Users, Threads, Currencies, config };
  
  return async (err, event) => {
    // Reject events from old listener
    if (global.listenerId !== currentListenerId) {
      return;
    }
    
    if (err) {
      const errMsg = err.message || err.error || JSON.stringify(err);
      if (errMsg.includes('login_blocked') || errMsg.includes('auth_error') || errMsg.includes('not logged in') || errMsg.includes('MQTT')) {
        console.log('[❌] Account LOGOUT/BLOCKED - Bot stopped working');
        logs.error('LISTEN', 'Account issue - ' + errMsg);
        
        // Real-time notification via socket.io
        try {
          if (global.io) {
            global.io.emit('accountIssue', { type: 'LOGOUT', message: errMsg, time: new Date().toISOString() });
          }
        } catch(e) {}
        
        // Notify admin about account issue
        try {
          const fs = require('fs');
          const adminUids = config.ADMINBOT || [];
          for (const adminUid of adminUids) {
            try {
              api.sendMessage('⚠️ *ACCOUNT LOGOUT NOTICE*\n\nYour Facebook account has been logged out or blocked!\n\n❌ Error: ' + errMsg + '\n\n🔄 Please login again from admin panel.', adminUid);
            } catch(e) {}
          }
        } catch(e) {}
        
        // Save account issue status for dashboard
        try {
          const fs = require('fs');
          fs.writeFileSync('./Data/system/account_issue.txt', 'LOGOUT|' + errMsg);
        } catch(e) {}
      }
      return;
    }
    
    if (!event) return;
    
    try {
      await handleCreateDatabase({ api, event, Users, Threads });
      
      switch (event.type) {
        case 'message':
        case 'message_reply':
          if (resendModule && resendModule.logMessage && event.senderID) {
            try {
              const botID = api.getCurrentUserID();
              if (event.senderID !== botID) {
                await resendModule.logMessage(
                  event.messageID,
                  event.body,
                  event.attachments,
                  event.senderID,
                  event.threadID
                );
              }
            } catch (e) {}
          }
          
          await handleCommand({
            api, event, client, Users, Threads, Currencies, config
          });

          await handleAutoDetect({
            api, event, client, Users, Threads, config
          });
          
          if (event.type === 'message_reply') {
            await handleReply({
              api, event, client, Users, Threads, config
            });
          }
          break;
          
        case 'message_unsend':
          if (resendModule && resendModule.handleUnsend) {
            try {
              await resendModule.handleUnsend(api, event, Users);
            } catch (e) {
              logs.error('RESEND', e.message);
            }
          }
          break;
          
        case 'event':
          await handleEvent({
            api, event, client, Users, Threads, config
          });
          
          await handleNotification({ api, event, config, Threads });
          break;
          
        case 'message_reaction':
          await handleReaction({ api, event, config });
          break;
          
        case 'typ':
        case 'read':
        case 'read_receipt':
        case 'presence':
          break;
          
        default:
          break;
      }
    } catch (error) {
      logs.error('LISTEN', error.message);
    }
  };
}

function stopAllListen() {
  global.listenInstance = null;
}

module.exports = listen;
module.exports.stopAllListen = stopAllListen;
