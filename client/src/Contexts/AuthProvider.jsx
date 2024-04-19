import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const context = createContext(null);

function useInterval(callback, delay) {
	const savedCallback = useRef();

	// Remember the latest function.
	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	// Set up the interval.
	useEffect(() => {
		function tick() {
			savedCallback.current();
		}
		if (delay !== null) {
			let id = setInterval(tick, delay);
			return () => clearInterval(id);
		}
	}, [delay]);
}

const UserProvider = ({ children }) => {
	const [user, setUser] = useState(null);

	const getUser = async () => {
		try {
			const userObject = await axios.get('/api/auth');
			setUser(userObject.data);
		} catch (error) {
			console.error('Failed to get user.');
		}
	};

	const handleLogout = async () => {
		try {
			await axios.get('/api/auth/logout');
			setUser({});
		} catch (error) {
			console.error(error);
		}
	};

	// get user every 5 minutes (300,000 ms)
	let userFetchInterval = 5; //in minutes
	userFetchInterval = 1000 * 60 * userFetchInterval;

	useInterval(() => {
		getUser();
	}, userFetchInterval);

	useEffect(() => {
		getUser();
	}, []);

	return (
		<context.Provider value={{ user, logout: handleLogout, getUser }}>
			{children}
		</context.Provider>
	);
};

UserProvider.context = context;

export default UserProvider;
