import Button from '@components/Button';
import CustomSlider from '@components/CustomSlider';
import FormGroup from '@components/FormGroup';
import FormLayout from '@components/FormLayout';
import GridIcon from '@components/GridIcon';
import Heading from '@components/Heading';
import Input from '@components/Input';
import NumberInput from '@components/NumberInput';
import Select from '@components/Select';
import Switch from '@components/Switch';
import { LANGUAGES } from '@config-web';
import useAppCapabilities from '@hooks/useAppCapabilities';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

const ExportForm = ({ bestResolution = null, onSubmit = () => {}, t }) => {
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

  const { watch, setValue, register, getValues, control } = form;

  const handleModeChange = (v) => () => {
    setValue('mode', v);
  };

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

  return (
    <form id="export">
      <FormLayout>
        <div style={{ display: 'flex', gap: 'var(--space-medium)', justifyContent: 'center' }}>
          {appCapabilities.includes('EXPORT_VIDEO') && <ActionCard icon="VIDEO" title={t('Export as video')} onClick={handleModeChange('video')} selected={watch('mode') === 'video'} />}
          {appCapabilities.includes('EXPORT_FRAMES') && <ActionCard icon="FRAMES" title={t('Export animation frames')} onClick={handleModeChange('frames')} selected={watch('mode') === 'frames'} />}
          {appCapabilities.includes('BACKGROUND_SYNC') && settings.EVENT_KEY && settings.EVENT_API && (
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
          <ActionCard title={t('Export')} onClick={handleSubmit(onSubmit)} sizeAuto secondary disabled={isInfosOpened} />
        </div>
      </FormLayout>
    </form>
  );
};

export default withTranslation()(ExportForm);
