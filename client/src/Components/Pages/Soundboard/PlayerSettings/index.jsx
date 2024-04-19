import React, { Fragment, useEffect } from 'react';

import Slider from '@mui/material/Slider';
import VolumeDown from '@mui/icons-material/VolumeDown';
import VolumeUp from '@mui/icons-material/VolumeUp';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';

import './style.css';

const PlayerSettings = ({
    setVolume,
    volume,
    channelName,
    handleChannel,
    channels,
    user,
    setPlayOnEntry,
    setUserVolume,
}) => {
    const generateChannels = () => {
        const channelElements = channels.map((ch) => {
            return (
                <MenuItem key={ch.id} value={ch.id}>
                    {ch.name}
                </MenuItem>
            );
        });

        return channelElements;
    };

    return (
        <Fragment>
            <div className="entry-toggle-container">
                <Switch
                    checked={user.playOnEntry}
                    onChange={(e) => {
                        setPlayOnEntry(e.target.checked);
                    }}
                />
                <span>Entry</span>
            </div>
            <div className="channel-selector-container">
                <Select
                    labelId="channel-selector-label"
                    id="channel-selector-content"
                    value={channelName}
                    onChange={handleChannel}
                    label="Channel"
                    variant="standard"
                >
                    {generateChannels()}
                </Select>
            </div>
            <Stack
                id="volume-stack"
                spacing={2}
                direction="row"
                sx={{ width: '100%' }}
                alignItems="center"
            >
                <VolumeDown />
                <Slider
                    aria-label="Volume"
                    size="small"
                    value={volume}
                    onChange={(e, v) => {
                        setVolume(v);
                    }}
                    onChangeCommitted={(e, v) => {
                        setUserVolume(v);
                    }}
                    valueLabelDisplay="auto"
                />
                <VolumeUp />
            </Stack>
        </Fragment>
    );
};

export default PlayerSettings;
