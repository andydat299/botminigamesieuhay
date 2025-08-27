const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Mua đồ từ cửa hàng')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('Vật phẩm muốn mua')
                .setRequired(true)
                .addChoices(
                    { name: '⛏️ Cuốc Đá (500 coins)', value: 'stone_pickaxe' },
                    { name: '⛏️ Cuốc Sắt (2000 coins)', value: 'iron_pickaxe' },
                    { name: '⛏️ Cuốc Vàng (5000 coins)', value: 'gold_pickaxe' },
                    { name: '⛏️ Cuốc Kim Cương (15000 coins)', value: 'diamond_pickaxe' }
                )),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        const item = interaction.options.getString('item');
        
        try {
            const balance = await Database.getBalance(userId);
            const inventory = await Database.getInventory(userId);
            
            const items = {
                stone_pickaxe: { name: 'Cuốc Đá', price: 500, level: 2 },
                iron_pickaxe: { name: 'Cuốc Sắt', price: 2000, level: 3 },
                gold_pickaxe: { name: 'Cuốc Vàng', price: 5000, level: 4 },
                diamond_pickaxe: { name: 'Cuốc Kim Cương', price: 15000, level: 5 }
            };
            
            const itemData = items[item];
            if (!itemData) {
                return await interaction.reply({ 
                    content: '❌ Vật phẩm không tồn tại!', 
                    ephemeral: true 
                });
            }
            
            if (balance < itemData.price) {
                return await interaction.reply({ 
                    content: `❌ Bạn không đủ tiền! Cần **${itemData.price.toLocaleString()}** coins, bạn có **${balance.toLocaleString()}** coins`, 
                    ephemeral: true 
                });
            }
            
            const currentPickaxeLevel = inventory.pickaxe || 1;
            if (currentPickaxeLevel >= itemData.level) {
                return await interaction.reply({ 
                    content: `❌ Bạn đã có cuốc level ${currentPickaxeLevel} rồi!`, 
                    ephemeral: true 
                });
            }
            
            if (itemData.level > currentPickaxeLevel + 1) {
                return await interaction.reply({ 
                    content: `❌ Bạn cần nâng cấp cuốc theo thứ tự! Cuốc hiện tại: Level ${currentPickaxeLevel}`, 
                    ephemeral: true 
                });
            }
            
            await Database.removeBalance(userId, itemData.price);
            await Database.updateInventory(userId, 'pickaxe', itemData.level);
            
            const embed = new EmbedBuilder()
                .setTitle('🛒 Mua hàng thành công!')
                .setDescription(`Bạn đã mua **⛏️ ${itemData.name}** với giá **${itemData.price.toLocaleString()}** coins`)
                .setColor('#00ff00')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Shop command error:', error);
            await interaction.reply({ 
                content: '❌ Có lỗi xảy ra khi mua hàng!', 
                ephemeral: true 
            });
        }
    }
};