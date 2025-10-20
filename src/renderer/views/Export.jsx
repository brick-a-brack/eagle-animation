import { floorResolution, floorResolutionValue, getBestResolution } from '@common/resolution';
import ActionCard from '@components/ActionCard';
import ExportOverlay from '@components/ExportOverlay';
import FormGroup from '@components/FormGroup';
import FormLayout from '@components/FormLayout';
import HeaderBar from '@components/HeaderBar';
import LoadingPage from '@components/LoadingPage';
import NumberInput from '@components/NumberInput';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import Select from '@components/Select';
import Switch from '@components/Switch';
import { ALLOWED_LETTERS } from '@config-web';
import { ExportFrames } from '@core/Export';
import { parseRatio } from '@core/ratio';
import { GetFrameResolutions } from '@core/ResolutionsCache';
import useAppCapabilities from '@hooks/useAppCapabilities';
import useProject from '@hooks/useProject';
import useSettings from '@hooks/useSettings';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import ExportForm from '../forms/ExportForm';

const generateCustomUuid = (length) => {
  const array = new Uint32Array(length);
  self.crypto.getRandomValues(array);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALLOWED_LETTERS[array[i] % ALLOWED_LETTERS.length];
  }
  return out;
};

const Export = ({ t }) => {
  const { id, track } = useParams();
  const navigate = useNavigate();
  const { project, actions: projectActions } = useProject({ id });

  const [isInfosOpened, setIsInfosOpened] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [publicCode, setPublicCode] = useState(null);
  const [resolutions, setResolutions] = useState(null);
  const [frameRenderingProgress, setFrameRenderingProgress] = useState(0);
  const [videoRenderingProgress, setVideoRenderingProgress] = useState(0);
  const [bestResolution, setBestResolution] = useState(null);

  const [searchParams] = useSearchParams();
  const { settings } = useSettings();
  const { appCapabilities } = useAppCapabilities();

  /*const form = useForm({
    mode: 'all',
    defaultValues: {
      mode: 'none',
      format: 'h264',
      imageResolution: 'original',
      videoResolution: null,
      framesFormat: 'original',
      duplicateFramesCopy: true,
      duplicateFramesAuto: false,
      duplicateFramesAutoNumber: 2,
      customOutputFramerate: false,
      customOutputFramerateNumber: 60,
      matchAspectRatio: true,
      compressAsZip: false,
    },
  });*/

  //const { watch, setValue, register, handleSubmit, control } = form;
  const projectRatio = parseRatio(project?.scenes[Number(track)]?.ratio)?.value || null;

  /*
  const framesKey = JSON.stringify(project?.scenes?.[Number(track)]?.pictures);
  useEffect(() => {
    GetFrameResolutions(id, Number(track), project?.scenes?.[Number(track)]?.pictures)
      .then((d) => {
        setResolutions(d);
      })
      .catch((err) => {
        console.error(err);
        setResolutions(null);
      });
  }, [framesKey]);

  useEffect(() => {
    (async () => {
      if (watch('mode') !== 'frames' || watch('matchAspectRatio')) {
        setBestResolution(getBestResolution(project?.scenes?.[Number(track)]?.pictures, resolutions, projectRatio));
      } else {
        setBestResolution(getBestResolution(project?.scenes?.[Number(track)]?.pictures, resolutions));
      }
    })();
  }, [framesKey, projectRatio, watch('matchAspectRatio'), watch('mode'), resolutions]);

  useEffect(() => {
    window.EAEvents('FFMPEG_PROGRESS', (evt, args) => {
      setVideoRenderingProgress(args.progress || 0);
    });
  }, []);

  // Choose the right quality when we have a status change or when resolution array is loaded
  useEffect(() => {
    setValue('imageResolution', imageResolutions.find((e) => e.value === watch('imageResolution'))?.value || imageResolutions.find((e) => e.value !== 'original')?.value || 'original');
    setValue('videoResolution', videoResolutions.find((e) => e.value === watch('videoResolution'))?.value || videoResolutions.find((e) => e.value !== 'original')?.value || 'original');
  }, [watch('mode'), JSON.stringify(videoResolutions), JSON.stringify(imageResolutions)]);

  useEffect(() => {
    (async () => {
      const bestMode = appCapabilities.includes('EXPORT_VIDEO') ? 'video' : appCapabilities.includes('EXPORT_FRAMES') ? 'frames' : appCapabilities.includes('BACKGROUND_SYNC') ? 'send' : 'none';
      if (
        (watch('mode') === 'video' && !appCapabilities.includes('EXPORT_VIDEO')) ||
        (watch('mode') === 'frames' && !appCapabilities.includes('EXPORT_FRAMES')) ||
        (watch('mode') === 'send' && !appCapabilities.includes('BACKGROUND_SYNC')) ||
        watch('mode') === 'none'
      ) {
        setValue('mode', bestMode);
      }
    })();
  }, [appCapabilities]);
*/
  const handleBack = async () => {
    navigate(searchParams.get('back') || '/');
  };

  if (!project || !settings || !bestResolution) {
    return (
      <>
        <LoadingPage show={true} />
        <PageLayout>
          <HeaderBar leftActions={['BACK']} onAction={handleBack} title={t('Export')} withBorder />
          <PageContent></PageContent>
        </PageLayout>
      </>
    );
  }

  const progress = watch('mode') === 'frames' ? Math.min(frameRenderingProgress, 1) : Math.min(frameRenderingProgress / 2, 0.5) + Math.min(videoRenderingProgress / 2, 0.5);

  return (
    <>
      <LoadingPage show={!settings} />
      <PageLayout>
        <HeaderBar leftActions={['BACK']} onAction={handleBack} title={t('Export')} withBorder />
        <PageContent>{settings && <ExportForm />}</PageContent>
      </PageLayout>
      {isInfosOpened && (
        <ExportOverlay
          publicCode={publicCode}
          isExporting={isExporting}
          progress={progress}
          onCancel={() => {
            setIsInfosOpened(false);
            setIsExporting(false);
          }}
        />
      )}
    </>
  );
};

export default withTranslation()(Export);
