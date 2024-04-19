import React, { Fragment } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RoutesContainer from './Components/Routing/RoutesContainer';
import AuthProvider from './Contexts/AuthProvider';
import Login from './Components/Pages/Authentication/Login';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import './App.css';

const darkTheme = createTheme({
	palette: {
		mode: 'dark',
	},
});

function App() {
	return (
		<Router>
			<AuthProvider>
				<Fragment>
					<ThemeProvider theme={darkTheme}>
						<CssBaseline />
						<div className="contentContainer">
							<Routes>
								<Route path="/" element={<Login />} />
								<Route path="/*" element={<RoutesContainer />} />
							</Routes>
						</div>
					</ThemeProvider>
				</Fragment>
			</AuthProvider>
		</Router>
	);
}

export default App;
