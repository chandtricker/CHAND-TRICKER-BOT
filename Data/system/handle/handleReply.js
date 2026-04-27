const logs = require('../../utility/logs');
const Send = require('../../utility/send');

async function handleReply({ api, event, client, Users, Threads, config }) {
  const { threadID, senderID, messageID, messageReply } = event || {};
  
  if (!messageReply || !client.replies) {
    return;
  }
  
  const replyData = client.replies.get(messageReply.messageID);
  
  if (!replyData) {
    return;
  }
  
  const { commandName, author, data, callback } = replyData;
  
  if (replyData.author && senderID !== replyData.author) {
    return api.sendMessage('This reply is not for you.', threadID, messageID);
  }
  
  const command = client.commands.get(commandName);
  
  if (!command || !command.handleReply) return;
  
  const send = new Send(api, event);
  
  try {
    await command.handleReply({
      api,
      event,
      send,
      Users,
      Threads,
      config,
      client,
      data,
      callback
    });
  } catch (error) {
    logs.error('REPLY', `Error in ${commandName}:`, error.message);
  }
}

module.exports = handleReply;
