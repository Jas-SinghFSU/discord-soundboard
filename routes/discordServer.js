const express = require('express');
const router = express.Router();
const {
	getVoiceChannels,
	getServerInfo,
} = require('../Helpers/discordModules');

router.get('/channels/voice/', async (req, res) => {
	logRequest(req);

	try {
		const channelData = await getVoiceChannels();
		return res.send(channelData);
	} catch (error) {
		return res
			.status(500)
			.send(`Failed to get voice channels. ${error.message}`);
	}
});

router.get('/', async (req, res) => {
	logRequest(req);

	try {
		const serverData = await getServerInfo();
		return res.send(serverData);
	} catch (error) {
		return res
			.status(500)
			.send(`Failed to get voice channels. ${error.message}`);
	}
});

module.exports = router;
