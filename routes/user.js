const express = require('express');
const router = express.Router();
const {
    setEntryAudio,
    setPlayOnEntry,
    addCommandToFavorites,
    removeCommandFromFavorites,
    getUserInfo,
    setVolume,
} = require('../Helpers/discordModules');

const { ensureAuth } = require('../Auth/ensureAuth');

router.post('/audio/entry/command', ensureAuth, async (req, res) => {
    logRequest(req, res.locals.user);

    const currentUser = res.locals.user.profileID;
    const commandName = req.body.commandName;

    try {
        const entryCmdRes = await setEntryAudio(currentUser, commandName);

        if (entryCmdRes.status !== 200) {
            return res.status(entryCmdRes.status).send(entryCmdRes.message);
        }
        return res.status(200).send(entryCmdRes.data);
    } catch (error) {
        return res
            .status(500)
            .send(`Failed to set the following audio command as entry: ${error.message}`);
    }
});

router.post('/audio/favorite/', ensureAuth, async (req, res) => {
    logRequest(req, res.locals.user);

    const currentUser = res.locals.user.profileID;
    const commandName = req.body.commandName;

    try {
        const favoriteRes = await addCommandToFavorites(currentUser, commandName);

        if (favoriteRes.status !== 200) {
            return res.status(favoriteRes.status).send(favoriteRes.message);
        }
        return res.status(200).send(favoriteRes.data);
    } catch (error) {
        return res
            .status(500)
            .send(`Failed to set favorite audio command: ${error.message}`);
    }
});

router.delete('/audio/favorite/', ensureAuth, async (req, res) => {
    logRequest(req, res.locals.user);

    const currentUser = res.locals.user.profileID;
    const commandName = req.body.commandName;

    try {
        const favoriteRes = await removeCommandFromFavorites(currentUser, commandName);

        if (favoriteRes.status !== 200) {
            return res.status(favoriteRes.status).send(favoriteRes.message);
        }
        return res.status(200).send(favoriteRes.data);
    } catch (error) {
        return res
            .status(500)
            .send(`Failed to remove favorite audio command: ${error.message}`);
    }
});

router.post('/audio/entry', ensureAuth, async (req, res) => {
    logRequest(req, res.locals.user);

    const currentUser = res.locals.user.profileID;
    const entryToggle = req.body.entryToggle;

    try {
        const entryRes = await setPlayOnEntry(currentUser, entryToggle);

        if (entryRes.status !== 200) {
            return res.status(entryRes.status).send(entryRes.message);
        }
        return res.status(200).send(entryRes.data);
    } catch (error) {
        return res
            .status(500)
            .send(`Failed to toggle entry audio: ${error.message}`);
    }
});

router.post('/audio/volume', ensureAuth, async (req, res) => {
    logRequest(req, res.locals.user);

    const currentUser = res.locals.user.profileID;
    const playerVolume = req.body.volume;

    try {
        const volumeRes = await setVolume(currentUser, playerVolume);

        if (volumeRes.status !== 200) {
            return res.status(volumeRes.status).send(volumeRes.message);
        }
        return res.status(200).send(volumeRes.data);
    } catch (error) {
        return res
            .status(500)
            .send(`Failed to change user volume: ${error.message}`);
    }
});

router.get('/', ensureAuth, async (req, res) => {
    logRequest(req, res.locals.user);

    const currentUser = res.locals.user.profileID;

    try {
        const favoriteRes = await getUserInfo(currentUser);

        if (favoriteRes.status !== 200) {
            return res.status(favoriteRes.status).send(favoriteRes.message);
        }
        return res.status(200).send(favoriteRes.data);
    } catch (error) {
        return res
            .status(500)
            .send(`Failed to get user info: ${error.message}`);
    }
});

module.exports = router;
