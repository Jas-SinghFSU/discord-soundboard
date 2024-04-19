const DiscordStrategy = require('passport-discord').Strategy;
const keys = require('./default.json');

const scopes = ['identify'];

const USERS_COLLECTION = database.collection('users');

module.exports = async (passport) => {
    const returnURLString =
        process.env.NODE_ENV === 'production'
            ? 'https://www.thegoonbot.com/api/auth/discord/return'
            : 'http://localhost:3000/api/auth/discord/return';

    passport.use(
        new DiscordStrategy(
            {
                clientID: keys.clientId,
                clientSecret: keys.clientSecret,
                callbackURL: returnURLString,
                scope: scopes,
            },
            async (accessToken, refreshToken, profile, done) => {
                const discordUser = {
                    provider: 'discord',
                    profileID: profile.id,
                    username: profile.username,
                    avatar: profile.avatar,
                    banner: profile.banner,
                    globalName: profile.global_name,
                };

                /**
                 * Check if the newly logged in user exists in the database.
                 * If so, then fetch user info, if not then store user in database.
                 */

                log.debug('Fetching user information from the database');

                try {
                    const userInfo = await USERS_COLLECTION.findOne({
                        profileID: profile.id,
                    });

                    if (userInfo) {
                        log.debug(
                            `Found user in database... ${JSON.stringify(userInfo, null, 2)}`
                        );
                        return done(null, userInfo);
                    }
                } catch (error) {
                    const insertError = `Failed to fetch user from database: ERROR: ${error.message}`;
                    log.error(insertError);
                    return done(insertError);
                }

                try {
                    log.debug('User not found in database, inserting now...');

                    const userToInsert = {
                        ...discordUser,
                        entryAudio: 'hai',
                        volume: 100,
                        playOnEntry: false,
                        favorites: [],
                    }

                    // Create user if one doesn't exist in the database
                    await USERS_COLLECTION.insertOne(userToInsert);

                    log.debug(
                        `User successfully added to database. ${JSON.stringify(userToInsert, null, 2)}`
                    );
                    return done(null, userToInsert);
                } catch (error) {
                    const insertError = `Failed to insert user into database: ERROR: ${error.message}`;
                    log.error(insertError);
                    return done(insertError);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((obj, done) => {
        done(null, obj);
    });
};
