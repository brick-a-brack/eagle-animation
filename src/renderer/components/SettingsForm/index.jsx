import Button from '@components/Button';
import ButtonsGroup from '@components/ButtonsGroup';
import CustomSlider from '@components/CustomSlider';
import Divider from '@components/Divider';
import FormGroup from '@components/FormGroup';
import FormLayout from '@components/FormLayout';
import GridRatioPreview from '@components/GridRatioPreview';
import Heading from '@components/Heading';
import Input from '@components/Input';
import NumberInput from '@components/NumberInput';
import OscHelpWindow from '@components/OscHelpWindow';
import Select from '@components/Select';
import Switch from '@components/Switch';
import Window from '@components/Window';
import { LANGUAGES, TOUCAN_CAMERA_SERVER_AVAILABLE } from '@config-web';
import { formatFileSize } from '@core/format';
import useAppCapabilities from '@hooks/useAppCapabilities';
import useAppVersion from '@hooks/useAppVersion';
import useCache from '@hooks/useCache';
import useDataFolder from '@hooks/useDataFolder';
import useOscStatus from '@hooks/useOscStatus';
import useToucanCameraServer from '@hooks/useToucanCameraServer';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import gridCenterIcon from './assets/center.png';
import gridBasicIcon from './assets/grid.png';
import gridMarginsIcon from './assets/margins.png';

import * as style from './style.module.css';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];

const SettingsForm = ({ settings = {}, onUpdate = () => {}, t }) => {
  const { appCapabilities } = useAppCapabilities();
  const { path: dataFolderPath, actions: dataFolderActions } = useDataFolder();
  const { currentVersion, latestVersion, canBeUpdated, actions: appVersionActions } = useAppVersion();
  const { size: cacheSize, isClearing: isClearingCache, actions: cacheActions } = useCache(appCapabilities.includes('CLEAR_CACHE'));
  const { config: toucanCameraServerConfig } = useToucanCameraServer();
  const { status: oscStatus } = useOscStatus(appCapabilities.includes('OSC'));
  const [showOscHelp, setShowOscHelp] = useState(false);
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

  // Two apps can't bind the same port on one machine, so equal ports only work with a remote target
  const oscPortsConflict = Number(watch('OSC_LISTEN_PORT')) === Number(watch('OSC_TARGET_PORT')) && LOCAL_HOSTS.includes(`${watch('OSC_TARGET_HOST') || ''}`.trim().toLowerCase());

  const oscStatusLabel = {
    DISABLED: t('Disabled'),
    STARTING: t('Starting…'),
    LISTENING: t('Listening on {{addresses}}', { addresses: (oscStatus?.addresses || []).join(', ') || '-' }),
    ERROR: t('Error: {{message}}', { message: oscStatus?.message || t('Unknown') }),
  }[oscStatus?.state || 'DISABLED'];

  const toggleGridMode = (mode) => {
    const currentModes = watch('GRID_MODES') || [];
    const newModes = currentModes.includes(mode) ? currentModes.filter((m) => m !== mode) : [...currentModes, mode];
    setValue('GRID_MODES', newModes);
  };

  return (
    <form id="settings">
      <FormLayout>
        <Heading h={1}>{t('General')}</Heading>

        <FormGroup label={t('Language')} description={t('The application language to use')}>
          <Select options={LNGS_OPTIONS} control={control} register={register('LANGUAGE')} />
        </FormGroup>
        <FormGroup label={t('Allow telemetry')} description={t('Send anonymous usage data to help improve the application')}>
          <div>
            <Switch register={register('TELEMETRY_ENABLED')} />
          </div>
        </FormGroup>
        <FormGroup label={t('Update')} description={t('Stay up to date to enjoy the latest features and improvements')}>
          <Button
            size="small"
            color="primary"
            disabled={!canBeUpdated}
            onClick={canBeUpdated ? appVersionActions.openUpdatePage : undefined}
            label={canBeUpdated ? t('Update to {{version}}', { version: latestVersion }) : t('Already up to date ({{version}})', { version: currentVersion || t('Unknown') })}
          />
        </FormGroup>
        {appCapabilities.includes('LOCAL_DATA_FOLDER') && (
          <FormGroup label={t('Data folder')} description={dataFolderPath || t('(Unknown)')}>
            <Button size="small" label={t('Open folder')} onClick={dataFolderActions.openDataFolder} />
          </FormGroup>
        )}
        {appCapabilities.includes('CLEAR_CACHE') && (
          <FormGroup label={t('Cache')} description={t("The cache is there to improve the application's performance and can be safely deleted")}>
            <div>
              <Button
                size="small"
                disabled={isClearingCache || cacheSize === 0}
                onClick={cacheActions.clearCache}
                label={isClearingCache ? t('Clearing cache…') : cacheSize === null ? t('Clear cache') : t('Clear cache ({{size}})', { size: formatFileSize(cacheSize) })}
              />
            </div>
          </FormGroup>
        )}
        <FormGroup label={t('Tutorial')} description={t('Reset the tutorial, it will be shown on the next visit')}>
          <div>
            <Button size="small" label={t('Reset')} disabled={(watch('TOURS_COMPLETED') || []).length === 0} onClick={() => setValue('TOURS_COMPLETED', [])} />
          </div>
        </FormGroup>

        <Divider />

        <Heading h={1}>{t('Playback and navigation')}</Heading>

        <FormGroup label={t('Default framerate')} description={t('Framerate used for new projects')}>
          <NumberInput register={register('DEFAULT_FPS')} min={1} max={60} tag={t('FPS')} />
        </FormGroup>
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
        <FormGroup label={t('Skip hidden frames on navigation')} description={t('Skip hidden frames when navigating through the animation using keyboard')}>
          <div>
            <Switch register={register('SKIP_HIDDEN_FRAMES')} />
          </div>
        </FormGroup>

        <Divider />

        <Heading h={1}>{t('Capture')}</Heading>

        <FormGroup label={t('Sound effects')} description={t('Play sound effects when you take or remove a frame')}>
          <div>
            <Switch register={register('SOUNDS')} />
          </div>
        </FormGroup>
        {TOUCAN_CAMERA_SERVER_AVAILABLE && (
          <>
            <FormGroup label={t('Use camera compatibility mode')} description={t('Disables DSLR and remote cameras, may limit available camera settings')}>
              <div>
                <Switch register={register('TOUCAN_CAMERA_SERVER_DISABLED')} />
              </div>
            </FormGroup>
            <FormGroup
              label={t('Share cameras')}
              description={
                toucanCameraServerConfig?.expose && toucanCameraServerConfig?.port
                  ? t('Expose the cameras so they can be used from other devices ({{hostname}}:{{port}}, using {{token}})', {
                      hostname: toucanCameraServerConfig.shareHostname || toucanCameraServerConfig.hostname,
                      port: toucanCameraServerConfig.port,
                      token: toucanCameraServerConfig.token,
                    })
                  : t('Expose the cameras so they can be used from other devices')
              }
            >
              <div>
                <Switch register={register('TOUCAN_CAMERA_SERVER_EXPOSE')} disabled={watch('TOUCAN_CAMERA_SERVER_DISABLED')} />
              </div>
            </FormGroup>
          </>
        )}

        <Divider />

        <Heading h={1}>{t('Grid and ratio')}</Heading>

        <FormGroup label={t('Preview')} description={t('Preview of your grid and ratio settings')} labelPosition="top">
          <GridRatioPreview
            gridModes={watch('GRID_MODES')}
            gridOpacity={parseFloat(watch('GRID_OPACITY'))}
            gridColumns={Number(watch('GRID_COLUMNS'))}
            gridLines={Number(watch('GRID_LINES'))}
            ratioLayerOpacity={parseFloat(watch('RATIO_OPACITY'))}
          />
        </FormGroup>

        <FormGroup label={t('Grid modes')} description={t('Grid modes to use for the grid display')}>
          <ButtonsGroup
            actions={[
              {
                title: t('Classic grid'),
                onClick: () => toggleGridMode('GRID'),
                icon: gridBasicIcon,
                selected: (watch('GRID_MODES') || []).includes('GRID'),
                warning: Number(watch('GRID_COLUMNS')) === 0 && Number(watch('GRID_LINES')) === 0 ? t('Grid will not display with current settings') : '',
              },
              {
                title: t('Center'),
                onClick: () => toggleGridMode('CENTER'),
                icon: gridCenterIcon,
                selected: (watch('GRID_MODES') || []).includes('CENTER'),
              },
              {
                title: t('Margins'),
                onClick: () => toggleGridMode('MARGINS'),
                icon: gridMarginsIcon,
                selected: (watch('GRID_MODES') || []).includes('MARGINS'),
              },
            ]}
            merge={true}
          />
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
          <FormGroup label={t('Grid rows')} description={t('Number of rows of the grid layer')}>
            <NumberInput register={register('GRID_LINES')} min={0} max={12} />
          </FormGroup>
        )}
        {watch('GRID_MODES')?.includes('GRID') && (
          <FormGroup label={t('Grid columns')} description={t('Number of columns of the grid layer')}>
            <NumberInput register={register('GRID_COLUMNS')} min={0} max={12} />
          </FormGroup>
        )}
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

        {appCapabilities.includes('OSC') && (
          <>
            <Divider />

            <Heading h={1}>{t('Remote control (OSC)')}</Heading>

            <FormGroup label={t('Enable OSC')} description={t('Control the app and receive its events from OSC tools such as TouchOSC, Companion or QLC+')}>
              <div>
                <Switch register={register('OSC_ENABLED')} />
              </div>
            </FormGroup>
            <FormGroup label={t('How does it work?')} description={t('Configuration, supported actions and events')}>
              <div>
                <Button size="small" label={t('Show help')} onClick={() => setShowOscHelp(true)} />
              </div>
            </FormGroup>

            {watch('OSC_ENABLED') && (
              <>
                <FormGroup label={t('Status')} description={<span className={oscStatus?.state === 'ERROR' ? style.error : ''}>{oscStatusLabel}</span>} />
                <FormGroup label={t('Protocol')} description={t('Network protocol used to send and receive OSC messages')}>
                  <Select
                    options={[
                      { value: 'udp', label: 'UDP' },
                      { value: 'tcp', label: 'TCP' },
                    ]}
                    control={control}
                    register={register('OSC_PROTOCOL')}
                  />
                </FormGroup>
                <FormGroup label={t('Listening host')} description={t('127.0.0.1 accepts messages from this computer only, 0.0.0.0 from any device on the network')}>
                  <Input control={control} register={register('OSC_LISTEN_HOST')} />
                </FormGroup>
                <FormGroup label={t('Listening port')} description={t('Port on which Eagle Animation receives actions')}>
                  <NumberInput register={register('OSC_LISTEN_PORT')} min={1} max={65535} />
                </FormGroup>
                <FormGroup label={t('Target host')} description={t('Address of the device that receives the events')}>
                  <Input control={control} register={register('OSC_TARGET_HOST')} />
                </FormGroup>
                <FormGroup
                  label={t('Target port')}
                  description={
                    oscPortsConflict ? (
                      <span className={style.warning}>{t('The target is on this computer: both ports must be different, two apps can not listen on the same port')}</span>
                    ) : (
                      t('Port on which events are sent')
                    )
                  }
                >
                  <NumberInput register={register('OSC_TARGET_PORT')} min={1} max={65535} />
                </FormGroup>
                <FormGroup label={t('Send played frames')} description={t('Send an event for every frame displayed during playback, can generate a lot of traffic')}>
                  <div>
                    <Switch register={register('OSC_SEND_FRAME_PLAYED')} />
                  </div>
                </FormGroup>
              </>
            )}
          </>
        )}

        <Divider />

        <Heading h={1}>{t('Workshops features')}</Heading>

        <FormGroup label={t('Enable workshop features')} description={t('Enable features related to stop motion workshops')}>
          <div>
            <Switch register={register('EVENT_MODE_ENABLED')} />
          </div>
        </FormGroup>

        {watch('EVENT_MODE_ENABLED') && (
          <>
            <FormGroup label={t('Recommended number of frames')} description={t('Number of frames allowed before displaying a warning message')}>
              <NumberInput register={register('LIMIT_NUMBER_OF_FRAMES')} min={0} />
            </FormGroup>

            <FormGroup label={t('Recommended activity duration')} description={t('Duration in minutes on the animator page before displaying a warning message')}>
              <NumberInput register={register('LIMIT_ACTIVITY_DURATION')} min={0} />
            </FormGroup>

            {appCapabilities.includes('BACKGROUND_SYNC') && (
              <>
                <FormGroup label={t('Partner API endpoint')} description={t('The URL of the API to use for workshop mode')}>
                  <Input control={control} register={register('EVENT_API')} />
                </FormGroup>

                <FormGroup label={t('Partner API key')} description={t('The authentification key of the API for workshop mode')}>
                  <Input control={control} register={register('EVENT_KEY')} />
                </FormGroup>
              </>
            )}
          </>
        )}
      </FormLayout>
      <Window isOpened={showOscHelp} onClose={() => setShowOscHelp(false)}>
        <OscHelpWindow />
      </Window>
    </form>
  );
};

export default withTranslation()(SettingsForm);
