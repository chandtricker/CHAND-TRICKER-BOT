const db = require('../index');

const Currencies = {
  get(id) {
    return db.prepare('SELECT * FROM currencies WHERE id = ?').get(id);
  },

  create(id) {
    const existing = this.get(id);
    if (existing) return existing;
    
    db.prepare('INSERT INTO currencies (id) VALUES (?)').run(id);
    return this.get(id);
  },

  update(id, data) {
    const currency = this.get(id);
    if (!currency) this.create(id);
    
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }
    
    values.push(id);
    db.prepare(`UPDATE currencies SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.get(id);
  },

  getBalance(id) {
    const currency = this.get(id) || this.create(id);
    return currency.balance || 0;
  },

  getBank(id) {
    const currency = this.get(id) || this.create(id);
    return currency.bank || 0;
  },

  getTotal(id) {
    const currency = this.get(id) || this.create(id);
    return (currency.balance || 0) + (currency.bank || 0);
  },

  addBalance(id, amount) {
    const currency = this.get(id) || this.create(id);
    return this.update(id, { balance: (currency.balance || 0) + amount });
  },

  removeBalance(id, amount) {
    const currency = this.get(id) || this.create(id);
    const newBalance = Math.max(0, (currency.balance || 0) - amount);
    return this.update(id, { balance: newBalance });
  },

  deposit(id, amount) {
    const currency = this.get(id) || this.create(id);
    if ((currency.balance || 0) < amount) return false;
    
    this.update(id, {
      balance: (currency.balance || 0) - amount,
      bank: (currency.bank || 0) + amount
    });
    return true;
  },

  withdraw(id, amount) {
    const currency = this.get(id) || this.create(id);
    if ((currency.bank || 0) < amount) return false;
    
    this.update(id, {
      balance: (currency.balance || 0) + amount,
      bank: (currency.bank || 0) - amount
    });
    return true;
  },

  transfer(fromId, toId, amount) {
    const from = this.get(fromId) || this.create(fromId);
    if ((from.balance || 0) < amount) return false;
    
    this.create(toId);
    this.removeBalance(fromId, amount);
    this.addBalance(toId, amount);
    return true;
  },

  claimDaily(id) {
    const currency = this.get(id) || this.create(id);
    const now = new Date().toDateString();
    const lastDaily = currency.lastDaily;
    
    if (lastDaily === now) {
      return { success: false, reason: 'already_claimed' };
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = lastDaily === yesterday.toDateString();
    
    let streak = wasYesterday ? (currency.dailyStreak || 0) + 1 : 1;
    const baseReward = 1000;
    const streakBonus = Math.min(streak * 100, 1000);
    const totalReward = baseReward + streakBonus;
    
    this.update(id, {
      balance: (currency.balance || 0) + totalReward,
      dailyStreak: streak,
      lastDaily: now
    });
    
    return { success: true, reward: totalReward, streak };
  },

  work(id) {
    const currency = this.get(id) || this.create(id);
    const now = Date.now();
    const lastWork = currency.lastWork ? new Date(currency.lastWork).getTime() : 0;
    const cooldown = 30 * 60 * 1000;
    
    if (now - lastWork < cooldown) {
      const remaining = Math.ceil((cooldown - (now - lastWork)) / 60000);
      return { success: false, remaining };
    }
    
    const jobs = ['Developer', 'Teacher', 'Doctor', 'Driver', 'Chef', 'Artist', 'Engineer', 'Writer'];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earnings = Math.floor(Math.random() * 500) + 200;
    
    this.update(id, {
      balance: (currency.balance || 0) + earnings,
      lastWork: new Date().toISOString()
    });
    
    return { success: true, job, earnings };
  },

  getTop(limit = 10) {
    return db.prepare(`
      SELECT id, balance, bank, (balance + bank) as total 
      FROM currencies 
      ORDER BY total DESC 
      LIMIT ?
    `).all(limit);
  },

  addTransaction(id, type, amount, note = '') {
    const currency = this.get(id) || this.create(id);
    let transactions = [];
    try {
      transactions = JSON.parse(currency.transactions || '[]');
    } catch (e) {}
    
    transactions.unshift({
      type,
      amount,
      note,
      timestamp: new Date().toISOString()
    });
    
    transactions = transactions.slice(0, 50);
    return this.update(id, { transactions: JSON.stringify(transactions) });
  },

  getData(id) {
    const currency = this.get(id) || this.create(id);
    return {
      exp: currency.exp || 0,
      balance: currency.balance || 0,
      bank: currency.bank || 0
    };
  },

  setData(id, data) {
    const currency = this.get(id) || this.create(id);
    const updateData = {};
    
    if (typeof data.exp !== 'undefined') {
      updateData.exp = data.exp;
    }
    if (typeof data.balance !== 'undefined') {
      updateData.balance = data.balance;
    }
    if (typeof data.bank !== 'undefined') {
      updateData.bank = data.bank;
    }
    
    if (Object.keys(updateData).length > 0) {
      return this.update(id, updateData);
    }
    return currency;
  },

  getExp(id) {
    const currency = this.get(id) || this.create(id);
    return currency.exp || 0;
  },

  addExp(id, amount) {
    const currency = this.get(id) || this.create(id);
    return this.update(id, { exp: (currency.exp || 0) + amount });
  }
};

module.exports = Currencies;
