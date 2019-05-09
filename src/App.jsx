import React, { Component } from 'react';
import { observer } from 'mobx-react';
import Container from './components/Container';
import Animator from './views/Animator';
import Home from './views/Home';

import {
    App as ObservableAppStore,
    Project as ObservableProjectStore,
    Projects as ObservableProjectsStore,
    Animator as ObservableAnimatorStore,
    Device as ObservableDeviceStore
} from './store';

@observer
class App extends Component {
    render() {
        return (
            <Container>
                {ObservableAppStore.data.view === 'home' && (
                    <Home
                        StoreProjects={ObservableProjectsStore}
                        StoreProject={ObservableProjectStore}
                        StoreApp={ObservableAppStore}
                    />
                )}
                {ObservableAppStore.data.view === 'animator' && (
                    <Animator
                        StoreProject={ObservableProjectStore}
                        StoreApp={ObservableAppStore}
                        StoreDevice={ObservableDeviceStore}
                        StoreAnimator={ObservableAnimatorStore}
                    />
                )}
            </Container>
        );
    }
}

export default App;
