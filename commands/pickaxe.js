const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pickaxe')
        .setDescription('Xem thông tin cuốc của bạn'),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        
        try {
            const inventory = await Database.getInventory(userId);
            const pickaxeLevel = inventory.pickaxe || 1;
            
            const pickaxeInfo = {
                1: { name: 'Cuốc Gỗ', emoji: '⛏️', efficiency: '1x', next: 'Cuốc Đá (500 coins)' },
                2: { name: 'Cuốc Đá', emoji: '⛏️', efficiency: '1.5x', next: 'Cuốc Sắt (2000 coins)' },
                3: { name: 'Cuốc Sắt', emoji: '⛏️', efficiency: '2x', next: 'Cuốc Vàng (5000 coins)' },
                4: { name: 'Cuốc Vàng', emoji: '⛏️', efficiency: '2.5x', next: 'Cuốc Kim Cương (15000 coins)' },
                5: { name: 'Cuốc Kim Cương', emoji: '💎', efficiency: '3x', next: 'MAX LEVEL!' }
            };
            
            const current = pickaxeInfo[pickaxeLevel];
            
            const embed = new EmbedBuilder()
                .setTitle('⛏️ Thông tin cuốc')
                .setColor('#8B4513')
                .addFields(
                    { name: '🔧 Cuốc hiện tại', value: `${current.emoji} **${current.name}** (Level ${pickaxeLevel})`, inline: true },
                    { name: '⚡ Hiệu suất', value: current.efficiency, inline: true },
                    { name: '📈 Nâng cấp tiếp theo', value: current.next, inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Pickaxe command error:', error);
            await interaction.reply({ 
                content: '❌ Có lỗi xảy ra khi xem thông tin cuốc!', 
                ephemeral: true 
            });
        }
    }
};