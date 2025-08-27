const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Xem thống kê game của bạn')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Người dùng để xem stats')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;
        
        try {
            // Lấy stats cho tất cả games
            const games = ['rps', 'guess', 'trivia', 'slots', 'coinflip', 'mining', 'adventure', 'sicbo'];
            const statsPromises = games.map(game =>
                Database.getStats(userId, game)
            );
            
            const allStats = await Promise.all(statsPromises);
            
            const embed = new EmbedBuilder()
                .setTitle(`📊 Thống kê của ${targetUser.displayName}`)
                .setColor('#00ff00')
                .setTimestamp();
            
            // Tạo description với stats của tất cả games
            let description = '';
            games.forEach((game, index) => {
                const stats = allStats[index];
                if (stats && (stats.wins > 0 || stats.losses > 0)) {
                    const total = stats.wins + stats.losses;
                    const winRate = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : '0.0';
                    description += `**${game.toUpperCase()}:** ${stats.wins}W/${stats.losses}L (${winRate}%)\n`;
                }
            });
            
            if (!description) {
                description = 'Chưa có dữ liệu thống kê nào!';
            }
            
            embed.setDescription(description);
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error fetching stats:', error);
            await interaction.reply({ 
                content: '❌ Có lỗi xảy ra khi lấy thống kê!', 
                ephemeral: true 
            });
        }
    }
};