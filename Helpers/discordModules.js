const { joinVoiceChannel, createAudioResource } = require('@discordjs/voice');

const { join } = require('node:path');
const fs = require('fs');

const USERS_COLLECTION = database.collection('users');

const extractNameAndFile = (str) => {
    /*
     * Given a commandName and a file path (implies it's a directory),
     * then get the name and store in cmdName, get the file name and store
     * in fileName.
     *
     * Ex: since lailai is a directory and use wants lailai2.mp3, they'd pass
     * 'lailai[lailai2.mp3]' as opposed to a non array command like `hai`
     *
     * Therefor: cmdName = lailai, fileName=lailai2.mp3
     */
    const regex = /^(.*?)\[(.*?)\]$/;
    const match = str.match(regex);

    if (match) {
        return {
            cmdName: match[1],
            fileName: match[2],
        };
    } else {
        return null;
    }
};

/**
 * @memberof discordModules
 * @method playAudio
 * @description Plays an audio file
 *
 * @param {string} audioFile - The path of the audio file to play
 * @param {string} channelId - The ID of the channel to play the audio file in
 * @param {number} volume - The volume of the audio command [0-1]
 */

const playAudio = (audioFile, channelId, volume) => {
    const normalizedVolume = volume / 100;

    log.debug(
        `[playAudio] Playing audio ${audioFile} in channel ${channelId} on volume ${normalizedVolume}.`
    );
    // TODO: Ensure that the user is in the channel where audio is played

    if (!isReady) {
        const playError =
            "The audio player isn't ready yet... it may be playing a command already.";
        log.error(`[playAudio] ${playError}`);
        throw new Error(playError);
    }

    try {
        const connection = joinVoiceChannel({
            channelId,
            guildId: activeGuildId,
            adapterCreator: client.guilds.cache.get(activeGuildId).voiceAdapterCreator,
        });

        subscription = connection.subscribe(audioPlayer);

        currentChannelId = channelId;

        const resourcePath = join(__dirname, `../Audio/${audioFile}`);

        if (!fs.existsSync(resourcePath)) {
            const fileError = `The file "${resourcePath}" doesn't exist`;
            log.error(`[playAudio] ${fileError}`);
            throw new Error(fileError);
        }

        log.debug(`[playAudio] Creating the audio resource for: ${resourcePath}`);

        const resource = createAudioResource(resourcePath, {
            inlineVolume: true,
        });
        log.debug(`[playAudio] Audio resource created...`);
        log.debug(`[playAudio] setting volume...`);
        resource.volume.setVolume(normalizedVolume);
        log.debug(`[playAudio] Volume set...`);

        log.debug(`[playAudio] Resource ${resourcePath} is ready to be played.`);
        isReady = false;
        log.debug(`[playAudio] Playing ${resourcePath}...`);
        audioPlayer.play(resource);

        botDisconnectTimer = Date.now() + gTime.hours(1);
    } catch (err) {
        log.error(`[playAudio] Failed to play audio: ${err.message}.`);
    }
};

/**
 * @memberof discordModules
 * @method getAudioFileNames
 * @description Plays an audio file
 */

const getAudioFileNames = () => {
    try {
        log.debug('[getAudioFileNames] Fetching Audio Resources');
        const audioResourcesPath = join(__dirname, '../Audio');
        const fileNames = fs.readdirSync(audioResourcesPath);
        const audioFilesMetadata = [];

        const directoryNames = fileNames.filter((fileName) =>
            fs.lstatSync(`${audioResourcesPath}/${fileName}`).isDirectory()
        );

        const validAudioFiles = fileNames.filter((fileName) => /^.*\.(mp3|wav)$/.test(fileName));

        validAudioFiles.forEach((fileName) => {
            audioFilesMetadata.push({
                commandName: fileName.replace(/\.[^/.]+$/, '').toLowerCase(),
                commandPath: fileName,
            });
        });

        log.debug('[getAudioFileNames] Fetching Audio Resources for sub-directories');

        for (const directoryName of directoryNames) {
            const directoryResourcesPath = join(__dirname, `../Audio/${directoryName}`);
            const audioFilesInDirectory = fs
                .readdirSync(directoryResourcesPath)
                .filter((fileName) => /^.*\.(mp3|wav)$/.test(fileName));

            audioFilesMetadata.push({
                commandName: directoryName.toLowerCase(),
                commandPaths: audioFilesInDirectory,
            });
        }

        return audioFilesMetadata;
    } catch (error) {
        const errMsg = `An error occurred while fetching audio files. ${error.message}`;
        log.error(`[getAudioFileNames] ${errMsg}`);
        throw new Error(errMsg);
    }
};

/**
 * @memberof discordModules
 * @method getAudioFileNames
 * @description Gets the name of an audio file by name of the command
 *
 * @param {string} commandName - The name of the command (not the name of the audio file)
 */

const getAudioFileByName = (commandName) => {
    log.debug(`[getAudioFileByName] Getting the name of the audio file: ${commandName}`);

    try {
        const audioFiles = getAudioFileNames();

        const foundCommand = audioFiles.find((cmd) => cmd.commandName === commandName);

        if (!foundCommand) {
            return {
                status: 400,
                message: `Failed to find a command by the name: ${commandName}`,
            };
        }

        if (Object.hasOwnProperty.call(foundCommand, 'commandPaths')) {
            const randomIndex = Math.floor(Math.random() * foundCommand.commandPaths.length);

            return {
                status: 200,
                data: {
                    fileName: `${foundCommand.commandName}/${foundCommand.commandPaths[randomIndex]}`,
                },
            };
        }

        return {
            status: 200,
            data: {
                fileName: foundCommand.commandPath,
            },
        };
    } catch (err) {
        return {
            status: 500,
            message: `An error occurred while getting audio file for: ${commandName}`,
        };
    }
};

/**
 * @memberof discordModules
 * @method getVoiceChannels
 * @description Returns a list of all voice channels
 *
 * @returns {object} - The metadata of all voice channels
 */

const getVoiceChannels = async () => {
    const { available: serverStatus, channels: serverChannels } =
        client.guilds.cache.get(activeGuildId);

    if (serverStatus === false) {
        const serverOfflineError = 'The server is not available.';
        log.error(
            `[getVoiceChannels] An error occurred while fetching voice channels: ${serverOfflineError}`
        );
        throw new Error(serverOfflineError);
    }

    try {
        log.debug('[getVoiceChannels] Fetching channel data for server...');

        const channelData = await serverChannels.fetch();

        log.debug('[getVoiceChannels] Successfully fetched channel data.');

        const onlyVoiceChannels = channelData.filter((channel) => channel.type === 2);

        return onlyVoiceChannels;
    } catch (error) {
        const channelFetchFailureMsg = `Failed to fetch channel list. ${error.message}`;

        log.error(`[getVoiceChannels] ${channelFetchFailureMsg}`);
        throw new Error(channelFetchFailureMsg);
    }
};

/**
 * @memberof discordModules
 * @method getServerInfo
 * @description Get information for server such as name, icon, etc.
 *
 * @returns {object} - The metadata of the server
 */

const getServerInfo = async () => {
    try {
        log.debug('[getServerInfo] Fetching server info...');
        const guildMetadata = client.guilds.cache.get(activeGuildId);

        const serverIcon = guildMetadata.iconURL();

        const returnObject = {
            serverId: guildMetadata.id,
            serverName: guildMetadata.name,
            serverIcon,
        };

        return returnObject;
    } catch (error) {
        const errMsg = `Failed to fetch server info. ${error.message}`;
        log.error(`[getServerInfo] ${errMsg}`);
        throw new Error(errMsg);
    }
};

/**
 * @memberof discordModules
 * @method getUserInfo
 * @description Gets the user's metadata and settings
 *
 * @param {string} userId - The ID of the USER who's metadata is being requested
 *
 * @returns { object } - The user's metadata object
 */
const getUserInfo = async (userId) => {
    log.debug(`[getUserInfo] Fetching information for user with ID: ${userId}`);
    try {
        const userData = await USERS_COLLECTION.findOne({ profileID: userId });

        if (!userData) {
            log.info(`Failed to find user with the ID: ${userId}`);

            return {
                status: 400,
                message: `Unable to find user with the ID: ${userId}`,
            };
        }

        return {
            status: 200,
            data: userData,
        };
    } catch (err) {
        const errResponse = `An error occurred while fetching user information: ${err.message}`;
        log.error(errResponse);
        return {
            status: 500,
            message: errResponse,
        };
    }
};

/**
 * @memberof discordModules
 * @method setEntryAudio
 * @description Sets an audio command as the entry audio for the user
 *
 * @param {string} userId - The ID of the USER who's audio to set as entry.
 * @param {string} audioCommand - Name of the audio command to set as entry.
 *
 * @returns { object } - Status of setting an audio command as entry command.
 */
const setEntryAudio = async (userId, audioCommand) => {
    log.info(
        `[setEntryAudio] Setting command '${audioCommand}' as a favorite for user with ID: ${userId}`
    );

    const result = extractNameAndFile(audioCommand);

    let commandName = result ? result.cmdName : audioCommand;
    let fileName = result ? result.fileName : null;

    const audioCommands = getAudioFileNames();

    const foundCommand = audioCommands.find((audioCmd) => audioCmd.commandName === commandName);

    if (!foundCommand) {
        return {
            status: 400,
            message: `The audio command '${audioCommand}' is invalid.`,
        };
    }

    if (result && !foundCommand.commandPaths.includes(fileName)) {
        return {
            status: 400,
            message: `The file specified in the audio command '${audioCommand}' is invalid.`,
        };
    }

    // if user is not found
    try {
        const foundUser = await USERS_COLLECTION.findOne({ profileID: userId });

        if (!foundUser) {
            return {
                status: 400,
                message: `Couldn't find a user with the ID: ${userId}`,
            };
        }
    } catch (err) {
        const errMsg = `[setEntryAudio] An internal error occurred while fetching user information. ${err.message}`;

        log.error(errMsg);
        return {
            status: 500,
            message: errMsg,
        };
    }

    // if user is found
    try {
        log.debug(
            `[setEntryAudio] Setting the favorite audio command to '${audioCommand}' for user with ID: ${userId}`
        );

        await USERS_COLLECTION.updateOne(
            { profileID: userId },
            {
                $set: {
                    entryAudio: audioCommand,
                },
            }
        );

        return {
            status: 200,
            data: `Favorite command successfully set to '${audioCommand}'`,
        };
    } catch (err) {
        const errMsg = `[setEntryAudio] An internal error occurred while updating audio command '${audioCommand}' for user ${userId}. ${err.message}`;

        log.error(errMsg);
        return {
            status: 500,
            message: errMsg,
        };
    }
};

/**
 * @memberof discordModules
 * @method addCommandToFavorites
 * @description Adds an audio command to favorites
 *
 * @param {string} userId - The ID of the USER who's audio command to favorite
 * @param {string} audioCommand - Name of the audio command to to add to favorites
 *
 * @returns { object } - Status of setting an audio command as entry command.
 */
const addCommandToFavorites = async (userId, audioCommand) => {
    log.info(
        `[addCommandToFavorites] Setting command '${audioCommand}' as a favorite for user with ID: ${userId}`
    );

    try {
        const foundUser = await USERS_COLLECTION.findOne({ profileID: userId });

        if (!foundUser) {
            return {
                status: 400,
                message: `Couldn't find a user with the ID: ${userId}`,
            };
        }
    } catch (err) {
        const errMsg = `[addCommandToFavorites] An internal error occurred while fetching user information. ${err.message}`;

        log.error(errMsg);
        return {
            status: 500,
            message: errMsg,
        };
    }

    // if user is found
    try {
        log.debug(
            `[addCommandToFavorites] Setting the favorite audio command to '${audioCommand}' for user with ID: ${userId}`
        );

        const allCommands = getAudioFileNames();
        const commandNames = allCommands.map((cmnd) => cmnd.commandName);

        if (!commandNames.includes(audioCommand)) {
            return {
                status: 400,
                message: `The command '${audioCommand}' doesn't exist.`,
            };
        }

        const userData = await USERS_COLLECTION.findOne({ profileID: userId });

        const currentFavorites = userData.favorites;
        const commandsToAdd = [...new Set([audioCommand, ...currentFavorites])].filter((cmd) =>
            commandNames.includes(cmd)
        );

        await USERS_COLLECTION.updateOne(
            { profileID: userId },
            {
                $set: {
                    favorites: commandsToAdd,
                },
            }
        );

        return {
            status: 200,
            data: `Successfully added the following command to favorites: '${audioCommand}'`,
        };
    } catch (err) {
        const errMsg = `[addCommandToFavorites] An internal error occurred while updating audio command '${audioCommand}' for user ${userId}. ${err.message}`;

        log.error(errMsg);
        return {
            status: 500,
            message: errMsg,
        };
    }
};

/**
 * @memberof discordModules
 * @method removeCommandFromFavorites
 * @description Removes an audio command from favorites
 *
 * @param {string} userId - The ID of the USER who's audio command to unfavorite
 * @param {string} audioCommand - Name of the audio command to remove from favorites
 *
 * @returns { object } - Status of setting an audio command as entry command.
 */
const removeCommandFromFavorites = async (userId, audioCommand) => {
    log.info(
        `[removeCommandFromFavorites] Setting command '${audioCommand}' as a favorite for user with ID: ${userId}`
    );

    try {
        const foundUser = await USERS_COLLECTION.findOne({ profileID: userId });

        if (!foundUser) {
            return {
                status: 400,
                message: `Couldn't find a user with the ID: ${userId}`,
            };
        }
    } catch (err) {
        const errMsg = `[removeCommandFromFavorites] An internal error occurred while fetching user information. ${err.message}`;

        log.error(errMsg);
        return {
            status: 500,
            message: errMsg,
        };
    }

    // if user is found
    try {
        log.debug(
            `[removeCommandFromFavorites] Removing the favorite audio command '${audioCommand}' from favorites for user with ID: ${userId}`
        );
        const userData = await USERS_COLLECTION.findOne({ profileID: userId });

        const currentFavorites = userData.favorites;
        const favoritesAfterRemoval = currentFavorites.filter((fav) => fav !== audioCommand);

        await USERS_COLLECTION.updateOne(
            { profileID: userId },
            {
                $set: {
                    favorites: favoritesAfterRemoval,
                },
            }
        );

        return {
            status: 200,
            data: `Successfully removed the following command from favorites: '${audioCommand}'`,
        };
    } catch (err) {
        const errMsg = `[removeCommandFromFavorites] An internal error occurred while updating audio command '${audioCommand}' for user ${userId}. ${err.message}`;

        log.error(errMsg);
        return {
            status: 500,
            message: errMsg,
        };
    }
};

/**
 * @memberof discordModules
 * @method setPlayOnEntry
 * @description Toggles whether or not to play the favorite audio command upon discord entry.
 *
 * @param {string} userId - The ID of the USER who's entry to toggle
 * @param {boolean} toggleEntryAudio - TRUE|FALSE: Boolean that determines if an entry audio is played
 *
 * @returns { object } - Status of toggling the entry audio command feature.
 */
const setPlayOnEntry = async (userId, toggleEntryAudio) => {
    log.debug(`[setPlayOnEntry] Attempting to update the entry toggle for user with ID: ${userId}`);

    try {
        const updateRes = await USERS_COLLECTION.updateOne(
            { profileID: userId },
            {
                $set: {
                    playOnEntry: toggleEntryAudio,
                },
            }
        );

        if (updateRes.matchedCount === 0) {
            return {
                status: 400,
                message: `Couldn't find user with ID: ${userId}`,
            };
        }

        return {
            status: 200,
            message: `Successfully updated ${updateRes.modifiedCount} documents.`,
        };
    } catch (err) {
        const errMsg = `An internal error occurred while updating entry audio toggle for user with ID: ${userId}. ${err.message}`;
        log.error(errMsg);
        return {
            status: 500,
            message: errMsg,
        };
    }
};

/**
 * @memberof discordModules
 * @method setVolume
 * @description Changes the default volume of the audio player for the specific user.
 *
 * @param {string} userId - The ID of the USER who's volume to change
 * @param {number} volume - The volume of the audio player [0-1]
 *
 * @returns { object } - Status of changing the volume of the player.
 */
const setVolume = async (userId, volume) => {
    log.debug(
        `[setVolume] Attempting to update the default audio volume to ${volume} for user with ID: ${userId}`
    );

    const normalizedVolume =
        typeof volume !== 'number' || volume > 100 || volume < 0 ? 100 : volume;

    try {
        const updateRes = await USERS_COLLECTION.updateOne(
            { profileID: userId },
            {
                $set: {
                    volume: normalizedVolume,
                },
            }
        );

        if (updateRes.matchedCount === 0) {
            return {
                status: 400,
                message: `Couldn't find user with ID: ${userId}`,
            };
        }

        return {
            status: 200,
            message: `Successfully updated ${updateRes.modifiedCount} documents.`,
        };
    } catch (err) {
        const errMsg = `An internal error occurred while updating the default audio volume for user with ID: ${userId}. ${err.message}`;
        log.error(errMsg);
        return {
            status: 500,
            message: errMsg,
        };
    }
};

module.exports = {
    playAudio,
    getVoiceChannels,
    getAudioFileNames,
    getServerInfo,
    getUserInfo,
    setEntryAudio,
    setPlayOnEntry,
    getAudioFileByName,
    extractNameAndFile,
    setVolume,
    addCommandToFavorites,
    removeCommandFromFavorites,
};
