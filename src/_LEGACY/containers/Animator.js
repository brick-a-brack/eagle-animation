import { connect } from 'react-redux';

import { ActionDeviceLoad, ActionDeviceTakePicture } from '../actions/device';
import { animatorChangeParameter } from '../actions/animator';
import Animator from '../components/views/Animator';

const mapStateToProps = state => ({ project: state.project, device: state.device, animator: state.animator });

const mapDispatchToProps = dispatch => ({
    onInit: (dom) => {
        return dispatch(ActionDeviceLoad(dom));
    },
    onParameterChange: (name, value) => {
        return dispatch(animatorChangeParameter(name, value));
    },
    onTakePicture: () => {
        return dispatch(ActionDeviceTakePicture());
    }
});

const ReduxAnimator = connect(
    mapStateToProps,
    mapDispatchToProps,
)(Animator);

export default ReduxAnimator;
