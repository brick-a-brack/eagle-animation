import { connect } from 'react-redux';

import { ActionProjectList } from '../actions/projects';
import { ActionProjectLoadPrompt,ActionProjectLoadFromPath, ActionProjectCreatePrompt } from '../actions/project';
import Home from '../components/views/Home';

const mapStateToProps = state => ({ projects: state.projects });

const mapDispatchToProps = dispatch => ({
    onInit: () => {
        return dispatch(ActionProjectList());
    },
    onLoad: (path) => {
        return dispatch(ActionProjectLoadFromPath(path));
    },
    onOpen: () => {
        return dispatch(ActionProjectLoadPrompt());
    },
    onCreate: () => {
        return dispatch(ActionProjectCreatePrompt());
    }
});

const ReduxHome = connect(
    mapStateToProps,
    mapDispatchToProps,
)(Home);

export default ReduxHome;
