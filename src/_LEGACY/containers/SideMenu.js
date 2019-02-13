import { connect } from 'react-redux';

import { ActionProjectLoadPrompt, ActionProjectCreatePrompt, ActionProjectSave } from '../actions/project';

import SideMenu from '../components/SideMenu/SideMenu';

const mapStateToProps = state => ({ project: (state.project) });

const mapDispatchToProps = dispatch => ({
  eventHandler: (action) => {
    switch (action.type) {
      case 'LOAD_PROJECT':
        return dispatch(ActionProjectLoadPrompt());
      case 'NEW_PROJECT':
        return dispatch(ActionProjectCreatePrompt());
      case 'SAVE_PROJECT':
        return dispatch(ActionProjectSave());
      default:
        return false;
    }
  },
});

const ReduxSideMenu = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SideMenu);

export default ReduxSideMenu;
