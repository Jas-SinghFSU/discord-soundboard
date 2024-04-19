import React, { Fragment, useState } from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Menu from '@mui/material/Menu';
import Collapse from '@mui/material/Collapse';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import SpatialAudioIcon from '@mui/icons-material/SpatialAudio';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import GradeIcon from '@mui/icons-material/Grade';
import StarIcon from '@mui/icons-material/Star';

import axios from 'axios';

import './style.css';

const Player = ({
    audioCommands,
    playFile,
    entryCommand,
    setEntryCommand,
    favorites,
    setFavorites,
}) => {
    const [contextMenu, setContextMenu] = useState(null);
    const [contextAudio, setContextAudio] = useState(null);
    const [entrySubmenuOpen, setEntrySubmenuOpen] = useState(false);

    const renderButtons = () => {
        const favoritesList = audioCommands.filter((audioCmd) =>
            favorites.includes(audioCmd.commandName)
        );
        const nonFavoritesList = audioCommands.filter(
            (audioCmd) => !favorites.includes(audioCmd.commandName)
        );

        const sortedCommands = [...favoritesList, ...nonFavoritesList];

        const buttons = sortedCommands.map((audioCmd) => {
            //Define click event, different for folder vs file
            const handleButtonClick = () => {
                if (Object.hasOwnProperty.call(audioCmd, 'commandPaths')) {
                    const randomIndex = Math.floor(
                        Math.random() * (audioCmd.commandPaths.length - 0)
                    );
                    playFile(`${audioCmd.commandName}/${audioCmd.commandPaths[randomIndex]}`);
                } else {
                    playFile(audioCmd.commandPath);
                }
            };

            //Handle right click context menu. ie replace default from browser
            // https://mui.com/material-ui/react-menu/#context-menu
            //This is the creator, menu selection logic in handleClose()

            const handleContextMenu = (event, cmdData) => {
                event.preventDefault();

                closeMenu();

                setContextAudio(cmdData);

                setContextMenu({
                    mouseX: event.clientX + 2,
                    mouseY: event.clientY - 2,
                });
            };

            const isCmdEntry = entryCommand === audioCmd.commandName;

            if (Object.hasOwnProperty.call(audioCmd, 'commandPaths')) {
                return (
                    //Left click, play audio via handlebuttonclick which calls playAudio
                    //Right click open custom context menu
                    <div
                        onContextMenu={(e) => {
                            handleContextMenu(e, audioCmd);
                        }}
                        style={{ cursor: 'context-menu' }}
                        key={audioCmd.commandName}
                    >
                        <Button
                            className={`soundboard-button ${isCmdEntry ? 'pink' : 'purple'}`}
                            variant="contained"
                            onClick={handleButtonClick}
                        >
                            <div className="favorite-star-container">
                                {favorites.includes(audioCmd.commandName) && (
                                    <StarIcon fontSize="5px" />
                                )}
                            </div>
                            {audioCmd.commandName}
                        </Button>
                    </div>
                );

                //Above, for folder directories, here for individual audio file buttons
            } else {
                return (
                    <div
                        onContextMenu={(e) => {
                            handleContextMenu(e, audioCmd);
                        }}
                        style={{ cursor: 'context-menu' }}
                        key={audioCmd.commandName}
                    >
                        <Button
                            className={`soundboard-button ${isCmdEntry ? 'pink' : ''}`}
                            variant="contained"
                            onClick={handleButtonClick}
                        >
                            <div className="favorite-star-container">
                                {favorites.includes(audioCmd.commandName) && (
                                    <StarIcon fontSize="5px" />
                                )}
                            </div>
                            {audioCmd.commandName}
                        </Button>
                    </div>
                );
            }
        });

        return buttons;
    };

    // Handle context menu close, via null or menu selection
    const closeMenu = () => {
        setContextMenu(null);
        setEntrySubmenuOpen(false);
    };

    const setAsEntryCommand = async (cmdPath, cmdFile = null) => {
        try {
            const commandPayload = cmdFile === null ? cmdPath : `${cmdPath}[${cmdFile}]`;

            await axios.post('/api/user/audio/entry/command', {
                commandName: commandPayload,
            });
            setEntryCommand(cmdPath);
        } catch (err) {
            console.error(`An error occurred while setting entry command: ${err.message}`);
        }
        closeMenu();
    };

    const addToFavorites = async (cmdName) => {
        try {
            await axios.post('/api/user/audio/favorite', {
                commandName: cmdName,
            });

            setFavorites([...favorites, cmdName]);
        } catch (err) {
            console.error(`An error occurred while setting favorite: ${err.message}`);
        }
        closeMenu();
    };

    const removeFromFavorites = async (cmdName) => {
        try {
            await axios.delete('/api/user/audio/favorite', {
                data: {
                    commandName: cmdName,
                },
            });

            setFavorites(favorites.filter((fav) => fav !== cmdName));
        } catch (err) {
            console.error(`An error occurred while removing favorite: ${err.message}`);
        }
        closeMenu();
    };

    return (
        <Fragment>
            <div className="player-buttons-container">
                <Stack className="player-buttons-container-stack" direction="row">
                    {renderButtons()}
                </Stack>
            </div>
            {contextMenu !== null ? (
                <Menu
                    variant="menu"
                    className='mui-context-menu'
                    open={contextMenu !== null}
                    onClose={closeMenu}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        contextMenu !== null
                            ? {
                                  top: contextMenu.mouseY,
                                  left: contextMenu.mouseX,
                              }
                            : undefined
                    }
                >
                    {Object.hasOwnProperty.call(contextAudio, 'commandPaths') ? (
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={() => {
                                    setEntrySubmenuOpen(!entrySubmenuOpen);
                                }}
                            >
                                <ListItemIcon>
                                    <SpatialAudioIcon />
                                </ListItemIcon>
                                <ListItemText primary="Set entry sounds" />
                                {entrySubmenuOpen ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>
                        </ListItem>
                    ) : (
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={() => setAsEntryCommand(contextAudio.commandName)}
                            >
                                <ListItemIcon>
                                    <SpatialAudioIcon />
                                </ListItemIcon>
                                <ListItemText primary="Set as entry sound" />
                            </ListItemButton>
                        </ListItem>
                    )}
                    {Object.hasOwnProperty.call(contextAudio, 'commandPaths')
                        ? contextAudio.commandPaths.map((cmd, index) => (
                              <Collapse
                                  in={entrySubmenuOpen}
                                  timeout="auto"
                                  key={index}
                                  unmountOnExit
                              >
                                  <Divider />
                                  <List component="div" disablePadding>
                                      <ListItemButton
                                          sx={{ pl: 4 }}
                                          onClick={() =>
                                              setAsEntryCommand(contextAudio.commandName, cmd)
                                          }
                                      >
                                          <ListItemIcon>
                                              <MusicNoteIcon />
                                          </ListItemIcon>
                                          <ListItemText
                                              primary={cmd.replace(/\.[^/.]+$/, '').toUpperCase()}
                                          />
                                      </ListItemButton>
                                  </List>
                                  <Divider />
                              </Collapse>
                          ))
                        : null}
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => {
                                if (favorites.includes(contextAudio.commandName)) {
                                    removeFromFavorites(contextAudio.commandName);
                                } else {
                                    addToFavorites(contextAudio.commandName);
                                }
                            }}
                        >
                            <ListItemIcon>
                                <GradeIcon />
                            </ListItemIcon>
                            <ListItemText
                                primary={`${favorites.includes(contextAudio.commandName) ? 'Unfavorite' : 'Favorite'}`}
                            />
                        </ListItemButton>
                    </ListItem>
                </Menu>
            ) : null}
        </Fragment>
    );
};

export default Player;
