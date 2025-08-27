const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Nhận phần thưởng hàng ngày'),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        
        try {
            const user = await Database.getUser(userId);
            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;
            
            if (user.lastDaily && (now - user.lastDaily) < oneDayMs) {
                const timeLeft = oneDayMs - (now - user.lastDaily);
                const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
                const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                
                const embed = new EmbedBuilder()
                    .setTitle('⏰ Daily Reward')
                    .setDescription(`Bạn đã nhận phần thưởng hôm nay rồi!\nVui lòng quay lại sau **${hoursLeft}h ${minutesLeft}m**`)
                    .setColor('#ff0000');
                
                return await interaction.reply({ embeds: [embed] });
            }
            
            const reward = 1000;
            await Database.addBalance(userId, reward);
            await Database.updateUser(userId, { lastDaily: now });
            
            const embed = new EmbedBuilder()
                .setTitle('🎁 Daily Reward')
                .setDescription(`Bạn đã nhận được **${reward.toLocaleString()}** coins!\nHãy quay lại vào ngày mai để nhận thêm.`)
                .setColor('#00ff00');
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Daily command error:', error);
            await interaction.reply({ 
                content: '❌ Có lỗi xảy ra khi nhận phần thưởng hàng ngày!', 
                ephemeral: true 
            });
        }
    }
};