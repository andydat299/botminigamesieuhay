const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Xem thông tin profile của bạn hoặc người khác')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Người dùng để xem profile')
                .setRequired(false)),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;
        
        try {
            const user = await Database.getUser(userId);
            const balance = await Database.getBalance(userId);
            
            const embed = new EmbedBuilder()
                .setTitle(`👤 Profile của ${targetUser.displayName}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setColor('#0099ff')
                .addFields(
                    { name: '💰 Số dư', value: `${balance.toLocaleString()} coins`, inline: true },
                    { name: '📅 Tham gia', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '🏆 Level', value: `${user.level || 1}`, inline: true }
                )
                .setTimestamp();
            
            if (user.lastDaily) {
                embed.addFields({
                    name: '🎁 Daily cuối',
                    value: `<t:${Math.floor(user.lastDaily / 1000)}:R>`,
                    inline: true
                });
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Profile command error:', error);
            await interaction.reply({ 
                content: '❌ Có lỗi xảy ra khi xem profile!', 
                ephemeral: true 
            });
        }
    }
};