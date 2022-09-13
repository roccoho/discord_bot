const { SlashCommandBuilder, Routes, User, ApplicationCommandOptionType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { clientId, token } = require('./config.json');

const commands = [  
	new SlashCommandBuilder().setName('start').setDescription('Initiates a new season'), 
	new SlashCommandBuilder().setName('next').setDescription('Proceed to the next day'), 
	new SlashCommandBuilder().setName('spam').setDescription('Spams messages/users')
		.addIntegerOption(option=>option.setName('frequency')
			.setDescription('Spams message x times')
			.setRequired(true)) 
		.addStringOption(option=>option.setName('message')
			.setDescription('Spams with message')
			.setRequired(true)), 
	new SlashCommandBuilder().setName('download').setDescription('Downloads video & gifs from twitter/youtube')
			.addStringOption(option=>option.setName('url')
			.setDescription('Video link')
			.setRequired(true)), 
]
	.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationCommands(clientId), { body: commands }) //.applicationGuildCommands(clientId, guildId)
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);