const { Client, GatewayIntentBits, DiscordjsError, User, Constants} = require('discord.js');
const { token } = require('./config.json');
const { PermissionsBitField } = require('discord.js');
const { events } = require('./events.json'); 
const fs = require('fs'); 
const util = require('util');
const exec = util.promisify(require('child_process').exec);

var day = 0;
var mem;
var sur;

// guild.roles.everyone.setPermissions([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel]);

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
    // console.log(fs.existsSync('./videos'));
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
            await interaction.reply({content: `${mem.length} players: ${players}\n/next to start\n/start to refresh players (<@&${Role.id}> role to join)`, allowedMentions: { parse: [] }});
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
            await interaction.followUp({content: desc, allowedMentions: { parse: [] }});
        }

        mem = sur;
        if (sur.length == 1){
            content = `<@${sur[0]}> won by surviving till day ${day}\n/start to start a new season`;
            files = "https://cdn.discordapp.com/avatars/401999000330305536/f5fc0062d717f88cb3dc575379631adc.png?size=2048";
        }
        else if(sur.length == 0){
            content = `everyone died lol`;
            files = "https://cdn.discordapp.com/avatars/401999000330305536/f5fc0062d717f88cb3dc575379631adc.png?size=2048";
        }
        else{
            var players = mem_list(sur);
            content = `${sur.length} survivors on day ${day}:${players}\n/next to continue`;
            files = '';
        }
        if(files.length != 0){
            await interaction.followUp({content: content, "files":[files], allowedMentions: { parse: [] }});
        }
        else{
            await interaction.followUp({content: content, allowedMentions: { parse: [] }});
        } 
    }

    else if (commandName === 'spam'){
        const frequency = options.getInteger('frequency');
        const spam_message = options.getString('message');   
        await interaction.reply({content: `frequency: ${frequency}, message: ${spam_message}, caller: <@${interaction.user.id}>`, allowedMentions: { parse: [] }});
        for(let i = 0; i < frequency; i++){
            await interaction.followUp({content: `${spam_message}`});
        }
        
    }
    else if (commandName === 'download'){  
        const url = options.getString('url');  
        await interaction.reply({content: `Download queued. You will be tagged once the download completes.`});
        let user_id = interaction.user.id; 
        try{ 
            let dl_err = await download(url);   
            console.log(`\ndl_err: ${dl_err}\n`);
            if (dl_err === 'invalid_url'){  
                await interaction.followUp({content: `Invalid url <@${user_id}>`});  
            }
            else if (dl_err === 'file_too_large'){ 
                await interaction.followUp({content: `Video file too large <@${user_id}>`}); 
            }
            else if (dl_err === 'uncatched_cmd_line_err' || dl_err === 'false_success'){ 
                await interaction.followUp({content: `Download failed <@${user_id}>... idk why girl... ask the dev`});  
            }
            else{
                // file = get_vid(user_id);  
                file = `./${dl_err}`;
                await interaction.followUp({content: `<@${user_id}>`, files:[file]});  
                fs.unlinkSync(file); 
            }
        } 
        catch(err){    
            console.log('\n\nNon-shell command error:');
            console.log(err);
            await interaction.followUp({content: `Download failed <@${user_id}>... idk why girl... ask the dev`}); 
        }
    }
});

async function download(url){  
    // if(/youtube.com\/watch.+t=[0-9]+s/.test(url)){
    //     url = reformat_url(url);
    // }
    let shell_cmd = `youtube-dl -f "mp4" --max-filesize "8M" -o "%(title).100s-%(id)s.%(ext)s" --restrict-filenames ${url}`; ///videos/
    
    try{
        const promise = exec(shell_cmd);
        const child = promise.child; 
        child.stdout.on('data', function(data) {
            console.log('stdout: ' + data);
        });
        child.stderr.on('data', function(data) {
            console.log('stderr: ' + data);
        });
        const { stdout, stderr } = await promise;  
        // let last_line = stdout.split(/\r?\n/); 
        if (/100(\.0)?%/.test(stdout)){  //last_line[last_line.length-2]
            dest = stdout.split(/\s+/).filter(dest => /.mp4$/.test(dest));
            return dest;
        }
        else if (/Aborting./.test(stdout)){
            return 'file_too_large';
        }
        else{
            return 'false_success';
        }
    }
    catch(err){  
        console.log(`\n\nshell command error:`);
        console.error(err);
        if (/100(\.0)?%/.test(err['stdout'])){  
            dest = err['stdout'].split(/\s+/).filter(dest => /.mp4$/.test(dest));
            return dest;
        }
        else if (/Aborting./.test(err['stdout'])){
            return 'file_too_large';
        }
        else if(/^WARNING: Could not send HEAD request to/.test(err['stderr'])){
            return 'invalid_url';
        }
        else{ 
            return 'uncatched_cmd_line_err';
        }
    } 
}

function get_vid(user_id){ 
    let files = fs.readdirSync('videos/');  
    console.log(`files: ${files}`);
    let file = files.filter(vid => split_filename(vid) === user_id); 
    return `videos/${file[0]}`;
}

function split_filename(filename){
    let split_file = filename.split('_');
    let file_user_id = split_file[split_file.length-1].split('.')[0];  
    console.log(`file_user_id: ${file_user_id}`);
    return file_user_id;
}

function reformat_url(url){
    url = url.split("t=");
    console.log(url);
    return url.slice(0, -1);
}

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