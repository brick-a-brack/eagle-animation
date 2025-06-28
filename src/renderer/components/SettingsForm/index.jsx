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

const SettingsForm = ({ settings = {}, onUpdate = () => {}, t }) => {
  const { appCapabilities } = useAppCapabilities();
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
      <FormLayout>
        <Heading h={1}>{t('Interface')}</Heading>
        <FormGroup label={t('Language')} description={t('The application language to use')}>
          <Select options={LNGS_OPTIONS} control={control} register={register('LANGUAGE')} />
        </FormGroup>
        <Heading h={1}>{t('Playback')}</Heading>
        <FormGroup label={t('Short play')} description={t('Number of frames to play when short play is enabled')}>
          <NumberInput register={register('SHORT_PLAY')} min={1} />
        </FormGroup>
        <FormGroup label={t('Play from the begining')} description={t('Always play the animation from the first frame')}>
          <div>
            <Switch register={register('PLAY_FROM_BEGINING')} />
          </div>
        </FormGroup>
        <FormGroup label={t('Show live view when looped')} description={t('Display live view when loop mode is active for playback')}>
          <div>
            <Switch register={register('LOOP_SHOW_LIVE')} />
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

        <Heading h={1}>{t('Stop motion workshops')}</Heading>
        {appCapabilities.includes('BACKGROUND_SYNC') && (
          <>
            <FormGroup label={t('API key to send videos')} description={t('Brick à Brack allows partners to easily export/send videos, contact us for more informations')}>
              <Input control={control} register={register('EVENT_KEY')} />
            </FormGroup>
          </>
        )}
        <FormGroup label={t('Recommended number of frames')} description={t('Number of frames allowed before displaying a warning message')}>
          <NumberInput register={register('LIMIT_NUMBER_OF_FRAMES')} min={0} />
        </FormGroup>

        <FormGroup label={t('Recommended activity duration')} description={t('Duration in minutes on the animator page before displaying a warning message')}>
          <NumberInput register={register('LIMIT_ACTIVITY_DURATION')} min={0} />
        </FormGroup>
      </FormLayout>
    </form>
  );
};

export default withTranslation()(SettingsForm);
