const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Chơi máy đánh bạc')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Số tiền cược (tối thiểu 10)')
                .setRequired(true)
                .setMinValue(10)),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        const amount = interaction.options.getInteger('amount');
        
        try {
            const balance = await Database.getBalance(userId);
            
            if (balance < amount) {
                return await interaction.reply({ 
                    content: `❌ Bạn không đủ tiền! Số dư hiện tại: **${balance.toLocaleString()}** coins`, 
                    ephemeral: true 
                });
            }
            
            const symbols = ['🍎', '🍊', '🍋', '🍇', '🍓', '💎'];
            const reels = [
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)]
            ];
            
            let multiplier = 0;
            let result = '';
            
            // Check for wins
            if (reels[0] === reels[1] && reels[1] === reels[2]) {
                // Three of a kind
                if (reels[0] === '💎') {
                    multiplier = 10; // Diamond jackpot
                    result = '💎 JACKPOT! 💎';
                } else {
                    multiplier = 5;
                    result = '🎉 Ba cùng loại!';
                }
            } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
                // Two of a kind
                multiplier = 2;
                result = '🎊 Hai cùng loại!';
            } else {
                result = '😢 Không trúng!';
            }
            
            const embed = new EmbedBuilder()
                .setTitle('🎰 Slot Machine')
                .setDescription(`**[ ${reels.join(' | ')} ]**\n\n${result}`)
                .setColor(multiplier > 0 ? '#00ff00' : '#ff0000')
                .setTimestamp();
            
            if (multiplier > 0) {
                const winAmount = amount * multiplier;
                await Database.addBalance(userId, winAmount - amount); // Subtract original bet
                await Database.updateStats(userId, 'slots', true);
                embed.addFields({ name: '💰 Thắng', value: `+${(winAmount - amount).toLocaleString()} coins (x${multiplier})`, inline: true });
            } else {
                await Database.removeBalance(userId, amount);
                await Database.updateStats(userId, 'slots', false);
                embed.addFields({ name: '💸 Thua', value: `-${amount.toLocaleString()} coins`, inline: true });
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Slots command error:', error);
            await interaction.reply({ 
                content: '❌ Có lỗi xảy ra khi chơi slots!', 
                ephemeral: true 
            });
        }
    }
};