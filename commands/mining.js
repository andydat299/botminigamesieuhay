const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mining')
        .setDescription('Đào mỏ để kiếm tiền và tài nguyên'),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        
        try {
            const inventory = await Database.getInventory(userId);
            const pickaxeLevel = inventory.pickaxe || 1;
            
            const embed = new EmbedBuilder()
                .setTitle('⛏️ Khu vực đào mỏ')
                .setDescription(`Cuốc hiện tại: **Level ${pickaxeLevel}**\n\nNhấn nút để đào!`)
                .setColor('#8B4513')
                .setTimestamp();
            
            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('mine_hit')
                        .setLabel('⛏️ Đào!')
                        .setStyle(ButtonStyle.Primary)
                );
            
            const response = await interaction.reply({ 
                embeds: [embed], 
                components: [button] 
            });
            
            const collector = response.createMessageComponentCollector({ 
                time: 30000 
            });
            
            collector.on('collect', async (i) => {
                if (i.user.id !== userId) {
                    return await i.reply({ 
                        content: '❌ Chỉ người tạo lệnh mới có thể đào!', 
                        ephemeral: true 
                    });
                }
                
                const currentInventory = await Database.getInventory(userId);
                const currentPickaxeLevel = currentInventory.pickaxe || 1;
                
                // Mining logic
                const ores = [
                    { name: 'coal', emoji: '🪨', chance: 0.4, value: 10 },
                    { name: 'iron', emoji: '⚙️', chance: 0.3, value: 25 },
                    { name: 'gold', emoji: '🟡', chance: 0.2, value: 50 },
                    { name: 'diamond', emoji: '💎', chance: 0.1, value: 100 }
                ];
                
                const random = Math.random();
                let found = null;
                let cumulativeChance = 0;
                
                for (const ore of ores) {
                    cumulativeChance += ore.chance * (currentPickaxeLevel * 0.3); // Better pickaxe = better chances
                    if (random < cumulativeChance) {
                        found = ore;
                        break;
                    }
                }
                
                if (found) {
                    await Database.updateInventory(userId, found.name, (currentInventory[found.name] || 0) + 1);
                    await Database.addBalance(userId, found.value * currentPickaxeLevel);
                    
                    const resultEmbed = new EmbedBuilder()
                        .setTitle('⛏️ Đào mỏ thành công!')
                        .setDescription(`Bạn đã tìm thấy: ${found.emoji} **${found.name.toUpperCase()}**\n💰 +${(found.value * currentPickaxeLevel).toLocaleString()} coins`)
                        .setColor('#00ff00')
                        .setTimestamp();
                    
                    await i.update({ embeds: [resultEmbed], components: [button] });
                } else {
                    const resultEmbed = new EmbedBuilder()
                        .setTitle('⛏️ Không tìm thấy gì')
                        .setDescription('Bạn đào nhưng không tìm thấy gì cả! Thử lại lần sau.')
                        .setColor('#ff0000')
                        .setTimestamp();
                    
                    await i.update({ embeds: [resultEmbed], components: [button] });
                }
            });
            
            collector.on('end', async () => {
                const disabledButton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('mine_hit_disabled')
                            .setLabel('⛏️ Hết thời gian')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );
                
                try {
                    await response.edit({ components: [disabledButton] });
                } catch (error) {
                    // Ignore edit errors if message was deleted
                }
            });
            
        } catch (error) {
            console.error('Mining command error:', error);
            await interaction.reply({ 
                content: '❌ Có lỗi xảy ra khi đào mỏ!', 
                ephemeral: true 
            });
        }
    }
};