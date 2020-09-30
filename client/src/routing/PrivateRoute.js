import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Spinner from '../components/layout/Spinner'

const PrivateRoute = ({ component: Component, auth, ...rest }) => (
    <Route {...rest} render={props => 
        auth.loading ? (
            <Spinner />
        ) : auth.isAuthenticated ? (
            <Component {...props} />
        ) : (
            <Redirect to="/login" />
        )
        }
    />


    // <Route {...rest} render={props => !auth.isAuthenticated && !auth.loading ?
    //     (
    //     <Redirect to='/login'></Redirect>
    //     ) : 
    //     (
    //     <Component {...props}></Component>)} />
)

PrivateRoute.propTypes = {
    auth: PropTypes.object.isRequired,
}

const mapStateToProps = state => ({
    auth: state.auth
});

export default connect(mapStateToProps)(PrivateRoute);
