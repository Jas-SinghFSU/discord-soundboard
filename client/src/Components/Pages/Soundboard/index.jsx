import React, { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import axios from 'axios';

import PlayerSettings from './PlayerSettings';
import Player from './Player';

import './style.css';

const Soundboard = () => {
    const [serverInfo, setServerInfo] = useState(null);
    const [channelInfo, setChannelInfo] = useState(null);
    const [audioCommands, setAudioCommands] = useState(null);
    const [volume, setVolume] = useState(100);
    const [channel, setChannel] = useState('');
    const [user, setUser] = useState(null);
    const [entryCommand, setEntryCommand] = useState(null);
    const [favorites, setFavorites] = useState([]);

    const allDataPopulated = serverInfo !== null && channelInfo !== null && audioCommands !== null;

    const getSoundboardData = async () => {
        try {
            const serverData = await axios.get(`api/discordserver`);
            const channelData = await axios.get(`api/discordserver/channels/voice`);
            const audioData = await axios.get(`api/audio/commands`);

            setServerInfo(serverData.data);
            setChannelInfo(channelData.data.sort((a, b) => a.rawPosition - b.rawPosition));
            setAudioCommands(
                audioData.data.sort((a, b) => (a.commandName > b.commandName ? 1 : -1))
            );

            setChannel(channelData.data[0].id);
        } catch (error) {
            console.error(`An error occurred while getting soundboard data: ${error.message}`);
        }
    };

    const playAudio = async (fileName) => {
        try {
            const payload = {
                audioCommand: fileName,
                channelId: channel,
                volume: volume,
            };
            await axios.post(`api/audio/play`, payload);
        } catch (error) {
            console.error(`Failed to play the audio file ${fileName}. ${error.message}`);
        }
    };

    const getUserData = async () => {
        try {
            const userInfo = await axios.get('api/user');

            setUser(userInfo.data);
            setVolume(userInfo.data.volume);
            setFavorites(userInfo.data.favorites);

            const userFavAudio = userInfo.data.entryAudio.replace(/\[.*\]/, '');
            setEntryCommand(userFavAudio);
        } catch (err) {
            console.error(`Failed to fetch user info: ${err.message}`);
        }
    };

    const setPlayOnEntry = async (toggleValue) => {
        try {
            await axios.post('api/user/audio/entry', {
                entryToggle: toggleValue,
            });

            getUserData();
        } catch (err) {
            console.error(`Failed to set entry toggle: ${err.message}`);
        }
    };

    const setUserVolume = async (volume) => {
        try {
            await axios.post('api/user/audio/volume', {
                volume: volume,
            });
        } catch (err) {
            console.error(`Failed to set entry toggle: ${err.message}`);
        }
    };

    useEffect(() => {
        getSoundboardData();
        getUserData();
    }, []);

    if (allDataPopulated) {
        return (
            <div className="soundboard">
                <div className="soundboard-content-container">
                    <div className="soundboard-container-flexbox" onContextMenu={(e) => {e.preventDefault()}}>
                        <div className="soundboard-container-server-label-flexbox">
                            <Avatar
                                alt={`${serverInfo.serverName} icon`}
                                src={`${serverInfo.serverIcon}?size=256`}
                                sx={{ width: 100, height: 100 }}
                            />
                            <h2 id="soundboard-server-label">{serverInfo.serverName}</h2>
                        </div>
                        <div className="soundboard-container-controls-flexbox">
                            <PlayerSettings
                                channelName={channel}
                                handleChannel={(e) => {
                                    setChannel(e.target.value);
                                }}
                                channels={channelInfo}
                                user={user}
                                setPlayOnEntry={setPlayOnEntry}
                                setUserVolume={setUserVolume}
                                setVolume={setVolume}
                                volume={volume}
                            />
                        </div>
                        <div className="soundboard-container-player-flexbox">
                            <Player
                                audioCommands={audioCommands}
                                playFile={playAudio}
                                user={user}
                                entryCommand={entryCommand}
                                setEntryCommand={setEntryCommand}
                                setFavorites={setFavorites}
                                favorites={favorites}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default Soundboard;
