import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faFolderImage from '@icons/faFolderImage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'];

const extractLastNumber = (filename) => {
  const matches = filename.match(/\d+/g);
  return matches ? parseInt(matches[matches.length - 1], 10) : 0;
};

const ImportOverlay = ({ t, onPictureAdd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const dragCounter = useRef(0);

  const handleFiles = useCallback(
    async (files) => {
      if (isImporting) return;

      const imageFiles = Array.from(files)
        .filter((f) => SUPPORTED_TYPES.includes(f.type))
        .sort((a, b) => extractLastNumber(a.name) - extractLastNumber(b.name));

      if (imageFiles.length === 0) return;

      setIsImporting(true);
      setProgress(0);

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const buffer = await file.arrayBuffer();
        await onPictureAdd({ buffer, type: file.type });
        setProgress((i + 1) / imageFiles.length);
      }

      window.track('frames_imported', { count: imageFiles.length });
      setIsImporting(false);
    },
    [isImporting, onPictureAdd]
  );

  useEffect(() => {
    const onDragEnter = (e) => {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      dragCounter.current++;
      setIsDragging(true);
    };
    const onDragLeave = () => {
      dragCounter.current--;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    };
    const onDragOver = (e) => e.preventDefault();
    const onDrop = (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      if (e.dataTransfer?.files?.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    };

    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);

    return () => {
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [handleFiles]);

  if (!isDragging && !isImporting) return null;

  if (isImporting) {
    return (
      <div className={style.importOverlay}>
        <span className={style.loader} />
        <div className={style.progress}>{Math.min(100, Math.max(0, Math.round(progress * 100)))}%</div>
        <div className={style.info}>{t('Importing frames, please wait...')}</div>
      </div>
    );
  }

  return (
    <div className={style.dropZone}>
      <div className={style.dropZoneInner}>
        <FontAwesomeIcon className={style.dropIcon} icon={faFolderImage} />
        <div className={style.dropText}>{t('Drop images here to import')}</div>
      </div>
    </div>
  );
};

export default withTranslation()(ImportOverlay);
