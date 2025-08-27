const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Hiển thị danh sách các lệnh có sẵn'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎮 Danh sách lệnh')
            .setDescription('Dưới đây là tất cả các lệnh có sẵn:')
            .setColor('#0099ff')
            .addFields(
                { name: '💰 Economy', value: '`/balance` - Kiểm tra số dư\n`/daily` - Nhận thưởng hàng ngày\n`/profile` - Xem profile\n`/leaderboard` - Bảng xếp hạng', inline: false },
                { name: '🎲 Games', value: '`/rps` - Kéo búa bao\n`/coinflip` - Tung đồng xu\n`/guess` - Đoán số\n`/slots` - Máy đánh bạc\n`/sicbo` - Tài xỉu', inline: false },
                { name: '⚒️ Mining', value: '`/mining` - Đào mỏ\n`/pickaxe` - Nâng cấp cuốc\n`/inventory` - Xem kho đồ', inline: false },
                { name: '📊 Stats', value: '`/stats` - Xem thống kê game', inline: false }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};