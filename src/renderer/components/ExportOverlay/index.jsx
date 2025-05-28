import ActionCard from '@components/ActionCard';
import useProjects from '@hooks/useProjects';
import { useLayoutEffect } from 'react';
import { withTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import IconDone from './assets/done.svg?jsx';
import IconQuit from './assets/quit.svg?jsx';

import * as style from './style.module.css';

const ExportOverlay = ({ t, publicCode = null, onCancel = null, isExporting = false, progress = 0 }) => {
  const { actions: projectsActions } = useProjects();
  const navigate = useNavigate();

  const handleCreateProject = async () => {
    console.log('create project');
    const title = t('New project');
    const project = await projectsActions.create(title);
    navigate(`/animator/${project.id}/0`);
    window.track('project_created', { projectId: project.id });
  };

  useLayoutEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  });

  return (
    <div className={style.background}>
      {onCancel && (
        <div onClick={onCancel} className={style.quit}>
          <IconQuit />
        </div>
      )}
      {isExporting && (
        <>
          <span className={style.loader} />
          <div className={style.progress}>{Math.min(100, Math.max(0, Math.round(progress * 100)))}%</div>
        </>
      )}
      {!isExporting && (
        <div className={style.done}>
          <IconDone />

          {publicCode && <ActionCard className={style.codeValue} onClick={handleCreateProject} title={t('Create new project')} />}
        </div>
      )}
      {publicCode && (
        <div className={style.code}>
          {t("You'll be able to get your film using this code:")}
          <div className={style.codeValue}>
            {publicCode
              .split('')
              .reduce((acc, e, i) => acc + (i && i % 2 === 0 ? ' ' : '') + e, '')
              .trim()}
          </div>
        </div>
      )}
      {isExporting && <div className={style.info}>{t('Export will take a while, please be patient')}</div>}
      {!isExporting && <div className={style.info}>{t('The export is finished, you can close this page')}</div>}
    </div>
  );
};

export default withTranslation()(ExportOverlay);
