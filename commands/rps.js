const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Chơi kéo búa bao với bot')
        .addStringOption(option =>
            option.setName('choice')
                .setDescription('Lựa chọn của bạn')
                .setRequired(true)
                .addChoices(
                    { name: '✂️ Kéo', value: 'scissors' },
                    { name: '🗿 Đá', value: 'rock' },
                    { name: '📄 Giấy', value: 'paper' }
                ))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Số tiền cược (tối thiểu 10)')
                .setRequired(true)
                .setMinValue(10)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const userChoice = interaction.options.getString('choice');
        const amount = interaction.options.getInteger('amount');

        try {
            const balance = await Database.getBalance(userId);

            if (balance < amount) {
                return await interaction.reply({
                    content: `❌ Bạn không đủ tiền! Số dư hiện tại: **${balance.toLocaleString()}** coins`,
                    ephemeral: true
                });
            }

            const choices = ['rock', 'paper', 'scissors'];
            const botChoice = choices[Math.floor(Math.random() * choices.length)];

            const choiceEmojis = {
                rock: '🗿',
                paper: '📄',
                scissors: '✂️'
            };

            let result;
            if (userChoice === botChoice) {
                result = 'tie';
            } else if (
                (userChoice === 'rock' && botChoice === 'scissors') ||
                (userChoice === 'paper' && botChoice === 'rock') ||
                (userChoice === 'scissors' && botChoice === 'paper')
            ) {
                result = 'win';
            } else {
                result = 'lose';
            }

            const embed = new EmbedBuilder()
                .setTitle('✂️🗿📄 Rock Paper Scissors')
                .setColor(result === 'win' ? '#00ff00' : result === 'lose' ? '#ff0000' : '#ffff00')
                .setTimestamp();

            if (result === 'win') {
                await Database.addBalance(userId, amount);
                await Database.updateStats(userId, 'rps', true);
                embed.setDescription(`🎉 **Thắng!**\n\nBạn: ${choiceEmojis[userChoice]}\nBot: ${choiceEmojis[botChoice]}\n\n💰 +${amount.toLocaleString()} coins`);
            } else if (result === 'lose') {
                await Database.removeBalance(userId, amount);
                await Database.updateStats(userId, 'rps', false);
                embed.setDescription(`😢 **Thua!**\n\nBạn: ${choiceEmojis[userChoice]}\nBot: ${choiceEmojis[botChoice]}\n\n💸 -${amount.toLocaleString()} coins`);
            } else {
                embed.setDescription(`🤝 **Hòa!**\n\nBạn: ${choiceEmojis[userChoice]}\nBot: ${choiceEmojis[botChoice]}\n\n💰 Không mất tiền`);
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('RPS command error:', error);
            await interaction.reply({
                content: '❌ Có lỗi xảy ra khi chơi RPS!',
                ephemeral: true
            });
        }
    }
};