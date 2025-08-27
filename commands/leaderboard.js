const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Xem bảng xếp hạng giàu nhất')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Loại bảng xếp hạng')
                .setRequired(false)
                .addChoices(
                    { name: '💰 Giàu nhất', value: 'balance' },
                    { name: '🏆 Level cao nhất', value: 'level' }
                )),
    
    async execute(interaction) {
        const type = interaction.options.getString('type') || 'balance';
        
        try {
            let users;
            let title;
            let fieldName;
            
            if (type === 'balance') {
                users = await Database.getTopUsers('balance', 10);
                title = '💰 Top 10 người giàu nhất';
                fieldName = 'coins';
            } else {
                users = await Database.getTopUsers('level', 10);
                title = '🏆 Top 10 level cao nhất';
                fieldName = 'level';
            }
            
            if (!users || users.length === 0) {
                return await interaction.reply({ 
                    content: '❌ Không có dữ liệu bảng xếp hạng!', 
                    ephemeral: true 
                });
            }
            
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor('#FFD700')
                .setTimestamp();
            
            let description = '';
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                const value = type === 'balance' ? `${user.balance.toLocaleString()} coins` : `Level ${user.level || 1}`;
                description += `${medal} <@${user.userId}> - ${value}\n`;
            }
            
            embed.setDescription(description);
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Leaderboard command error:', error);
            await interaction.reply({ 
                content: '❌ Có lỗi xảy ra khi xem bảng xếp hạng!', 
                ephemeral: true 
            });
        }
    }
};