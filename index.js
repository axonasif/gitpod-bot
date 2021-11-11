const { Client, Intents, MessageActionRow, MessageButton } = require('discord.js');
const logger = require('pino')({
    level: 'info',
    transport: {
    target: 'pino-pretty'
    },
 });
const client = new Client({
	intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS
	],
});

let token = process.env.TOKEN;
if(!token){
  console.log('Discord TOKEN not set as environment variable.')
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  readline.question('Enter TOKEN: ', inp => {
    console.log(`Recieved: ${inp}`)
    logger.info("Logging in...")
    client.login(inp);
    readline.close();
  });
} else {
  client.login(token);
}
const channels = ['816246578594840586', '879915120510267412', '892384683273388062'];
const automessage = 'Thank you for your question! Someone from the community will be able to help you soon 🧡 In the meantime, if you have any additional context (e.g. screenshots or repo links) it\'d help us all help you faster. 😊';

client.once('ready', () => {
	logger.info(`Logged in as ${client.user.tag}!`);
});

client.on('warn', m => logger.warn(m));

client.on('error', m => logger.error(m));

client.on('messageCreate', async message => {
  if(message.content == `<@!${client.user.id}> close`){
    try {
      const msg = await message.channel.fetchStarterMessage();
      await msg.react('✅');
    } catch(error) {
      logger.error(error);
    }
    try {
      await message.channel.setArchived(true);
    } catch(error) {
      logger.error(error)
    }
    logger.info(`Archived thread: ${message.channel.name}`);
  }

  if (channels.indexOf(message.channelId) > -1 && message.content) {
		try {
      const thread = await message.startThread({
			  name: `"❓- "${message.content.substring(0, 50)}`,
			  autoArchiveDuration: 1440,
			  reason: 'Thread automation'
		  });
		  const row = new MessageActionRow()
			  .addComponents(
				  new MessageButton()
				  .setCustomId('archive')
				  .setLabel('Archive 🔒')
				  .setStyle('SECONDARY'),
			  );
		  await thread.send({
			  content: automessage,
			  components: [row]
		  })
		  logger.info(`Created thread: ${thread.name}`);
    } catch(error) {
      logger.error(error)
    }
	}
});

client.on('threadUpdate', async (thread, thread1) => {
  if (thread.archived == true && thread1.archived == false) {
    const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
				.setCustomId('archive')
				.setLabel('Archive 🔒')
				.setStyle('SECONDARY'),
			);
		try {
      const msg = await thread.fetchStarterMessage();
      await msg.reactions.removeAll();
    } catch(error) {
      logger.error(error);
    }
    try {
      const newthread = await thread1.fetch()
      if(newthread.archived == false){
        await newthread.send({
			    content: 'Thread has been unarchived.',
			    components: [row]
		    });
      }
    } catch(error) {
      logger.error(error);
    
    }
		logger.info(`Unarchived thread: ${thread.name}`);
  }
});

client.on('interactionCreate', async interaction => {
	if (interaction.isButton()) {
		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
				.setCustomId('archived')
				.setLabel('Archived 🔒')
				.setStyle('SECONDARY')
				.setDisabled(true),
			);

		try {
      const msg = await interaction.channel.fetchStarterMessage();
      await msg.react('✅');
    } catch(error) {
      logger.error(error);
    }
    try {
      await interaction.update({
			  components: [row]
		  });
      await interaction.channel.setArchived(true);
    } catch(error) {
      logger.error(error)
    }
		logger.info(`Archived thread: ${interaction.channel.name}`);
	}
});


