import React, { useContext, useState } from 'react';
import AuthProvider from '../../Contexts/AuthProvider';
import { Navigate } from 'react-router-dom';
import _ from 'lodash';

const PrivateRoute = ({ children }) => {
	const { user } = useContext(AuthProvider.context);

	if (user === null) {
		return <div></div>;
	} else if (!_.isEmpty(user)) {
		return children;
	}

	return <Navigate to="/" />;
};

export default PrivateRoute;
