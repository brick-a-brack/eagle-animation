import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import { parseRatio } from '../../common/ratio';
import ActionCard from '../ActionCard';
import FormGroup from '../FormGroup';
import Heading from '../Heading';
import Input from '../Input';
import NumberInput from '../NumberInput';
import Select from '../Select';

import * as style from './style.module.css';

const ProjectSettingsWindow = ({ t, onProjectSettingsChange = () => {}, onProjectDelete = () => {}, title = '', fps = 12, ratio = null }) => {
  const RATIOS = [
    { value: '', label: t('Automatic') },
    { value: '4:3', label: '4:3 ' + t('(Old TV)') }, // 1.33
    { value: '16:9', label: '16:9 ' + t('(TV)') }, // 1.77
    { value: '1.85:1', label: '1.85:1 ' + t('(Cinema)') }, // 1.85
    { value: '2.39:1', label: '2.39:1 ' + t('(Cinema)') }, // 2.39
    { value: '1:1', label: '1:1 ' + t('(Square)') }, // 1
    { value: '9:16', label: '9:16 ' + t('(Story)') }, // 0.56
    { value: '3:4', label: '3:4 ' + t('(Social media)') }, // 0.75
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

    onProjectSettingsChange({
      title: values.title,
      fps: values.fps,
      ratio,
    });
  }, [JSON.stringify(formValues)]);

  return (
    <div className={style.actions}>
      <Heading h={1} className={style.title}>
        {t('Project settings')}
      </Heading>
      <FormGroup label={t('Project title')} description={t('The title of your animation')}>
        <Input control={control} register={register('title')} />
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
      <FormGroup label={t('Delete')} description={t('Delete the project and all photos taken')}>
        <ActionCard action={onProjectDelete} className={style.settingsReset} title={t('Delete')} sizeAuto secondary />
      </FormGroup>
    </div>
  );
};

export default withTranslation()(ProjectSettingsWindow);
