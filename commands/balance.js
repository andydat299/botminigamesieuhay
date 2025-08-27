const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Kiểm tra số dư của bạn')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Người dùng để kiểm tra số dư')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const balance = await Database.getBalance(targetUser.id);
        
        const embed = new EmbedBuilder()
            .setTitle('💰 Số dư')
            .setDescription(`${targetUser.displayName} có **${balance.toLocaleString()}** coins`)
            .setColor('#FFD700')
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};