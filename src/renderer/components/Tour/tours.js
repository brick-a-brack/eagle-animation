// Tour definitions, keyed by tour name.
//
// Each tour is a function `(t) => steps` returning an ordered list of steps:
//   - `selectors`  (optional) CSS selector, or an ordered list of fallback
//                  selectors, of the element(s) to highlight — usually a
//                  `[data-tour="..."]` attribute. With a list, the first selector
//                  matching a visible element wins (e.g. desktop then mobile). If
//                  several elements match a selector, the spotlight covers all of
//                  them. Omit it for a centered message. Steps whose selectors
//                  match nothing visible are skipped, so a tour can safely
//                  reference elements that only exist on some layouts (desktop vs
//                  mobile) or in some states.
//   - `title`      Title of the step card.
//   - `content`    Body of the step card.
//
// The whole app is non-interactive during a tour (the spotlight overlay swallows
// pointer events); navigation happens only through the step card.
//
// To add a new tour: add an entry here and mount `<Tour tourKey="MY_TOUR" />` in
// the related view. Completion is stored in the `TOURS_COMPLETED` setting and can
// be reset from the settings page.

const TOURS = {
  HOME: (t) => [
    {
      title: t('Welcome to Eagle Animation!'),
      content: t('Eagle Animation is a free and open-source stop motion animation software. Let us show you around!'),
    },
    {
      selectors: ['[data-tour="new-project"]'],
      title: t('Create your first project'),
      content: t('Ready to start? Create a new project and we will show you around the animator.'),
    },
  ],
  ANIMATOR: (t) => [
    {
      title: t('Welcome to the animator!'),
      content: t('This quick tour will introduce the main features.'),
    },
    {
      selectors: ['[data-tour="capture"]', '[data-tour="capture-mobile"]'],
      title: t('Take a picture'),
      content: t('Capture a frame from your camera. Move your scene slightly between each picture to create the illusion of movement.'),
    },
    {
      selectors: ['[data-tour="camera-settings"]', '[data-tour="camera-settings-mobile"]'],
      title: t('Camera settings'),
      content: t('Select your camera and fine-tune its settings, such as focus, exposure or white balance.'),
    },
    {
      selectors: ['[data-tour="onion"]'], // Desktop only
      title: t('Onion skin'),
      content: t('Blend the last captured frame with the live view to position your next move precisely.'),
    },
    {
      selectors: ['[data-tour="overlays"]'], // Desktop only
      title: t('Difference and grid'),
      content: t('Compare the live view with the last captured frame, or display grids to help compose your shot.'),
    },
    {
      selectors: ['[data-tour="playback"]'], // Desktop only
      title: t('Preview your animation'),
      content: t('Play your animation at any time. Enable loop to replay it endlessly, or short play to preview only the last frames.'),
    },
    {
      selectors: ['[data-tour="playback-tools-settings"]'], // Mobile only
      title: t('Playback and animation tools'),
      content: t('Compare the live view with your last frame, or use grids to compose your shot. Play on loop, or use short play to see only the last frames.'),
    },
    {
      selectors: ['[data-tour="playback-mobile"]'], // Mobile only
      title: t('Preview your animation'),
      content: t('Play your animation at any time.'),
    },
    {
      selectors: ['[data-tour="fps"]'], // Desktop only
      title: t('Framerate'),
      content: t('Set the number of frames per second of the scene, 12 FPS is a great start for stop motion.'),
    },
    {
      selectors: ['[data-tour="timeline"]'],
      title: t('Timeline'),
      content: t('All captured frames appear here. Click a frame to review it, or drag it to reorder your animation.'),
    },
    {
      selectors: ['[data-tour="scenes"]', '[data-tour="project-settings-mobile"]'],
      title: t('Project and scenes'),
      content: t('Rename your project and organize your animation in several scenes.'),
    },
    {
      title: t('You are ready!'),
      content: t('Once your animation is done, use the export button to save it as a video or as images. Have fun animating!'),
    },
  ],
};

export default TOURS;
