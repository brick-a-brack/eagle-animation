import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { withTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import ActionsBar from "../components/ActionsBar";
import ControlBar from "../components/ControlBar";
import KeyboardHandler from "../components/KeyboardHandler";
import Player from "../components/Player";
import Timeline from "../components/Timeline";
import soundDelete from 'url:~/static/sounds/delete.mp3';
import soundShutter from 'url:~/static/sounds/shutter.mp3';
import DevicesInstance from "../core/Devices";
import ActionCard from "../components/ActionCard";

const Export = ({ t }) => {
    const { id, track } = useParams();
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [project, setProject] = useState(null);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        (async () => {
            setProject(await window.EA('GET_PROJECT', { project_id: id }));
            setSettings({
                ...settings,
                ...(await window.EA('GET_SETTINGS'))
            });
        })();
    }, []);

    if (!project || !settings) {
        return null;
    }

    const handleExportFrames = async () => {
        await window.EA('EXPORT', { project_id: id, track_id: track, format: 'frames' })
    }

    const handleExportVideo = async () => {
        await window.EA('EXPORT', { project_id: id, track_id: track, format: 'h264' })
    }

    const handleBack = async () => {
        navigate(searchParams.get('back') || '/')
    }

    return <>
        <ActionsBar actions={['BACK']} onAction={handleBack} />

        {settings && <form id="export">
            <div style={{ display: 'flex', gap: 'var(--space-medium)', justifyContent: 'center' }}>
                <ActionCard type="FRAMES" action={handleExportFrames} />
                <ActionCard type="VIDEO" action={handleExportVideo} />
                <ActionCard type="SEND" action={null} />
            </div>
        </form>}
    </>;
}

export default withTranslation()(Export);
