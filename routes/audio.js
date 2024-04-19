const express = require('express');
const router = express.Router();
const { playAudio, getAudioFileNames } = require('../Helpers/discordModules');
const { ensureAuth } = require('../Auth/ensureAuth');

router.post('/play', ensureAuth, async (req, res) => {
    const { audioCommand, channelId, volume = 100 } = req.body;
    global.logRequest(req, res.locals.user);

    try {
        playAudio(audioCommand, channelId, volume);
        return res.send('Play Request Successful');
    } catch (error) {
        return res.status(500).send(`Failed to play audio: ${error.message}`);
    }
});

router.get('/commands/', ensureAuth, async (req, res) => {
    logRequest(req, res.locals.user);

    try {
        const audioFileData = getAudioFileNames();
        return res.send(audioFileData);
    } catch (error) {
        return res
            .status(500)
            .send(`Failed to fetch audio commands: ${error.message}`);
    }
});

module.exports = router;
