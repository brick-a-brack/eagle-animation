import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faSlidersUp from '@icons/faSlidersUp';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const ProjectTitle = ({ title = '', onTitleChange = () => {}, onEdit = () => {}, t }) => {
  return (
    <div className={style.title}>
      <input
        spellCheck="false"
        className={style.input}
        type="text"
        defaultValue={title.slice(0, 25)}
        maxLength={25}
        placeholder={t('Untitled project')}
        onChange={(e) => {
          onTitleChange(e.target.value);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      />
      <div className={style.action} onClick={onEdit}>
        <FontAwesomeIcon icon={faSlidersUp} />
      </div>
    </div>
  );
};

export default withTranslation()(ProjectTitle);
