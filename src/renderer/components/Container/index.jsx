import { useEffect } from 'react';
import { withTranslation } from 'react-i18next';
import { TooltipProvider } from 'react-tooltip';

import 'react-tooltip/dist/react-tooltip.css';
import './vars.module.css';
import * as style from './style.module.css';

const Container = ({ children, t }) => {
  useEffect(() => {
    document.title = t('Eagle Animation by Brick à Brack') + ' (Brickfilms.com)';
  });

  return (
    <TooltipProvider>
      <div className={style.container}>{children}</div>
    </TooltipProvider>
  );
};

export default withTranslation()(Container);
