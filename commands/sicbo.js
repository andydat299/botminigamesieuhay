const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sicbo')
        .setDescription('Chơi tài xỉu')
        .addStringOption(option =>
            option.setName('bet')
                .setDescription('Chọn tài hay xỉu')
                .setRequired(true)
                .addChoices(
                    { name: '🔺 Tài (11-17)', value: 'tai' },
                    { name: '🔻 Xỉu (4-10)', value: 'xiu' }
                ))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Số tiền cược (tối thiểu 10)')
                .setRequired(true)
                .setMinValue(10)),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        const bet = interaction.options.getString('bet');
        const amount = interaction.options.getInteger('amount');
        
        try {
            const balance = await Database.getBalance(userId);
            
            if (balance < amount) {
                return await interaction.reply({ 
                    content: `❌ Bạn không đủ tiền! Số dư hiện tại: **${balance.toLocaleString()}** coins`, 
                    ephemeral: true 
                });
            }
            
            // Roll 3 dice
            const dice1 = Math.floor(Math.random() * 6) + 1;
            const dice2 = Math.floor(Math.random() * 6) + 1;
            const dice3 = Math.floor(Math.random() * 6) + 1;
            const total = dice1 + dice2 + dice3;
            
            const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            const result = total >= 11 ? 'tai' : 'xiu';
            const won = bet === result;
            
            const embed = new EmbedBuilder()
                .setTitle('🎲 Tài Xỉu')
                .setDescription(`${diceEmojis[dice1-1]} ${diceEmojis[dice2-1]} ${diceEmojis[dice3-1]}\n\n**Tổng: ${total}** - ${result === 'tai' ? '🔺 Tài' : '🔻 Xỉu'}`)
                .setColor(won ? '#00ff00' : '#ff0000')
                .setTimestamp();
            
            if (won) {
                await Database.addBalance(userId, amount);
                await Database.updateStats(userId, 'sicbo', true);
                embed.addFields({ name: '🎉 Kết quả', value: `**Thắng!**\n💰 +${amount.toLocaleString()} coins`, inline: false });
            } else {
                await Database.removeBalance(userId, amount);
                await Database.updateStats(userId, 'sicbo', false);
                embed.addFields({ name: '😢 Kết quả', value: `**Thua!**\n💸 -${amount.toLocaleString()} coins`, inline: false });
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Sicbo command error:', error);
            await interaction.reply({ 
                content: '❌ Có lỗi xảy ra khi chơi sicbo!', 
                ephemeral: true 
            });
        }
    }
};