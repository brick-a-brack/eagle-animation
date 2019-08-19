import React, { Component } from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { CONTRIBUTE_REPOSITORY, EA_VERSION, DEFAULT_PATH } from '../config';
import Header from '../components/Header';
import ProjectsList from '../components/ProjectsList';

@observer
class Home extends Component {
    componentDidMount() {
        const { StoreProjects, StoreApp } = this.props;
        StoreProjects.loadProjectsList(DEFAULT_PATH);
        StoreApp.checkUpdates();
    }

    render() {
        const { StoreApp, StoreProject, StoreProjects } = this.props;
        return (
            <div>
                <Header version={EA_VERSION} link={`https://github.com/${CONTRIBUTE_REPOSITORY}/releases`} canBeUpdated={StoreApp.data.update.available} latestVersion={StoreApp.data.update.version} />
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
