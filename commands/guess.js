const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guess')
        .setDescription('Đoán số từ 1-10')
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('Số bạn đoán (1-10)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Số tiền cược (tối thiểu 10)')
                .setRequired(true)
                .setMinValue(10)),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        const guess = interaction.options.getInteger('number');
        const amount = interaction.options.getInteger('amount');
        
        try {
            const balance = await Database.getBalance(userId);
            
            if (balance < amount) {
                return await interaction.reply({ 
                    content: `❌ Bạn không đủ tiền! Số dư hiện tại: **${balance.toLocaleString()}** coins`, 
                    ephemeral: true 
                });
            }
            
            const randomNumber = Math.floor(Math.random() * 10) + 1;
            const won = guess === randomNumber;
            
            const embed = new EmbedBuilder()
                .setTitle('🎲 Guess Number')
                .setColor(won ? '#00ff00' : '#ff0000')
                .setTimestamp();
            
            if (won) {
                const winAmount = amount * 5; // x5 multiplier for guessing correctly
                await Database.addBalance(userId, winAmount);
                await Database.updateStats(userId, 'guess', true);
                embed.setDescription(`🎉 **Chúc mừng!**\n\nSố bạn đoán: **${guess}**\nSố đúng: **${randomNumber}**\n\n💰 +${winAmount.toLocaleString()} coins (x5)`);
            } else {
                await Database.removeBalance(userId, amount);
                await Database.updateStats(userId, 'guess', false);
                embed.setDescription(`😢 **Sai rồi!**\n\nSố bạn đoán: **${guess}**\nSố đúng: **${randomNumber}**\n\n💸 -${amount.toLocaleString()} coins`);
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Guess command error:', error);
            await interaction.reply({ 
                content: '❌ Có lỗi xảy ra khi chơi guess!', 
                ephemeral: true 
            });
        }
    }
};