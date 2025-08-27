const { MongoClient } = require('mongodb');

class Database {
    constructor() {
        this.client = null;
        this.db = null;
        this.connected = false;
    }

    async connect() {
        try {
            const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
            this.client = new MongoClient(uri);
            await this.client.connect();
            this.db = this.client.db('minigame_bot');
            this.connected = true;
            console.log('✅ Đã kết nối MongoDB thành công!');
        } catch (error) {
            console.error('❌ Lỗi kết nối MongoDB:', error);
            this.connected = false;
        }
    }

    async getUser(userId) {
        try {
            if (!this.connected) await this.connect();
            
            let user = await this.db.collection('users').findOne({ userId });
            if (!user) {
                user = {
                    userId,
                    balance: 1000,
                    level: 1,
                    lastDaily: null,
                    createdAt: new Date()
                };
                await this.db.collection('users').insertOne(user);
            }
            return user;
        } catch (error) {
            console.error('Database getUser error:', error);
            return { userId, balance: 1000, level: 1, lastDaily: null };
        }
    }

    async getBalance(userId) {
        try {
            const user = await this.getUser(userId);
            return user.balance || 1000;
        } catch (error) {
            console.error('Database getBalance error:', error);
            return 1000;
        }
    }

    async addBalance(userId, amount) {
        try {
            if (!this.connected) await this.connect();
            
            await this.getUser(userId); // Ensure user exists
            await this.db.collection('users').updateOne(
                { userId },
                { $inc: { balance: amount } }
            );
        } catch (error) {
            console.error('Database addBalance error:', error);
        }
    }

    async removeBalance(userId, amount) {
        try {
            if (!this.connected) await this.connect();
            
            await this.getUser(userId); // Ensure user exists
            await this.db.collection('users').updateOne(
                { userId },
                { $inc: { balance: -amount } }
            );
        } catch (error) {
            console.error('Database removeBalance error:', error);
        }
    }

    async updateUser(userId, data) {
        try {
            if (!this.connected) await this.connect();
            
            await this.getUser(userId); // Ensure user exists
            await this.db.collection('users').updateOne(
                { userId },
                { $set: data }
            );
        } catch (error) {
            console.error('Database updateUser error:', error);
        }
    }

    async getStats(userId, game) {
        try {
            if (!this.connected) await this.connect();
            
            let stats = await this.db.collection('game_stats').findOne({ userId, game });
            if (!stats) {
                stats = {
                    userId,
                    game,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    createdAt: new Date()
                };
                await this.db.collection('game_stats').insertOne(stats);
            }
            return stats;
        } catch (error) {
            console.error('Database getStats error:', error);
            return { wins: 0, losses: 0, draws: 0 };
        }
    }

    async updateStats(userId, game, won, draw = false) {
        try {
            if (!this.connected) await this.connect();
            
            await this.getStats(userId, game); // Ensure stats exist
            
            const update = draw ? { $inc: { draws: 1 } } : 
                          won ? { $inc: { wins: 1 } } : { $inc: { losses: 1 } };
            
            await this.db.collection('game_stats').updateOne(
                { userId, game },
                update
            );
        } catch (error) {
            console.error('Database updateStats error:', error);
        }
    }

    async getInventory(userId) {
        try {
            if (!this.connected) await this.connect();
            
            let inventory = await this.db.collection('inventory').findOne({ userId });
            if (!inventory) {
                inventory = {
                    userId,
                    pickaxe: 1,
                    coal: 0,
                    iron: 0,
                    gold: 0,
                    diamond: 0,
                    createdAt: new Date()
                };
                await this.db.collection('inventory').insertOne(inventory);
            }
            return inventory;
        } catch (error) {
            console.error('Database getInventory error:', error);
            return { pickaxe: 1, coal: 0, iron: 0, gold: 0, diamond: 0 };
        }
    }

    async updateInventory(userId, item, quantity) {
        try {
            if (!this.connected) await this.connect();
            
            await this.getInventory(userId); // Ensure inventory exists
            await this.db.collection('inventory').updateOne(
                { userId },
                { $set: { [item]: quantity } }
            );
        } catch (error) {
            console.error('Database updateInventory error:', error);
        }
    }

    async getTopUsers(type = 'balance', limit = 10) {
        try {
            if (!this.connected) await this.connect();
            
            const sortField = type === 'level' ? { level: -1 } : { balance: -1 };
            const users = await this.db.collection('users')
                .find({})
                .sort(sortField)
                .limit(limit)
                .toArray();
            
            return users;
        } catch (error) {
            console.error('Database getTopUsers error:', error);
            return [];
        }
    }
}

module.exports = new Database();