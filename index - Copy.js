const { Client, GatewayIntentBits, DiscordjsError, User, Constants} = require('discord.js');
const { token } = require('./config.json'); 
const { PermissionsBitField } = require('discord.js');
const { events } = require('./events.json');  
var day = 0;
var mem; 
var sur;   

// guild.roles.everyone.setPermissions([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel]);

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');    
});

 

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName, options } = interaction;
    const guildId = interaction.guild.id;

	if (commandName === 'start') {  
        try{ 
            day = 0;
            const guild = client.guilds.cache.get(guildId);
            const Role = guild.roles.cache.find(role => role.name === 'hunger games'); 
            const all_mem = await guild.members.fetch();
            mem = all_mem.filter(mem => mem._roles.includes(Role.id)).map(mems => mems.id);   
            mem = mem.sort(() => 0.5 - Math.random()); 
            var players = mem_list(mem);
            await interaction.reply({content: `${mem.length} players: ${players}\n/next to start\n/start to refresh players (<@&${Role.id}> role to join)`});  
        }
        catch(err){
            await interaction.reply({content: `"hunger games" role not found!`});
        }
    }

    else if (commandName === 'next'){ 
        day += 1;
        await interaction.reply({content: `Day ${day}`});  
        var temp_events = events;  
        var max_players = Math.max.apply(Math, temp_events.map(function(o) { return o.players; }));  
        sur = [];
        while(mem.length > 0){ 
            if (mem.length < max_players){ 
                temp_events = temp_events.filter(function(el){return el.players <= mem.length});  
                max_players = Math.max.apply(Math, temp_events.map(function(o) { return o.players; }));  
            }
            ev = randomEle(temp_events); 
            temp_player = mem.splice(0, ev['players']);  
            let {desc, surv} = handleEvent(ev, temp_player); 
            sur = sur.concat(surv);
            await interaction.followUp({content: desc});  
        }  
        mem = sur; 
        if (sur.length == 1){   
            content = `<@${sur[0]}> won by surviving till day ${day}\n/start to start a new season`; 
        }
        else if(sur.length == 0){  
            content = `everyone died lol`; 
        }
        else{  
            var players = mem_list(sur);
            content = `${sur.length} survivors on day ${day}:${players}\n/next to continue`; 
        } 
        await interaction.followUp({content: content});   
        
    } 

    else if (commandName === 'spam'){
        const frequency = options.getInteger('frequency');
        const spam_message = options.getString('message') || '';
        const tagged_user = options.getUser('user') || ''; 

        if(spam_message==='' && tagged_user===''){ 
            await interaction.reply({content: `either tag someone or put a message`});
        } 
        else{
            await interaction.reply({content: `frequency: ${frequency}, message:${spam_message}, user:${tagged_user}`});
            for(let i = 0; i < frequency; i++){ 
                await interaction.followUp({content: `${spam_message} ${tagged_user}`});
            }
        }
    }

 
});

function mem_list(arr){
    var mem_list = '';
    arr.forEach(function(m){
        mem_list += `<@${m}> `;
    });
    return mem_list;
}

function randomEle(arr){
    return arr[Math.floor(Math.random()*arr.length)];
}


function handleEvent(ev, temp_player) {  
    desc = ev['desc'];
    surv = [];
    for (let i = 0; i < ev['players']; i++){
        desc = desc.replaceAll(`[${i}]`, temp_player[i]); 
    }  
    ev['sur'].forEach(function(val){ 
        surv.push(temp_player[val]);
    })  
    return {desc, surv};
}
 

// Login to Discord with your client's token
client.login(token);