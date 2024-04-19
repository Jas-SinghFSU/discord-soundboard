const express = require('express');
const router = express.Router();
const passport = require('passport');
const { ensureNoAuth } = require('../Auth/ensureAuth');

router.get('/', function (req, res) {
	if (res.locals.user) {
		res.json(res.locals.user);
	} else {
		res.json({});
	}
});

router.get(
	'/discord',
	ensureNoAuth,
	passport.authenticate('discord', { failureRedirect: '/' }),
	function (req, res) {
		// If env var is defined then use that otherwise assume dev environment
		const env = process.env.NODE_ENV || 'dev';
		if (env === 'production') {
			return res.redirect('https://www.thegoonbot.com');
		} else {
			return res.redirect('http://localhost:3333');
		}
	}
);

router.get(
	'/discord/return',
	passport.authenticate('discord', {
		failureRedirect: '/',
		session: true,
	}),
	function (req, res) {
		// If env var is defined then use that otherwise assume dev environment
		const env = process.env.NODE_ENV || 'dev';
		req.session.user = req.user;
		if (env === 'production') {
			return res.redirect('https://www.thegoonbot.com/soundboard');
		} else {
			return res.redirect('http://localhost:3333/soundboard');
		}
	}
);

router.get('/logout', (req, res) => {
	req.logout((err) => {
		if (err) {
			return res.status(400).send({ error: `Failed to logout. ${err}` });
		}
		res.json({
			status: 'success',
			data: 'Logout successful.',
		});
	});
});

module.exports = router;
