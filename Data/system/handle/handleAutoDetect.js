const logs = require('../../utility/logs');

async function handleAutoDetect({ api, event, client, Users, Threads, config }) {
    if (!event) return;
    const { body, senderID } = event;
    const botID = api.getCurrentUserID();
    
    if (!body) return;
    if (senderID === botID) return;
    
    const currentConfig = global.config || config;
    const prefix = currentConfig.PREFIX || '.';
    
    if (!body.toLowerCase().startsWith(prefix.toLowerCase())) return;
    
    // Handle events from events folder only (rankup, autoYoutube, etc.)
    for (const [name, eventHandler] of client.events) {
        try {
            if (eventHandler.config.eventType !== 'message') continue;
            
            await eventHandler.run({
                api,
                event,
                Users,
                Threads,
                config,
                client
            });
        } catch (error) {
            logs.error('AUTO_DETECT', `Error in ${name}:`, error.message);
        }
    }
}

module.exports = handleAutoDetect;