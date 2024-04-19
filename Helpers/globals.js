const config = require('../config.json');
const initializeGlobals = () => {
	/****************************
	 *      LOGGER GLOBALS      *
	 ****************************/
	global.log = null;

	/****************************
	 *     DATABASE GLOBALS     *
	 ****************************/
	global.database = null;

	/****************************
	 *     DISCORD GLOBALS      *
	 ****************************/
	global.isReady = false;
	global.botDisconnectTimer = 60000;
	global.voiceChannel = null;
	global.currentChannelId = null;
	global.activeGuildId = '208271303126286336';
	global.audioPlayer = null;
	global.client = null;
	global.subscription = null;

	/****************************
	 *      HELPER GLOBALS      *
	 ****************************/
	global.gTime = {
		days: (n) => 1000 * 60 * 60 * 24 * n,
		hours: (n) => 1000 * 60 * 60 * n,
		minutes: (n) => 1000 * 60 * n,
		seconds: (n) => 1000 * n,
	};

	/****************************
	 *       API GLOBALS        *
	 ****************************/
	global.botId = config.appId;
	global.logRequest = (req, user = null) => {
		const userString = user !== null ? ` from user: ${user.profileID}` : '';
		log.info(
			`Processing API Request: [${req.method}] '${req.protocol}://${req.get(
				'host'
			)}${req.originalUrl}'${userString}`
		);
	};
};

module.exports = {
	initializeGlobals,
};
