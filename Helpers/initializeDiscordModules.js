const { Client, GatewayIntentBits } = require('discord.js');
const { token } = require('../config.json');

const { createAudioPlayer, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');

const {
    playAudio,
    getUserInfo,
    getAudioFileByName,
    extractNameAndFile,
} = require('./discordModules');

/****************************
 *    METHOD DECLARATIONS   *
 ****************************/

const channelTimeout = async () => {
    try {
        const voiceConnection = getVoiceConnection(activeGuildId);
        if (Date.now() > botDisconnectTimer && voiceConnection !== undefined) {
            log.info(`[channelTimeout] Disconnecting the bot`);
            voiceConnection.disconnect();
        }
    } catch (error) {
        log.error(`[channelTimeout] Failed to disconnect. ${error.message}`);
    }
};

/******************************
 *    CLIENT INITIALIZATION   *
 ******************************/

client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

try {
    log.info('Logging into discord client.');

    client.login(token);

    log.info('Discord client logged in successfully.');
} catch (error) {
    log.error(`Discord client failed to log in. Error: ${error.message}`);
}

/****************************
 *  CLIENT EVENT LISTENERS  *
 ****************************/

client.on('ready', () => {
    log.info('Discord client has been initialized successfully.');

    isReady = true;

    // Check channel timeOut status every minute
    setInterval(channelTimeout, gTime.minutes(1));
});

client.on('voiceStateUpdate', async (oldUserState, newUserState) => {
    const userId = newUserState.id.toString();

    // Export this as a function?
    if (userId === botId) {
        currentChannelId = newUserState.channelId; //global var of the bot
        return;
    }

    try {
        //The user event was a channel change and the new channel is the same the bot is currently in
        if (
            oldUserState.channelId !== newUserState.channelId &&
            newUserState.channelId === global.currentChannelId
        ) {
            const userInfo = await getUserInfo(userId);
            log.debug('[voiceStateUpdate] Fetched user:');
            log.debug(JSON.stringify(userInfo, null, 2));

            if (userInfo.status !== 200) {
                log.error(
                    `[voiceStateUpdate] Failed to fetch information for user '${userId}'. ${userInfo.message}`
                );
                return;
            }
            const audioFilePath = extractNameAndFile(userInfo.data.entryAudio);
            const audioFileToPlay = audioFilePath
                ? `${audioFilePath.cmdName}/${audioFilePath.fileName}`
                : getAudioFileByName(userInfo.data.entryAudio).data.fileName;

            log.info(`Playing entry audio for user ${newUserState.id}`); // This may not be the final user id method we implement

            if (userInfo.data.playOnEntry === true) {
                playAudio(audioFileToPlay, newUserState.channelId, userInfo.data.volume); //Not declared here// Volume 1 or 100?
            }
        }
    } catch (err) {
        log.error(`[voiceStateUpdate] The following error occurred: ${err.message}`)
    }
});

/**********************************
 *  AUDIO PLAYER EVENT LISTENERS  *
 **********************************/

log.info('Initializing audioPlayer');
audioPlayer = createAudioPlayer();

audioPlayer.on('error', (err) => {
    log.error(`An error occurred with the audio player. ${err.message}`);
});

audioPlayer.on(AudioPlayerStatus.Playing, () => {
    log.info('The audio player has started playing the requested resource!');
});

audioPlayer.on(AudioPlayerStatus.Idle, () => {
    log.info('The audio player has is now idle.');
    isReady = true;
});
