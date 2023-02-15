import { useEffect, useState } from "react";
import { withTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";

import ActionsBar from "../components/ActionsBar";
import ActionCard from "../components/ActionCard";
import FormLayout from "../components/FormLayout";
import FormGroup from "../components/FormGroup";
import Select from "../components/Select";
import Switch from "../components/Switch";
import NumberInput from "../components/NumberInput";
import LoadingOverlay from "../components/LoadingOverlay";

const Export = ({ t }) => {
    const { id, track } = useParams();
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [project, setProject] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [searchParams] = useSearchParams();

    const form = useForm({
        mode: 'all',
        defaultValues: {
            mode: 'video',
            format: 'h264',
            resolution: 'original',
            duplicateFramesCopy: true,
            duplicateFramesAuto: false,
            duplicateFramesAutoNumber: 2,
            customOutputFramerate: false,
            customOutputFramerateNumber: 60,
            translations: {
                EXPORT_FRAMES: t('Export animation frames'),
                EXPORT_VIDEO: t('Export as video'),
                DEFAULT_FILE_NAME: t('video'),
                EXT_NAME: t('Video file'),
            }
        },
    });

    const {
        watch,
        setValue,
        register,
        handleSubmit,
        control,
    } = form;

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

    const handleBack = async () => {
        navigate(searchParams.get('back') || '/')
    }

    const handleExport = async (data) => {
        setIsExporting(true);

        await window.EA('EXPORT', {
            ...data,
            project_id: id,
            track_id: track,
        })

        setIsExporting(false);
    }

    const handleModeChange = (v) => () => {
        setValue('mode', v);
    }

    const formats = [
        { value: 'h264', label: t('H264 (Recommended)') },
        { value: 'hevc', label: t('HEVC (.mp4)') },
        { value: 'prores', label: t('ProRes (.mov)') },
        { value: 'vp8', label: t('VP8 (.webm)') },
        { value: 'vp9', label: t('VP9 (.webm)') },
    ];

    const resolutions = ['original', 2160, 1440, 1080, 720, 480, 360]
        .map(e => ({ value: e, label: e === 'original' ? t('Original (Recommended)') : t('{{resolution}}p', { resolution: e }) }))

    return <>
        <ActionsBar actions={['BACK']} onAction={handleBack} />
        {settings && <form id="export">
            <FormLayout title={t('Export')}>
                <div style={{ display: 'flex', gap: 'var(--space-medium)', justifyContent: 'center' }}>
                    <ActionCard icon="VIDEO" title={t('Export as video')} action={handleModeChange('video')} selected={watch('mode') === 'video'} />
                    <ActionCard icon="FRAMES" title={t('Export animation frames')} action={handleModeChange('frames')} selected={watch('mode') === 'frames'} />
                    <ActionCard icon="SEND" title={t('Upload the video')} action={false} disabled selected={watch('mode') === 'send'} />
                </div>

                {['video', 'send'].includes(watch('mode')) && <FormGroup label={t('Video format')} description={t('The exported video format')}>
                    <Select control={control} options={formats} register={register('format')} />
                </FormGroup>}

                {['video', 'send'].includes(watch('mode')) && <FormGroup label={t('Video resolution')} description={t('The exported video resolution')}>
                    <Select control={control} options={resolutions} register={register('resolution')} />
                </FormGroup>}

                {['video', 'send'].includes(watch('mode')) && <FormGroup label={t('Custom video output framerate')} description={t('Change the exported video framerate (This is not your animation framerate)')}>
                    <div style={{ display: 'inline-block' }}><Switch register={register('customOutputFramerate')} /></div>
                    {watch('customOutputFramerate') && <div style={{ display: 'inline-block', marginLeft: 'var(--space-big)' }}><NumberInput register={register('customOutputFramerateNumber')} min={1} max={240} /></div>}
                </FormGroup>}

                <FormGroup label={t('Duplicate first and last frames')} description={t('Automatically duplicate the first and last frames')}>
                    <div style={{ display: 'inline-block' }}><Switch register={register('duplicateFramesAuto')} /></div>
                    {watch('duplicateFramesAuto') && <div style={{ display: 'inline-block', marginLeft: 'var(--space-big)' }}><NumberInput register={register('duplicateFramesAutoNumber')} min={2} max={10} /></div>}
                </FormGroup>

                {watch('mode') === 'frames' && <FormGroup label={t('Duplicate frames')} description={t('Copies several times the duplicated frames')}>
                    <div><Switch register={register('duplicateFramesCopy')} /></div>
                </FormGroup>}

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ActionCard title={t('Export')} action={handleSubmit(handleExport)} sizeAuto secondary disabled={isExporting} />
                </div>
            </FormLayout>
        </form>}
        {isExporting && <LoadingOverlay message={t('Export will take a while, please be patient')} onCancel={() => setIsExporting(false)}/>}
    </>;
}

export default withTranslation()(Export);
