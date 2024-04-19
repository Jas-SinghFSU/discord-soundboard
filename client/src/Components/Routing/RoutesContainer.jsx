import React, { Fragment } from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Soundboard from '../Pages/Soundboard/index';
import Navbar from '../Navbar';

const RoutesContainer = () => {
	return (
		<Fragment>
			<Navbar />
			<Routes>
				<Route
					path="soundboard"
					element={
						<PrivateRoute>
							<Soundboard />
						</PrivateRoute>
					}
				/>
			</Routes>
		</Fragment>
	);
};

export default RoutesContainer;
