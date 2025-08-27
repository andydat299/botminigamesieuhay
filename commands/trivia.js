const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Chơi game câu hỏi kiến thức tổng hợp')
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
            
            const questions = [
                {
                    question: "Thủ đô của Việt Nam là gì?",
                    options: ["A. Hồ Chí Minh", "B. Hà Nội", "C. Đà Nẵng", "D. Hải Phòng"],
                    correct: "B"
                },
                {
                    question: "Con số nào lớn nhất?",
                    options: ["A. 999", "B. 1000", "C. 1001", "D. 998"],
                    correct: "C"
                },
                {
                    question: "Trong một năm có bao nhiêu tháng có 31 ngày?",
                    options: ["A. 6", "B. 7", "C. 8", "D. 5"],
                    correct: "B"
                },
                {
                    question: "Hành tinh nào gần Mặt Trời nhất?",
                    options: ["A. Sao Kim", "B. Trái Đất", "C. Sao Thủy", "D. Sao Hỏa"],
                    correct: "C"
                },
                {
                    question: "2 + 2 x 2 = ?",
                    options: ["A. 6", "B. 8", "C. 4", "D. 10"],
                    correct: "A"
                }
            ];
            
            const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
            
            const embed = new EmbedBuilder()
                .setTitle('🧠 Trivia Game')
                .setDescription(`**${randomQuestion.question}**\n\n${randomQuestion.options.join('\n')}\n\n*Trả lời bằng cách nhập A, B, C hoặc D*`)
                .setColor('#0099ff')
                .setFooter({ text: 'Bạn có 15 giây để trả lời!' })
                .setTimestamp();
            
            const response = await interaction.reply({ embeds: [embed] });
            
            const filter = (msg) => {
                return msg.author.id === userId && ['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'].includes(msg.content.toUpperCase());
            };
            
            try {
                const collected = await interaction.channel.awaitMessages({ 
                    filter, 
                    max: 1, 
                    time: 15000, 
                    errors: ['time'] 
                });
                
                const answer = collected.first().content.toUpperCase();
                const correct = answer === randomQuestion.correct;
                
                const resultEmbed = new EmbedBuilder()
                    .setTitle('🧠 Trivia Game - Kết quả')
                    .setDescription(`**${randomQuestion.question}**\n\nĐáp án đúng: **${randomQuestion.correct}**\nBạn trả lời: **${answer}**`)
                    .setColor(correct ? '#00ff00' : '#ff0000')
                    .setTimestamp();
                
                if (correct) {
                    const winAmount = amount * 2;
                    await Database.addBalance(userId, winAmount);
                    await Database.updateStats(userId, 'trivia', true);
                    resultEmbed.addFields({ name: '🎉 Chính xác!', value: `💰 +${winAmount.toLocaleString()} coins (x2)`, inline: false });
                } else {
                    await Database.removeBalance(userId, amount);
                    await Database.updateStats(userId, 'trivia', false);
                    resultEmbed.addFields({ name: '❌ Sai rồi!', value: `💸 -${amount.toLocaleString()} coins`, inline: false });
                }
                
                await response.edit({ embeds: [resultEmbed] });
                
            } catch (error) {
                const timeoutEmbed = new EmbedBuilder()
                    .setTitle('⏰ Hết thời gian!')
                    .setDescription(`Bạn đã không trả lời trong thời gian quy định.\nĐáp án đúng là: **${randomQuestion.correct}**`)
                    .setColor('#ff0000')
                    .addFields({ name: '💸 Thua', value: `-${amount.toLocaleString()} coins`, inline: false })
                    .setTimestamp();
                
                await Database.removeBalance(userId, amount);
                await Database.updateStats(userId, 'trivia', false);
                await response.edit({ embeds: [timeoutEmbed] });
            }
            
        } catch (error) {
            console.error('Trivia command error:', error);
            await interaction.reply({ 
                content: '❌ Có lỗi xảy ra khi chơi trivia!', 
                ephemeral: true 
            });
        }
    }
};