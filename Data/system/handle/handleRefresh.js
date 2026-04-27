const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');
const chalk = require('chalk');
const logs = require('../../utility/logs');

function clearRequireCache(filePath) {
  const resolvedPath = require.resolve(filePath);
  
  if (require.cache[resolvedPath]) {
    const mod = require.cache[resolvedPath];
    if (mod.children) {
      mod.children.forEach(child => {
        if (child.id.includes('lodash-pari/commands') || child.id.includes('lodash-pari/events')) {
          delete require.cache[child.id];
        }
      });
    }
    delete require.cache[resolvedPath];
  }
}

const REQUIRED_CONFIG_FIELDS = [
  'name',
  'aliases',
  'version',
  'permission',
  'prefix',
  'premium',
  'category',
  'description',
  'usage',
  'credits',
  'cooldowns'
];

function validateCommandConfig(config, fileName) {
  if (!config) {
    return { valid: false, missing: REQUIRED_CONFIG_FIELDS, fileName };
  }
  
  const missing = [];
  for (const field of REQUIRED_CONFIG_FIELDS) {
    if (config[field] === undefined || config[field] === null) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    return { valid: false, missing, fileName };
  }
  
  return { valid: true };
}

async function loadCommands(client, commandsPath) {
  client.commands.clear();
  let commandCount = 0;
  let loadErrors = [];
  
  try {
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      try {
        const filePath = path.join(commandsPath, file);
        clearRequireCache(filePath);
        const command = require(filePath);
        
        const cmdConfig = command.config || command;
        
        if (cmdConfig && cmdConfig.name) {
          console.log(`${moment().tz('Asia/Karachi').format('hh:mm:ss A || DD/MM/YYYY')} ` + chalk.green('[COMMAND]') + ' ' + file);
          
          const validation = validateCommandConfig(cmdConfig, file);
          
          if (!validation.valid) {
            console.log('');
            console.log(`[❌] COMMAND VALIDATION FAILED: ${file}`);
            console.log(`[⚠️] Missing required fields: ${validation.missing.join(', ')}`);
            console.log('');
            loadErrors.push({ file, missing: validation.missing });
            continue;
          }
          
          client.commands.set(cmdConfig.name.toLowerCase(), command);
          commandCount++;
          
          if (cmdConfig.aliases && Array.isArray(cmdConfig.aliases)) {
            cmdConfig.aliases.forEach(alias => {
              client.commands.set(alias.toLowerCase(), command);
            });
          }
          
          
        }
      } catch (error) {
        logs.error('COMMAND', `Failed to load ${file}: ${error.message}`);
      }
    }
    
    if (loadErrors.length > 0) {
      logs.warn('LOADER', `${loadErrors.length} commands failed to load`);
      loadErrors.forEach(err => {
        logs.error('LOADER', `${err.file} - missing: ${err.missing.join(', ')}`);
      });
    }
    
    logs.success('LOADER', `${commandCount} commands loaded successfully`);
    return { success: true, count: commandCount, errors: loadErrors };
  } catch (error) {
    logs.error('REFRESH', 'Failed to load commands:', error.message);
    return { success: false, error: error.message };
  }
}

async function loadEvents(client, eventsPath) {
  client.events.clear();
  let eventCount = 0;
  let loadErrors = [];
  
  try {
    const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      try {
        const filePath = path.join(eventsPath, file);
        clearRequireCache(filePath);
        const event = require(filePath);
        
        if (event.config && event.config.name) {
          client.events.set(event.config.name.toLowerCase(), event);
          console.log(`${moment().tz('Asia/Karachi').format('hh:mm:ss A || DD/MM/YYYY')} ` + chalk.magenta('[EVENT]') + ' Event loaded : ' + file);
          eventCount++;
        }
      } catch (error) {
        logs.error('EVENT', `Failed to load ${file}: ${error.message}`);
        loadErrors.push({ file, error: error.message });
      }
    }
    
    if (loadErrors.length > 0) {
      logs.warn('LOADER', `${loadErrors.length} events failed to load`);
    }
    
    logs.info('REFRESH', `Loaded ${eventCount} events`);
    return { success: true, count: eventCount, errors: loadErrors };
  } catch (error) {
    logs.error('REFRESH', 'Failed to load events:', error.message);
    return { success: false, error: error.message };
  }
}

async function reloadCommand(client, commandsPath, commandName) {
  try {
    const lowerName = commandName.toLowerCase();
    let filePath = path.join(commandsPath, `${lowerName}.js`);
    
    if (!fs.existsSync(filePath)) {
      const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
      let found = false;
      
      for (const file of files) {
        const tempPath = path.join(commandsPath, file);
        try {
          clearRequireCache(tempPath);
          const cmd = require(tempPath);
          const cmdConfig = cmd.config || cmd;
          
          if (cmdConfig.name) {
            const cmdName = cmdConfig.name?.toLowerCase();
            const aliases = cmdConfig.aliases?.map(a => a.toLowerCase()) || [];
            
            if (cmdName === lowerName || aliases.includes(lowerName)) {
              filePath = tempPath;
              found = true;
              break;
            }
          }
        } catch (e) {}
      }
      
      if (!found) {
        return { success: false, error: `Command "${commandName}" not found` };
      }
    }
    
    clearRequireCache(filePath);
    const command = require(filePath);
    
    const cmdConfig = command.config || command;
    const validation = validateCommandConfig(cmdConfig, commandName);
    if (!validation.valid) {
      console.log('');
      console.log(`[❌] COMMAND VALIDATION FAILED: ${commandName}.js`);
      console.log(`[⚠️] Missing required fields: ${validation.missing.join(', ')}`);
      console.log('');
      return { success: false, error: `Missing fields: ${validation.missing.join(', ')}`, missing: validation.missing };
    }
    
    if (cmdConfig && cmdConfig.name) {
      const oldAliases = [];
      client.commands.forEach((cmd, key) => {
        const c = cmd.config || cmd;
        if (c?.name?.toLowerCase() === cmdConfig.name.toLowerCase()) {
          oldAliases.push(key);
        }
      });
      oldAliases.forEach(alias => client.commands.delete(alias));
      
      client.commands.set(cmdConfig.name.toLowerCase(), command);
      
      if (cmdConfig.aliases && Array.isArray(cmdConfig.aliases)) {
        cmdConfig.aliases.forEach(alias => {
          client.commands.set(alias.toLowerCase(), command);
        });
      }
      
      logs.success('RELOAD', `Reloaded: ${cmdConfig.name}`);
      return { success: true, name: cmdConfig.name };
    }
    
    return { success: false, error: 'Invalid command structure' };
  } catch (error) {
    logs.error('RELOAD', `Failed to reload ${commandName}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function reloadEvent(client, eventsPath, eventName) {
  try {
    const lowerName = eventName.toLowerCase();
    let filePath = path.join(eventsPath, `${lowerName}.js`);
    
    if (!fs.existsSync(filePath)) {
      const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
      let found = false;
      
      for (const file of files) {
        if (file.toLowerCase().replace('.js', '') === lowerName) {
          filePath = path.join(eventsPath, file);
          found = true;
          break;
        }
      }
      
      if (!found) {
        return { success: false, error: `Event "${eventName}" not found` };
      }
    }
    
    clearRequireCache(filePath);
    const event = require(filePath);
    
    if (event.config && event.config.name) {
      client.events.set(event.config.name.toLowerCase(), event);
      logs.success('RELOAD', `Reloaded event: ${event.config.name}`);
      return { success: true, name: event.config.name };
    }
    
    return { success: false, error: 'Invalid event structure' };
  } catch (error) {
    logs.error('RELOAD', `Failed to reload event ${eventName}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function loadNewCommand(client, commandsPath, commandName) {
  try {
    const filePath = path.join(commandsPath, `${commandName.toLowerCase()}.js`);
    
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `File "${commandName}.js" not found` };
    }
    
    clearRequireCache(filePath);
    const command = require(filePath);
    
    const cmdConfig = command.config || command;
    const validation = validateCommandConfig(cmdConfig, commandName);
    if (!validation.valid) {
      console.log('');
      console.log(`[❌] COMMAND VALIDATION FAILED: ${commandName}.js`);
      console.log(`[⚠️] Missing required fields: ${validation.missing.join(', ')}`);
      console.log('');
      return { success: false, error: `Missing fields: ${validation.missing.join(', ')}`, missing: validation.missing };
    }
    
    if (cmdConfig && cmdConfig.name) {
      client.commands.set(cmdConfig.name.toLowerCase(), command);
      
      if (cmdConfig.aliases && Array.isArray(cmdConfig.aliases)) {
        cmdConfig.aliases.forEach(alias => {
          client.commands.set(alias.toLowerCase(), command);
        });
      }
      
      logs.success('LOAD', `Loaded new command: ${cmdConfig.name}`);
      return { success: true, name: cmdConfig.name };
    }
    
    return { success: false, error: 'Invalid command structure' };
  } catch (error) {
    logs.error('LOAD', `Failed to load ${commandName}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = {
  loadCommands,
  loadEvents,
  reloadCommand,
  reloadEvent,
  loadNewCommand,
  clearRequireCache
};