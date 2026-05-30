import ActionCard from '@components/ActionCard';
import FormGroup from '@components/FormGroup';
import Heading from '@components/Heading';
import Input from '@components/Input';
import NumberInput from '@components/NumberInput';
import Select from '@components/Select';
import { parseRatio } from '@core/ratio';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const SceneSettingsWindow = ({ t, onSceneSettingsChange = () => {}, onSceneDelete = () => {}, title = '', fps = 12, ratio = null, canDelete = false }) => {
  const RATIOS = [
    { value: '', label: t('Automatic') },
    { value: '4:3', label: '4:3 ' + t('(Old TV)') },
    { value: '16:9', label: '16:9 ' + t('(TV)') },
    { value: '1.85:1', label: '1.85:1 ' + t('(Cinema)') },
    { value: '2.39:1', label: '2.39:1 ' + t('(Cinema)') },
    { value: '1:1', label: '1:1 ' + t('(Square)') },
    { value: '9:16', label: '9:16 ' + t('(Story)') },
    { value: '3:4', label: '3:4 ' + t('(Social media)') },
    { value: 'custom', label: t('Custom') },
  ];

  const form = useForm({
    mode: 'all',
    defaultValues: {
      title,
      fps,
      ratio: ratio ? (RATIOS.find((e) => e.value === ratio) ? ratio : 'custom') : '',
      customRatio: RATIOS.find((e) => e.value === ratio) ? '1.75' : ratio,
    },
  });
  const { watch, register, getValues, setValue, control } = form;

  const formValues = watch();

  useEffect(() => {
    setValue('fps', fps);
  }, [fps]);

  useEffect(() => {
    setValue('title', title);
  }, [title]);

  useEffect(() => {
    const values = getValues();
    let ratio = null;
    if (values.ratio === 'custom') {
      ratio = parseRatio(values.customRatio);
    } else {
      ratio = parseRatio(values.ratio);
    }

    onSceneSettingsChange({
      title: values.title,
      fps: values.fps,
      ratio,
    });
  }, [JSON.stringify(formValues)]);

  return (
    <div className={style.actions}>
      <Heading h={1} className={style.title}>
        {t('Scene settings')}
      </Heading>
      <FormGroup label={t('Scene title')} description={t('The title of this scene')}>
        <Input maxLength={25} placeholder={t('Title')} control={control} register={register('title')} />
      </FormGroup>
      <FormGroup label={t('Animation framerate')} description={t('The framerate used for your animation')}>
        <NumberInput style={{ marginLeft: 'var(--space-big)' }} min={1} max={60} tag={t('FPS')} register={register('fps')} />
      </FormGroup>
      <FormGroup label={t('Aspect ratio')} description={t('The aspect ratio of your animation')}>
        <div style={{ display: 'inline-block' }}>
          <Select options={RATIOS} control={control} register={register('ratio')} />
        </div>
        {watch('ratio') === 'custom' && (
          <div style={{ display: 'inline-block' }}>
            <NumberInput style={{ marginLeft: 'var(--space-big)' }} min={0} max={5} step={0.01} register={register('customRatio')} />
          </div>
        )}
      </FormGroup>
      {canDelete && (
        <FormGroup label={t('Delete scene')} description={t('Delete the scene and all its photos')}>
          <ActionCard onClick={onSceneDelete} title={t('Delete')} sizeAuto secondary />
        </FormGroup>
      )}
    </div>
  );
};

export default withTranslation()(SceneSettingsWindow);
