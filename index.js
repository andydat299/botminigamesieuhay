const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
client.slashCommands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith('.js') && !file.includes('broken') && !file.includes('disabled'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            const command = require(filePath);
            
            if ('data' in command && 'execute' in command) {
                client.slashCommands.set(command.data.name, command);
                console.log(`✅ Loaded command: ${command.data.name}`);
            } else {
                console.log(`❌ Command at ${filePath} is missing required "data" or "execute" property.`);
            }
        } catch (error) {
            console.error(`❌ Error loading command ${file}:`, error.message);
        }
    }
}

client.once('ready', async () => {
    console.log(`🤖 Bot đã sẵn sàng! Đăng nhập với tên: ${client.user.tag}`);
    
    // Deploy commands
    if (client.slashCommands.size > 0) {
        const commands = [];
        client.slashCommands.forEach(command => {
            commands.push(command.data.toJSON());
        });
        
        if (process.env.TOKEN) {
            const rest = new REST().setToken(process.env.TOKEN);
            
            try {
                console.log('🔄 Bắt đầu deploy slash commands...');
                
                await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: commands },
                );
                
                console.log('✅ Đã deploy thành công tất cả slash commands!');
            } catch (error) {
                console.error('❌ Lỗi khi deploy commands:', error);
            }
        } else {
            console.log('⚠️ Không tìm thấy TOKEN, bỏ qua việc deploy commands');
        }
    } else {
        console.log('⚠️ Không có command nào để deploy');
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.slashCommands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const errorMessage = '❌ Có lỗi xảy ra khi thực hiện lệnh!';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    } else if (interaction.isButton()) {
        // Xử lý button interactions
        try {
            // Sicbo buttons
            const sicboCommand = client.slashCommands.get('sicbo-new');
            if (sicboCommand && sicboCommand.handleButtonInteraction) {
                const handled = await sicboCommand.handleButtonInteraction(interaction);
                if (handled !== false) return;
            }

            // Mining buttons
            if (interaction.customId === 'mine_hit') {
                const miningCommand = client.slashCommands.get('mining');
                if (miningCommand) {
                    // Mining button được handle trong collector của mining command
                    return;
                }
            }

            // Adventure buttons
            if (interaction.customId.startsWith('boss_')) {
                const adventureCommand = client.slashCommands.get('adventure');
                if (adventureCommand) {
                    // Adventure button được handle trong collector của adventure command
                    return;
                }
            }

        } catch (error) {
            console.error('Button interaction error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Có lỗi xảy ra khi xử lý button!', ephemeral: true });
            }
        }
    } else if (interaction.isModalSubmit()) {
        // Xử lý modal submissions
        try {
            // Sicbo modal
            const sicboCommand = client.slashCommands.get('sicbo-new');
            if (sicboCommand && sicboCommand.handleModalSubmit) {
                const handled = await sicboCommand.handleModalSubmit(interaction);
                if (handled !== false) return;
            }

        } catch (error) {
            console.error('Modal interaction error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Có lỗi xảy ra khi xử lý modal!', ephemeral: true });
            }
        }
    }
});

// Login to Discord with your bot token
client.login(process.env.TOKEN);