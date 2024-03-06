import { CONTRIBUTE_REPOSITORY, VERSION } from '../config';
import Header from '../components/Header';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ProjectsGrid from '../components/ProjectsGrid';
import ProjectCard from '../components/ProjectCard';
import { withTranslation } from 'react-i18next';
import ActionsBar from '../components/ActionsBar';
import DevicesInstance from '../core/Devices';

const HomeView = ({ t }) => {
    const [latestVersion, setLatestVersion] = useState(null);
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            await DevicesInstance.disconnect();
            await DevicesInstance.list();
        })();
    }, []);

    useEffect(() => {
        (async () => {
            setProjects(await window.EA('GET_PROJECTS'));
            window.EA('SYNC');

            // Init camera
            const userSettings = await window.EA('GET_SETTINGS')
            if (userSettings.CAMERA_ID && !DevicesInstance.getMainCamera()) {
                DevicesInstance.setMainCamera(userSettings.CAMERA_ID);
            }
            DevicesInstance.connect();

            // Fetch updates
            setLatestVersion((await window.EA('GET_LAST_VERSION').catch(() => null))?.version || null);
        })();
    }, []);

    const handleCreateProject = async (_, title) => {
        const project = await window.EA('NEW_PROJECT', { title });
        navigate(`/animator/${project.id}/0`);
    }

    const handleOpenProject = async (id) => {
        navigate(`/animator/${id}/0`);
    }

    const handleRenameProject = async (id, title) => {
        await window.EA('RENAME_PROJECT', { project_id: id, title: title || t('Untitled') })
    }

    const handleLink = () => {
        window.EA('OPEN_LINK', { link: `https://github.com/${CONTRIBUTE_REPOSITORY}/releases` })
    }

    const handleAction = (action) => {
        if (action === 'SETTINGS') {
            navigate('/settings?back=/');
        }
    }

    return <>
        <Header action={handleLink} version={VERSION} latestVersion={latestVersion} />
        <ActionsBar actions={['SETTINGS']} position="RIGHT" onAction={handleAction} />
        <ProjectsGrid>
            <ProjectCard placeholder={t('New project')} onClick={handleCreateProject} icon="ADD" />
            {[...projects].sort((a, b) => b.project.updated - a.project.updated).map(e => <ProjectCard key={e.id} id={e.id} title={e.project.title} picture={e.preview} onClick={handleOpenProject} onTitleChange={handleRenameProject} />)}
        </ProjectsGrid>
    </>
}

export default withTranslation()(HomeView);
