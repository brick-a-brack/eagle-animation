import ActionCard from '@components/ActionCard';
import ExportOverlay from '@components/ExportOverlay';
import FormGroup from '@components/FormGroup';
import FormLayout from '@components/FormLayout';
import HeaderBar from '@components/HeaderBar';
import LoadingPage from '@components/LoadingPage';
import NumberInput from '@components/NumberInput';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import Select from '@components/Select';
import Switch from '@components/Switch';
import { ExportFrames } from '@core/Export';
import { parseRatio } from '@core/ratio';
import { GetFrameResolutions } from '@core/ResolutionsCache';
import useAppCapabilities from '@hooks/useAppCapabilities';
import useProject from '@hooks/useProject';
import useSettings from '@hooks/useSettings';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { floorResolution, floorResolutionValue, getBestResolution } from '@common/resolution';
import { ALLOWED_LETTERS } from '@config-web';

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
  const { project, actions: projectActions } = useProject({ id });

  const [isInfosOpened, setIsInfosOpened] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [publicCode, setPublicCode] = useState(null);
  const [resolutions, setResolutions] = useState(null);
  const [frameRenderingProgress, setFrameRenderingProgress] = useState(0);
  const [videoRenderingProgress, setVideoRenderingProgress] = useState(0);
  const [bestResolution, setBestResolution] = useState(null);

  const [searchParams] = useSearchParams();
  const { settings } = useSettings();
  const { appCapabilities } = useAppCapabilities();

  const form = useForm({
    mode: 'all',
    defaultValues: {
      mode: 'none',
      format: 'h264',
      imageResolution: 'original',
      videoResolution: null,
      framesFormat: 'original',
      duplicateFramesCopy: true,
      duplicateFramesAuto: false,
      duplicateFramesAutoNumber: 2,
      customOutputFramerate: false,
      customOutputFramerateNumber: 60,
      matchAspectRatio: true,
      compressAsZip: false,
    },
  });

  const { watch, setValue, register, handleSubmit, control } = form;
  const projectRatio = parseRatio(project?.scenes[Number(track)]?.ratio)?.value || null;

  const formats = [
    ...(appCapabilities.includes('EXPORT_VIDEO_H264') ? [{ value: 'h264', label: t('H264 (Recommended)') }] : []),
    ...(appCapabilities.includes('EXPORT_VIDEO_HEVC') ? [{ value: 'hevc', label: t('HEVC (.mp4)') }] : []),
    ...(appCapabilities.includes('EXPORT_VIDEO_PRORES') ? [{ value: 'prores', label: t('ProRes (.mov)') }] : []),
    ...(appCapabilities.includes('EXPORT_VIDEO_VP8') ? [{ value: 'vp8', label: t('VP8 (.webm)') }] : []),
    ...(appCapabilities.includes('EXPORT_VIDEO_VP9') ? [{ value: 'vp9', label: t('VP9 (.webm)') }] : []),
  ];

  const videoResolutions = [...new Set([...(bestResolution?.height ? [floorResolutionValue(bestResolution.height)] : []), 2160, 1440, 1080, 720, 480, 360, 240])]
    .filter((height) => !bestResolution || height <= floorResolutionValue(bestResolution?.height))
    .map((e) => ({ value: e, label: t('{{resolution}}p', { resolution: e }) }));

  const imageResolutions = [...new Set(['original', ...(bestResolution?.height ? [floorResolutionValue(bestResolution.height)] : []), 2160, 1440, 1080, 720, 480, 360, 240])]
    .filter((height) => height === 'original' || !bestResolution || height <= floorResolutionValue(bestResolution?.height))
    .map((e) => ({ value: e, label: e === 'original' ? t('Original (Recommended)') : t('{{resolution}}p', { resolution: e }) }));

  const framesFormats = [
    { value: 'original', label: t('Original (Recommended)') },
    { value: 'jpg', label: t('JPEG (.jpg)') },
    { value: 'png', label: t('PNG (.png)') },
    { value: 'webp', label: t('WEBP (.webp)') },
  ];

  const framesKey = JSON.stringify(project?.scenes?.[Number(track)]?.pictures);
  useEffect(() => {
    GetFrameResolutions(id, Number(track), project?.scenes?.[Number(track)]?.pictures)
      .then((d) => {
        setResolutions(d);
      })
      .catch((err) => {
        console.error(err);
        setResolutions(null);
      });
  }, [framesKey]);

  useEffect(() => {
    (async () => {
      if (watch('mode') !== 'frames' || watch('matchAspectRatio')) {
        setBestResolution(getBestResolution(project?.scenes?.[Number(track)]?.pictures, resolutions, projectRatio));
      } else {
        setBestResolution(getBestResolution(project?.scenes?.[Number(track)]?.pictures, resolutions));
      }
    })();
  }, [framesKey, projectRatio, watch('matchAspectRatio'), watch('mode'), resolutions]);

  useEffect(() => {
    window.EAEvents('FFMPEG_PROGRESS', (evt, args) => {
      setVideoRenderingProgress(args.progress || 0);
    });
  }, []);

  // Choose the right quality when we have a status change or when resolution array is loaded
  useEffect(() => {
    setValue('imageResolution', imageResolutions.find((e) => e.value === watch('imageResolution'))?.value || imageResolutions.find((e) => e.value !== 'original')?.value || 'original');
    setValue('videoResolution', videoResolutions.find((e) => e.value === watch('videoResolution'))?.value || videoResolutions.find((e) => e.value !== 'original')?.value || 'original');
  }, [watch('mode'), JSON.stringify(videoResolutions), JSON.stringify(imageResolutions)]);

  useEffect(() => {
    (async () => {
      const bestMode = appCapabilities.includes('EXPORT_VIDEO') ? 'video' : appCapabilities.includes('EXPORT_FRAMES') ? 'frames' : appCapabilities.includes('BACKGROUND_SYNC') ? 'send' : 'none';
      if (
        (watch('mode') === 'video' && !appCapabilities.includes('EXPORT_VIDEO')) ||
        (watch('mode') === 'frames' && !appCapabilities.includes('EXPORT_FRAMES')) ||
        (watch('mode') === 'send' && !appCapabilities.includes('BACKGROUND_SYNC')) ||
        watch('mode') === 'none'
      ) {
        setValue('mode', bestMode);
      }
    })();
  }, [appCapabilities]);

  const handleBack = async () => {
    navigate(searchParams.get('back') || '/');
  };

  if (!project || !settings || !bestResolution) {
    return (
      <>
        <LoadingPage show={true} />
        <PageLayout>
          <HeaderBar leftActions={['BACK']} onAction={handleBack} title={t('Export')} withBorder />
          <PageContent></PageContent>
        </PageLayout>
      </>
    );
  }

  const progress = watch('mode') === 'frames' ? Math.min(frameRenderingProgress, 1) : Math.min(frameRenderingProgress / 2, 0.5) + Math.min(videoRenderingProgress / 2, 0.5);

  const handleExport = async (data) => {
    const files = project.scenes[Number(track)].pictures;

    // Define output resolution
    let resolution = null;
    if (data.mode === 'frames') {
      if (data.imageResolution === 'original') {
        resolution = null;
      } else {
        if (data.matchAspectRatio) {
          resolution = { width: Number(data.imageResolution) * projectRatio, height: Number(data.imageResolution) };
        } else {
          resolution = { width: null, height: Number(data.imageResolution) };
        }
      }
    } else {
      if (projectRatio) {
        resolution = { width: Number(data.videoResolution) * projectRatio, height: Number(data.videoResolution) };
      } else {
        const maxResolution = getBestResolution(files, resolutions);
        resolution = { width: (Number(data.videoResolution) * maxResolution.width) / maxResolution.height, height: Number(data.videoResolution) };
      }
    }

    resolution = floorResolution(resolution);

    setIsInfosOpened(true);
    setIsExporting(true);
    setFrameRenderingProgress(0);
    setVideoRenderingProgress(0);

    const newCode = data.mode === 'send' ? await generateCustomUuid(8) : null;

    if (data.mode === 'send') {
      setPublicCode(newCode);
      if (!project.title) {
        projectActions.rename(newCode);
      }
    }

    // Ask user to define output path
    const outputPath =
      data.mode === 'send'
        ? null
        : await window.EA('EXPORT_SELECT_PATH', {
            type: data.mode === 'video' ? 'FILE' : 'FOLDER',
            format: data.format,
            translations: {
              EXPORT_FRAMES: t('Export animation frames'),
              EXPORT_VIDEO: t('Export as video'),
              DEFAULT_FILE_NAME: t('video'),
              EXT_NAME: t('Video file'),
            },
            compress_as_zip: data.mode === 'frames' ? data.compressAsZip && appCapabilities.includes('EXPORT_FRAMES_ZIP') : false,
          });

    // Cancel if result is null, (dialog closed)
    if (data.mode !== 'send' && outputPath === null) {
      setIsInfosOpened(false);
      setIsExporting(false);
      return;
    }

    const createBuffer = async (bufferId, buffer) => {
      await window.EA('EXPORT_BUFFER', {
        project_id: id,
        buffer_id: bufferId,
        buffer,
      });
    };

    const exportSettings = {
      duplicateFramesCopy: data.duplicateFramesCopy,
      duplicateFramesAuto: data.mode === 'send' ? true : data.duplicateFramesAuto,
      duplicateFramesAutoNumber: data.mode === 'send' ? Math.ceil(project?.scenes?.[Number(track)]?.framerate / 2) : data.duplicateFramesAutoNumber,
      forceFileExtension: data.mode === 'frames' ? (data.framesFormat === 'original' ? undefined : data.framesFormat) : 'jpg',
      resolution,
    };

    // Track export
    window.track('project_exported', { projectId: project.id, ...data, ...exportSettings });

    // Compute all frames
    const frames = await ExportFrames(id, Number(track), files, exportSettings, (p) => setFrameRenderingProgress(p), createBuffer);

    // Save frames / video on the disk
    await window.EA('EXPORT', {
      frames: frames.map(({ mimeType, bufferId, ...e }) => ({ ...e, buffer_id: bufferId, mime_type: mimeType })),
      output_path: outputPath,
      mode: data.mode,
      format: data.format,
      framerate: project?.scenes?.[Number(track)]?.framerate,
      frames_format: data.framesFormat,
      custom_output_framerate: data.customOutputFramerate,
      custom_output_framerate_number: data.customOutputFramerateNumber,
      project_id: id,
      track_id: track,
      event_key: settings.EVENT_KEY,
      public_code: data.mode === 'send' ? newCode : undefined,
      compress_as_zip: data.mode === 'frames' ? data.compressAsZip && appCapabilities.includes('EXPORT_FRAMES_ZIP') : false,
    });

    setIsExporting(false);
  };

  const handleModeChange = (v) => () => {
    setValue('mode', v);
  };

  return (
    <>
      <LoadingPage show={!settings} />
      <PageLayout>
        <HeaderBar leftActions={['BACK']} onAction={handleBack} title={t('Export')} withBorder />
        <PageContent>
          {settings && (
            <form id="export">
              <FormLayout>
                <div style={{ display: 'flex', gap: 'var(--space-medium)', justifyContent: 'center' }}>
                  {appCapabilities.includes('EXPORT_VIDEO') && <ActionCard icon="VIDEO" title={t('Export as video')} onClick={handleModeChange('video')} selected={watch('mode') === 'video'} />}
                  {appCapabilities.includes('EXPORT_FRAMES') && (
                    <ActionCard icon="FRAMES" title={t('Export animation frames')} onClick={handleModeChange('frames')} selected={watch('mode') === 'frames'} />
                  )}
                  {appCapabilities.includes('BACKGROUND_SYNC') && settings.EVENT_KEY && (
                    <ActionCard icon="SEND" title={t('Upload the video')} onClick={handleModeChange('send')} selected={watch('mode') === 'send'} />
                  )}
                </div>

                {['video', 'send'].includes(watch('mode')) && (
                  <FormGroup label={t('Video format')} description={t('The exported video format')}>
                    <Select control={control} options={formats} register={register('format')} />
                  </FormGroup>
                )}

                {watch('mode') === 'frames' && (
                  <FormGroup label={t('Frames format')} description={t('The format of exported frames')}>
                    <Select control={control} options={framesFormats} register={register('framesFormat')} />
                  </FormGroup>
                )}

                {['video', 'send'].includes(watch('mode')) && (
                  <FormGroup label={t('Video resolution')} description={t('The exported video resolution')}>
                    <Select control={control} options={videoResolutions} register={register('videoResolution')} />
                  </FormGroup>
                )}

                {['frames'].includes(watch('mode')) && (
                  <FormGroup label={t('Frames resolution')} description={t('The exported frames resolution')}>
                    <Select control={control} options={imageResolutions} register={register('imageResolution')} />
                  </FormGroup>
                )}

                {watch('mode') === 'frames' && watch('imageResolution') !== 'original' && (
                  <FormGroup label={t('Use project ratio')} description={t('Normalize all the frames to match the project aspect ratio')}>
                    <div>
                      <Switch register={register('matchAspectRatio')} />
                    </div>
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

                {['video', 'frames'].includes(watch('mode')) && (
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
                )}

                {watch('mode') === 'frames' && (
                  <FormGroup label={t('Duplicate frames')} description={t('Copies several times the duplicated frames')}>
                    <div>
                      <Switch register={register('duplicateFramesCopy')} />
                    </div>
                  </FormGroup>
                )}

                {['frames'].includes(watch('mode')) && appCapabilities.includes('EXPORT_FRAMES_ZIP') && (
                  <FormGroup label={t('ZIP')} description={t('Export frames in a ZIP file')}>
                    <Switch register={register('compressAsZip')} />
                  </FormGroup>
                )}

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ActionCard title={t('Export')} onClick={handleSubmit(handleExport)} sizeAuto secondary disabled={isInfosOpened} />
                </div>
              </FormLayout>
            </form>
          )}
        </PageContent>
      </PageLayout>
      {isInfosOpened && (
        <ExportOverlay
          publicCode={publicCode}
          isExporting={isExporting}
          progress={progress}
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
