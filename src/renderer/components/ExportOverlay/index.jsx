import ActionCard from '@components/ActionCard';
import useProjects from '@hooks/useProjects';
import { useLayoutEffect } from 'react';
import { withTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import IconDone from './assets/done.svg?jsx';
import IconQuit from './assets/quit.svg?jsx';

import * as style from './style.module.css';

const ExportOverlay = ({ t, showNewProjectButton = false, publicCode = null, onCancel = null, isExporting = false, progress = 0 }) => {
  const { actions: projectsActions } = useProjects();
  const navigate = useNavigate();

  const handleCreateProject = async () => {
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
      {isExporting && (
        <div className={`${style.progressContainer} ${!publicCode && style.containerCenter}`}>
          <span className={style.loader} />
          <div className={style.progress}>{Math.min(100, Math.max(0, Math.round(progress * 100)))}%</div>
        </div>
      )}
      {!isExporting && (
        <div className={`${style.doneContainer} ${!publicCode && style.containerCenter}`}>
          <div className={style.done}>
            <IconDone />
          </div>
          {showNewProjectButton && <ActionCard onClick={handleCreateProject} title={t('Create new project')} sizeAuto />}
        </div>
      )}
      {isExporting && <div className={style.info}>{t('Export will take a while, please be patient')}</div>}
      {!isExporting && <div className={style.info}>{t('The export is finished, you can close this page')}</div>}
    </div>
  );
};

export default withTranslation()(ExportOverlay);
