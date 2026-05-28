import ActionCard from '@components/ActionCard';
import FormGroup from '@components/FormGroup';
import Heading from '@components/Heading';
import Input from '@components/Input';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const ProjectSettingsWindow = ({ t, onProjectSettingsChange = () => {}, onProjectDelete = () => {}, title = '' }) => {
  const form = useForm({
    mode: 'all',
    defaultValues: {
      title,
    },
  });
  const { watch, register, getValues, control } = form;

  const formValues = watch();

  useEffect(() => {
    const values = getValues();
    onProjectSettingsChange({
      title: values.title,
    });
  }, [JSON.stringify(formValues)]);

  return (
    <div className={style.actions}>
      <Heading h={1} className={style.title}>
        {t('Project settings')}
      </Heading>
      <FormGroup label={t('Project title')} description={t('The title of your animation')}>
        <Input maxLength={25} placeholder={t('Title')} control={control} register={register('title')} />
      </FormGroup>
      <FormGroup label={t('Delete')} description={t('Delete the project and all photos taken')}>
        <ActionCard onClick={onProjectDelete} title={t('Delete')} sizeAuto secondary />
      </FormGroup>
    </div>
  );
};

export default withTranslation()(ProjectSettingsWindow);
