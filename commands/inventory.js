const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Xem kho đồ của bạn')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Người dùng để xem inventory')
                .setRequired(false)),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;
        
        try {
            const inventory = await Database.getInventory(userId);
            
            const embed = new EmbedBuilder()
                .setTitle(`🎒 Kho đồ của ${targetUser.displayName}`)
                .setColor('#8B4513')
                .setTimestamp();
            
            if (!inventory || Object.keys(inventory).length === 0) {
                embed.setDescription('Kho đồ trống!');
                return await interaction.reply({ embeds: [embed] });
            }
            
            let description = '';
            
            // Mining items
            if (inventory.pickaxe) {
                const pickaxeLevel = inventory.pickaxe;
                const pickaxeNames = ['Cuốc Gỗ', 'Cuốc Đá', 'Cuốc Sắt', 'Cuốc Vàng', 'Cuốc Kim Cương'];
                description += `⛏️ **${pickaxeNames[pickaxeLevel - 1] || 'Cuốc Gỗ'}** (Level ${pickaxeLevel})\n`;
            }
            
            // Ores
            const ores = ['coal', 'iron', 'gold', 'diamond'];
            const oreNames = { coal: '🪨 Than', iron: '⚙️ Sắt', gold: '🟡 Vàng', diamond: '💎 Kim Cương' };
            
            for (const ore of ores) {
                if (inventory[ore] && inventory[ore] > 0) {
                    description += `${oreNames[ore]}: ${inventory[ore]}\n`;
                }
            }
            
            if (!description) {
                description = 'Kho đồ trống!';
            }
            
            embed.setDescription(description);
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Inventory command error:', error);
            await interaction.reply({ 
                content: '❌ Có lỗi xảy ra khi xem inventory!', 
                ephemeral: true 
            });
        }
    }
};