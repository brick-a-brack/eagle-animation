import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { withTranslation } from 'react-i18next';

import FormGroup from '../components/FormGroup';
import ActionsBar from '../components/ActionsBar';
import Select from '../components/Select';
import Switch from '../components/Switch';
import NumberInput from '../components/NumberInput';
import { useForm } from 'react-hook-form';
import Heading from '../components/Heading';
import CustomSlider from '../components/CustomSlider';
import FormLayout from '../components/FormLayout';
import { DEFAULT_SETTINGS } from '../core/Settings';
import GridIcon from '../components/GridIcon';

import DevicesInstance from "../core/Devices";
import { setLanguage } from '../i18n';
import Input from '../components/Input';
import { LANGUAGES } from '../config';


const SettingsView = ({ t }) => {
    const [searchParams] = useSearchParams();
    const [settings, setSettings] = useState(null);
    const [devices, setDevices] = useState([]);
    const navigate = useNavigate();

    const form = useForm({
        mode: 'all',
        defaultValues: DEFAULT_SETTINGS,
    });

    const {
        watch,
        setValue,
        register,
        getValues,
        control,
    } = form;

    const applySettings = async (values) => {
        if (values.CAMERA_ID) {
            await DevicesInstance.setMainCamera(values.CAMERA_ID)
        }

        if (values.LANGUAGE) {
            setLanguage(values.LANGUAGE);
        }

        if (values.GRID_MODES.length === 0) {
            values.GRID_MODES = ['GRID'];
        }

        setSettings(values);

        Object.keys(values).forEach(name => {
            setValue(name, values[name]);
        })

    }

    useEffect(() => {
        (async () => {
            await DevicesInstance.disconnect();
            setDevices(await DevicesInstance.list());
            const values = await window.EA('GET_SETTINGS');
            applySettings(values)
        })();
    }, []);

    const LNGS_OPTIONS = LANGUAGES.map(e => ({
        ...e,
        label: ['es', 'it', 'pl', 'pt', 'eo'].includes(e.value) ? <>{e.label} {t('(Automated)')}</> : e.label
    }))

    const handleBack = async () => {
        await applySettings(getValues());
        await window.EA('SAVE_SETTINGS', { settings: getValues() });
        navigate(searchParams.get('back') || '/');
    }

    return <>
        <ActionsBar actions={['BACK']} onAction={handleBack} />

        {settings && <form id="settings">
            <FormLayout title={t('Settings')}>
                <Heading h={2}>{t('Capture')}</Heading>
                <FormGroup label={t('Camera')} description={t('The camera device to use to take frames')}>
                    <Select control={control} options={devices.map(e => ({ value: e.id, label: e.label }))} register={register('CAMERA_ID')} />
                </FormGroup>
                <FormGroup label={t('Frames to capture')} description={t('Number of frames to capture')}>
                    <NumberInput register={register('CAPTURE_FRAMES')} min={1} />
                </FormGroup>
                <FormGroup label={t('Frame averaging')} description={t('Frame averaging will take several frames to remove picture noise, camera must be perfectly stable')}>
                    <div style={{ display: 'inline-block' }}><Switch register={register('AVERAGING_ENABLED')} /></div>
                    {watch('AVERAGING_ENABLED') && <div style={{ display: 'inline-block', marginLeft: 'var(--space-big)' }}><NumberInput register={register('AVERAGING_VALUE')} min={2} max={10} /></div>}
                </FormGroup>
                <FormGroup label={t('Improve quality by reducing preview framerate')} description={t('Some cameras can take better quality pictures by reducing the framerate of the preview (Restart required)')}>
                    <div><Switch register={register('FORCE_QUALITY')} /></div>
                </FormGroup>

                <Heading h={1}>{t('Interface')}</Heading>
                <FormGroup label={t('Language')} description={t('The application language to use')}>
                    <Select options={LNGS_OPTIONS} control={control} register={register('LANGUAGE')} />
                </FormGroup>
                <FormGroup label={t('Short play')} description={t('Number of frames to play when short play is enabled')}>
                    <NumberInput register={register('SHORT_PLAY')} min={1} />
                </FormGroup>
                <FormGroup label={t('Sound effects')} description={t('Play sound effects when you take or remove a frame')}>
                    <div><Switch register={register('SOUNDS')} /></div>
                </FormGroup>
                {/*<FormGroup label={t('Ratio opacity')} description={t('The opacity of aspect ratio layer')}>
                    <CustomSlider
                        step={0.01}
                        min={0}
                        max={1}
                        value={watch('RATIO_OPACITY')}
                        onChange={value => { setValue('RATIO_OPACITY', value); }}
                    />
                </FormGroup>*/}
                <Heading h={1}>{t('Grid')}</Heading>
                <FormGroup label={t('Grid modes')} description={t('Grid modes to use for the grid display')}>
                    <GridIcon value="GRID" title={t('Classic grid')} register={register('GRID_MODES')} selected={watch('GRID_MODES').includes('GRID')} />
                    <GridIcon value="CENTER" title={t('Center')} register={register('GRID_MODES')} selected={watch('GRID_MODES').includes('CENTER')} />
                    <GridIcon value="MARGINS" title={t('Margins')} register={register('GRID_MODES')} selected={watch('GRID_MODES').includes('MARGINS')} />
                </FormGroup>
                <FormGroup label={t('Grid opacity')} description={t('The opacity of the grid layer')}>
                    <CustomSlider
                        step={0.01}
                        min={0}
                        max={1}
                        value={watch('GRID_OPACITY')}
                        onChange={value => { setValue('GRID_OPACITY', value); }}
                    />
                </FormGroup>
                {watch('GRID_MODES')?.includes('GRID') && <FormGroup label={t('Grid lines')} description={t('Number of lines of the grid layer')}>
                    <NumberInput register={register('GRID_LINES')} min={1} max={12} />
                </FormGroup>}
                {watch('GRID_MODES')?.includes('GRID') && <FormGroup label={t('Grid columns')} description={t('Number of columns of the grid layer')}>
                    <NumberInput register={register('GRID_COLUMNS')} min={1} max={12} />
                </FormGroup>}
                <Heading h={1}>{t('Stop motion workshops')}</Heading>
                <FormGroup label={t('API key to send videos')} description={t('Brick à Brack allows partners to easily export/send videos, contact us for more informations')}>
                    <Input control={control} register={register('EVENT_KEY')} />
                </FormGroup>
            </FormLayout>
        </form>}
    </>
}

export default withTranslation()(SettingsView);
