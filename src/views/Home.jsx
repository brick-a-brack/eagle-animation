import React, { Component } from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { CONTRIBUTE_LINK, EA_VERSION, DEFAULT_PATH } from '../config';
import Header from '../components/Header';
import ProjectsList from '../components/ProjectsList';

@observer
class Home extends Component {
    componentDidMount() {
        const { StoreProjects } = this.props;
        StoreProjects.loadProjectsList(DEFAULT_PATH);
    }

    render() {
        const { StoreApp, StoreProject, StoreProjects } = this.props;
        return (
            <div>
                <Header version={EA_VERSION} link={CONTRIBUTE_LINK} />
                <ProjectsList
                    projects={StoreProjects.data.data}
                    onLoad={(path) => {
                        StoreProject.load(path);
                        StoreApp.setAppView('animator');
                    }}
                    onOpen={() => {
                        StoreProject.prompt().then((path) => {
                            if (path) {
                                StoreProject.load(path);
                                StoreApp.setAppView('animator');
                            }
                        });
                    }}
                    onCreate={(name) => {
                        StoreProject.create(DEFAULT_PATH, name);
                        StoreApp.setAppView('animator');
                    }}
                    onRename={(path, name) => {
                        StoreProjects.rename(path, name);
                    }}
                />
            </div>
        );
    }
}

Home.propTypes = {
    StoreProject: PropTypes.object.isRequired,
    StoreProjects: PropTypes.object.isRequired,
    StoreApp: PropTypes.object.isRequired
};

export default Home;
