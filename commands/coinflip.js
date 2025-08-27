const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Tung đồng xu và đặt cược')
        .addStringOption(option =>
            option.setName('choice')
                .setDescription('Chọn mặt đồng xu')
                .setRequired(true)
                .addChoices(
                    { name: '🪙 Heads (Mặt)', value: 'heads' },
                    { name: '⚡ Tails (Ngửa)', value: 'tails' }
                ))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Số tiền cược (tối thiểu 10)')
                .setRequired(true)
                .setMinValue(10)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const choice = interaction.options.getString('choice');
        const amount = interaction.options.getInteger('amount');

        try {
            const balance = await Database.getBalance(userId);

            if (balance < amount) {
                return await interaction.reply({
                    content: `❌ Bạn không đủ tiền! Số dư hiện tại: **${balance.toLocaleString()}** coins`,
                    ephemeral: true
                });
            }

            const result = Math.random() < 0.5 ? 'heads' : 'tails';
            const won = choice === result;

            const embed = new EmbedBuilder()
                .setTitle('🪙 Coinflip')
                .setColor(won ? '#00ff00' : '#ff0000')
                .setTimestamp();

            if (won) {
                await Database.addBalance(userId, amount);
                await Database.updateStats(userId, 'coinflip', true);
                embed.setDescription(`🎉 **Thắng!**\n\nBạn chọn: ${choice === 'heads' ? '🪙 Heads' : '⚡ Tails'}\nKết quả: ${result === 'heads' ? '🪙 Heads' : '⚡ Tails'}\n\n💰 +${amount.toLocaleString()} coins`);
            } else {
                await Database.removeBalance(userId, amount);
                await Database.updateStats(userId, 'coinflip', false);
                embed.setDescription(`😢 **Thua!**\n\nBạn chọn: ${choice === 'heads' ? '🪙 Heads' : '⚡ Tails'}\nKết quả: ${result === 'heads' ? '🪙 Heads' : '⚡ Tails'}\n\n💸 -${amount.toLocaleString()} coins`);
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Coinflip command error:', error);
            await interaction.reply({
                content: '❌ Có lỗi xảy ra khi chơi coinflip!',
                ephemeral: true
            });
        }
    }
};