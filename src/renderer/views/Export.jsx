import { useEffect, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import ActionsBar from '../components/ActionsBar';
import ActionCard from '../components/ActionCard';
import FormLayout from '../components/FormLayout';
import FormGroup from '../components/FormGroup';
import Select from '../components/Select';
import Switch from '../components/Switch';
import NumberInput from '../components/NumberInput';
import LoadingOverlay from '../components/LoadingOverlay';
import { ALLOWED_LETTERS } from '../config';

const generateCustomUuid = (length) => {
  const array = new Uint32Array(length);
  self.crypto.getRandomValues(array);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALLOWED_LETTERS[array[i] % ALLOWED_LETTERS.length];
  }
  return out;
};

const Export = ({ t }) => {
  const { id, track } = useParams();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [project, setProject] = useState(null);
  const [isInfosOpened, setIsInfosOpened] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [publicCode, setPublicCode] = useState(null);
  const [capabilities, setCapabilities] = useState([]);
  const [searchParams] = useSearchParams();

  const form = useForm({
    mode: 'all',
    defaultValues: {
      mode: 'none',
      format: 'h264',
      resolution: 'original',
      duplicateFramesCopy: true,
      duplicateFramesAuto: false,
      duplicateFramesAutoNumber: 2,
      framerate: 12,
      customOutputFramerate: false,
      customOutputFramerateNumber: 60,
    },
  });

  const { watch, setValue, register, handleSubmit, control } = form;

  useEffect(() => {
    (async () => {
      const projectData = await window.EA('GET_PROJECT', { project_id: id });
      setProject(projectData);
      setValue('framerate', projectData.project.scenes[Number(track)].framerate);
      setSettings({
        ...settings,
        ...(await window.EA('GET_SETTINGS')),
      });
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const caps = await window.EA('APP_CAPABILITIES');
      const bestMode = caps.includes('EXPORT_VIDEO') ? 'video' : caps.includes('EXPORT_FRAMES') ? 'frames' : caps.includes('BACKGROUND_SYNC') ? 'send' : 'none';
      if (
        (watch('mode') === 'video' && !caps.includes('EXPORT_VIDEO')) ||
        (watch('mode') === 'frames' && !caps.includes('EXPORT_FRAMES')) ||
        (watch('mode') === 'send' && !caps.includes('BACKGROUND_SYNC')) ||
        watch('mode') === 'none'
      ) {
        setValue('mode', bestMode);
      }

      setCapabilities(caps);
    })();
  }, []);

  if (!project || !settings) {
    return null;
  }

  const handleBack = async () => {
    navigate(searchParams.get('back') || '/');
  };

  const handleExport = async (data) => {
    setIsInfosOpened(true);
    setIsExporting(true);

    const newCode = data.mode === 'send' ? await generateCustomUuid(8) : null;

    if (data.mode === 'send') {
      setPublicCode(newCode);
    }

    await window.EA('EXPORT', {
      mode: data.mode,
      format: data.format,
      resolution: data.resolution,
      duplicate_frames_copy: data.duplicateFramesCopy,
      duplicate_frames_auto: data.duplicateFramesAuto,
      duplicate_frames_auto_number: data.duplicateFramesAutoNumber,
      framerate: data.framerate,
      custom_output_framerate: data.customOutputFramerate,
      custom_output_framerate_number: data.customOutputFramerateNumber,
      project_id: id,
      track_id: track,
      event_key: settings.EVENT_KEY,
      public_code: data.mode === 'send' ? newCode : undefined,
      translations: {
        EXPORT_FRAMES: t('Export animation frames'),
        EXPORT_VIDEO: t('Export as video'),
        DEFAULT_FILE_NAME: t('video'),
        EXT_NAME: t('Video file'),
      },
    });

    if (data.mode !== 'send') {
      setIsInfosOpened(false);
    }

    setIsExporting(false);
  };

  const handleModeChange = (v) => () => {
    setValue('mode', v);
    if (v === 'send') {
      setValue('duplicateFramesAuto', true);
      setValue('duplicateFramesAutoNumber', watch('framerate'));
    }
  };

  const formats = [
    { value: 'h264', label: t('H264 (Recommended)') },
    { value: 'hevc', label: t('HEVC (.mp4)') },
    { value: 'prores', label: t('ProRes (.mov)') },
    { value: 'vp8', label: t('VP8 (.webm)') },
    { value: 'vp9', label: t('VP9 (.webm)') },
  ];

  const resolutions = ['original', 2160, 1440, 1080, 720, 480, 360].map((e) => ({ value: e, label: e === 'original' ? t('Original (Recommended)') : t('{{resolution}}p', { resolution: e }) }));

  return (
    <>
      <ActionsBar actions={['BACK']} onAction={handleBack} />
      {settings && (
        <form id="export">
          <FormLayout title={t('Export')}>
            <div style={{ display: 'flex', gap: 'var(--space-medium)', justifyContent: 'center' }}>
              {capabilities.includes('EXPORT_VIDEO') && <ActionCard icon="VIDEO" title={t('Export as video')} action={handleModeChange('video')} selected={watch('mode') === 'video'} />}
              {capabilities.includes('EXPORT_FRAMES') && <ActionCard icon="FRAMES" title={t('Export animation frames')} action={handleModeChange('frames')} selected={watch('mode') === 'frames'} />}
              {capabilities.includes('BACKGROUND_SYNC') && settings.EVENT_KEY && (
                <ActionCard icon="SEND" title={t('Upload the video')} action={handleModeChange('send')} selected={watch('mode') === 'send'} />
              )}
            </div>

            {['video', 'send'].includes(watch('mode')) && (
              <FormGroup label={t('Video format')} description={t('The exported video format')}>
                <Select control={control} options={formats} register={register('format')} />
              </FormGroup>
            )}

            {['video', 'send'].includes(watch('mode')) && (
              <FormGroup label={t('Video resolution')} description={t('The exported video resolution')}>
                <Select control={control} options={resolutions} register={register('resolution')} />
              </FormGroup>
            )}

            {['video', 'send'].includes(watch('mode')) && (
              <FormGroup label={t('Animation framerate')} description={t('The framerate used for your animation')}>
                <NumberInput register={register('framerate')} min={1} max={240} />
              </FormGroup>
            )}

            {['video', 'send'].includes(watch('mode')) && (
              <FormGroup label={t('Custom video output framerate')} description={t('Change the exported video framerate (This is not your animation framerate)')}>
                <div style={{ display: 'inline-block' }}>
                  <Switch register={register('customOutputFramerate')} />
                </div>
                {watch('customOutputFramerate') && (
                  <div style={{ display: 'inline-block', marginLeft: 'var(--space-big)' }}>
                    <NumberInput register={register('customOutputFramerateNumber')} min={watch('framerate')} max={240} />
                  </div>
                )}
              </FormGroup>
            )}

            <FormGroup label={t('Duplicate first and last frames')} description={t('Automatically duplicate the first and last frames')}>
              <div style={{ display: 'inline-block' }}>
                <Switch register={register('duplicateFramesAuto')} />
              </div>
              {watch('duplicateFramesAuto') && (
                <div style={{ display: 'inline-block', marginLeft: 'var(--space-big)' }}>
                  <NumberInput register={register('duplicateFramesAutoNumber')} min={2} max={10} />
                </div>
              )}
            </FormGroup>

            {watch('mode') === 'frames' && (
              <FormGroup label={t('Duplicate frames')} description={t('Copies several times the duplicated frames')}>
                <div>
                  <Switch register={register('duplicateFramesCopy')} />
                </div>
              </FormGroup>
            )}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ActionCard title={t('Export')} action={handleSubmit(handleExport)} sizeAuto secondary disabled={isInfosOpened} />
            </div>
          </FormLayout>
        </form>
      )}
      {isInfosOpened && (
        <LoadingOverlay
          publicCode={publicCode}
          isExporting={isExporting}
          onCancel={() => {
            setIsInfosOpened(false);
            setIsExporting(false);
          }}
        />
      )}
    </>
  );
};

export default withTranslation()(Export);
