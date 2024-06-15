import { isFirefox, isSafari } from '@braintree/browser-detection';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import { LANGUAGES } from '../../config';
import useAppCapabilities from '../../hooks/useAppCapabilities';
import useCamera from '../../hooks/useCamera';
import CustomSlider from '../CustomSlider';
import FormGroup from '../FormGroup';
import FormLayout from '../FormLayout';
import GridIcon from '../GridIcon';
import Heading from '../Heading';
import Input from '../Input';
import MediaStatus from '../MediaStatus';
import NumberInput from '../NumberInput';
import Select from '../Select';
import Switch from '../Switch';

const SettingsForm = ({ settings = {}, onUpdate = () => { }, t }) => {
  const { appCapabilities } = useAppCapabilities();
  const { permissions, actions: cameraActions } = useCamera();
  const form = useForm({
    mode: 'all',
    defaultValues: settings,
  });

  const { watch, setValue, register, getValues, control } = form;

  const formValues = watch();
  useEffect(() => {
    const values = getValues();
    onUpdate(values);
  }, [JSON.stringify(formValues)]);

  const LNGS_OPTIONS = [...LANGUAGES].sort((a, b) => (a.label > b.label ? 1 : -1));

  return (
    <form id="settings">
      <FormLayout title={t('Settings')}>
        <Heading h={1}>{t('Interface')}</Heading>
        <FormGroup label={t('Language')} description={t('The application language to use')}>
          <Select options={LNGS_OPTIONS} control={control} register={register('LANGUAGE')} />
        </FormGroup>

        {(isSafari() || isFirefox()) && (
          <>
            <Heading h={1}>{t('Permissions')}</Heading>
            <MediaStatus
              type={'camera'}
              permission={permissions?.camera}
              action={() => {
                cameraActions.askPermission('camera');
              }}
            />
            <MediaStatus
              title={'microphone'}
              permission={permissions?.microphone}
              action={() => {
                cameraActions.askPermission('microphone');
              }}
            />
          </>
        )}

        <Heading h={1}>{t('Playback')}</Heading>
        <FormGroup label={t('Short play')} description={t('Number of frames to play when short play is enabled')}>
          <NumberInput register={register('SHORT_PLAY')} min={1} />
        </FormGroup>
        <FormGroup label={t('Play from the begining')} description={t('Always play the animation from the first frame')}>
          <div>
            <Switch register={register('PLAY_FROM_BEGINING')} />
          </div>
        </FormGroup>
        <Heading h={1}>{t('Capture')}</Heading>
        <FormGroup label={t('Sound effects')} description={t('Play sound effects when you take or remove a frame')}>
          <div>
            <Switch register={register('SOUNDS')} />
          </div>
        </FormGroup>
        <Heading h={1}>{t('Ratio')}</Heading>
        <FormGroup label={t('Ratio opacity')} description={t('The opacity of aspect ratio layer')}>
          <CustomSlider
            step={0.01}
            min={0}
            max={1}
            value={watch('RATIO_OPACITY')}
            onChange={(value) => {
              setValue('RATIO_OPACITY', value);
            }}
          />
        </FormGroup>
        <Heading h={1}>{t('Grid')}</Heading>
        <FormGroup label={t('Grid modes')} description={t('Grid modes to use for the grid display')}>
          <GridIcon value="GRID" title={t('Classic grid')} register={register('GRID_MODES')} selected={(watch('GRID_MODES') || []).includes('GRID')} />
          <GridIcon value="CENTER" title={t('Center')} register={register('GRID_MODES')} selected={(watch('GRID_MODES') || []).includes('CENTER')} />
          <GridIcon value="MARGINS" title={t('Margins')} register={register('GRID_MODES')} selected={(watch('GRID_MODES') || []).includes('MARGINS')} />
        </FormGroup>
        <FormGroup label={t('Grid opacity')} description={t('The opacity of the grid layer')}>
          <CustomSlider
            step={0.01}
            min={0}
            max={1}
            value={watch('GRID_OPACITY')}
            onChange={(value) => {
              setValue('GRID_OPACITY', value);
            }}
          />
        </FormGroup>
        {watch('GRID_MODES')?.includes('GRID') && (
          <FormGroup label={t('Grid lines')} description={t('Number of lines of the grid layer')}>
            <NumberInput register={register('GRID_LINES')} min={1} max={12} />
          </FormGroup>
        )}
        {watch('GRID_MODES')?.includes('GRID') && (
          <FormGroup label={t('Grid columns')} description={t('Number of columns of the grid layer')}>
            <NumberInput register={register('GRID_COLUMNS')} min={1} max={12} />
          </FormGroup>
        )}
        {appCapabilities.includes('BACKGROUND_SYNC') && (
          <>
            <Heading h={1}>{t('Stop motion workshops')}</Heading>
            <FormGroup label={t('API key to send videos')} description={t('Brick à Brack allows partners to easily export/send videos, contact us for more informations')}>
              <Input control={control} register={register('EVENT_KEY')} />
            </FormGroup>
          </>
        )}
      </FormLayout>
    </form>
  );
};

export default withTranslation()(SettingsForm);
