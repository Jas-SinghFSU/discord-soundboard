import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import AuthProvider from '../../../Contexts/AuthProvider';

import axios from 'axios';
import _ from 'lodash';

import './style.css';

const Login = () => {
    const [joke, setJoke] = useState(null);
    const [serverInfo, setServerInfo] = useState(null);

    const { user } = useContext(AuthProvider.context);
    const navigate = useNavigate();

    const redirectToMainPage = () => {
        if (!_.isEmpty(user)) {
            navigate('/soundboard');
        }
    };

    const getJoke = async () => {
        try {
            const jokeRes = await axios.get(
                'https://official-joke-api.appspot.com/jokes/random'
            );

            setJoke(jokeRes.data);
        } catch (error) {
            console.error(`Failed to get random joke: ${error.message}`);
            setJoke(`Meant to tell you a joke but I can't remember one :( `);
        }
    };

    const getServerInfo = async () => {
        try {
            const serverRes = await axios.get('api/discordserver/');

            setServerInfo(serverRes.data);
        } catch (error) {
            console.error(`Failed to get server info: ${error.message}`);
            setServerInfo({});
        }
    };

    const renderJoke = () => {
        if (joke === null) {
            return null;
        }

        return (
            <div className="login-joke-container">
                <span className="joke-setup">{joke.setup}</span>
                <span className="joke-punchline">{joke.punchline}</span>
            </div>
        );
    };

    const renderCard = () => {
        if (serverInfo === null) {
            return (
                <Card>
                    <CardContent className="login-card">
                        <h2>Please log in with Discord to continue to:</h2>
                        <div className="login-card-server-label-flexbox">
                            <Avatar
                                alt={` `}
                                src={` `}
                                sx={{ width: 100, height: 100 }}
                            />
                            <h3 id="soundboard-server-label">
                                Failed to fetch server name
                            </h3>
                        </div>
                        {renderJoke()}
                        <div className="login-discord-button-container">
                            <Button
                                className="login-discord-button"
                                variant="contained"
                            >
                                Log in with Discord
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
        }
        return (
            <Card>
                <CardContent className="login-card">
                    <h2>Please log in with Discord to continue to:</h2>
                    <div className="login-card-server-label-flexbox">
                        <Avatar
                            alt={`${serverInfo.serverName} icon`}
                            src={`${serverInfo.serverIcon}?size=256`}
                            sx={{ width: 100, height: 100 }}
                        />
                        <span className="server-name-subheading">
                            The Goon Squad Soundboard App
                        </span>
                        <h3 id="login-server-label">{serverInfo.serverName}</h3>
                    </div>
                    {renderJoke()}
                    <div className="login-discord-button-container">
                        <a href="/api/auth/discord">
                            <Button
                                className="login-discord-button"
                                variant="contained"
                            >
                                Log in with Discord
                            </Button>
                        </a>
                    </div>
                </CardContent>
            </Card>
        );
    };

    useEffect(() => {
        getJoke();
        getServerInfo();
    }, []);

    useEffect(() => {
        redirectToMainPage();
    }, [user]);

    return (
        <div className="login-screen-container">
            {renderCard()}
            <span className="login-image-disclaimer">
                <a href="https://www.freepik.com/free-vector/gradient-mountain-landscape_20547362.htm#query=nature&position=0&from_view=keyword&track=sph">
                    Image
                </a>{' '}
                by pikisuperstar on Freepik
            </span>
        </div>
    );
};

export default Login;
