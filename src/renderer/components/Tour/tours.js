// Tour definitions, keyed by tour name.
//
// Each tour is a function `(t) => steps` returning an ordered list of steps:
//   - `selector`   (optional) CSS selector of the element(s) to highlight, usually a
//                  `[data-tour="..."]` attribute. If several elements match, the
//                  spotlight covers all of them. Omit it for a centered message.
//                  Steps whose selector matches nothing visible are skipped, so a
//                  tour can safely reference elements that only exist on some
//                  layouts (desktop vs mobile) or in some states.
//   - `title`      Title of the step card.
//   - `content`    Body of the step card.
//   - `interactive` (optional) Allow clicks on the highlighted element.
//   - `completeOnTargetClick` (optional) Mark the tour as completed when the
//                  highlighted element is clicked.
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
      selector: '[data-tour="new-project"]',
      title: t('Create your first project'),
      content: t('Ready to start? Create a new project and we will show you around the animator.'),
      interactive: true,
      completeOnTargetClick: true,
    },
  ],
  ANIMATOR: (t) => [
    {
      title: t('Welcome to the animator!'),
      content: t('This quick tour will introduce the main tools. You can restart it at any time from the settings page.'),
    },
    {
      selector: '[data-tour="capture"]',
      title: t('Take a picture'),
      content: t('Capture a frame from your camera. Move your scene slightly between each picture to create the illusion of movement.'),
    },
    {
      selector: '[data-tour="camera-settings"]',
      title: t('Camera settings'),
      content: t('Select your camera and fine-tune its settings, such as focus, exposure or white balance.'),
    },
    {
      selector: '[data-tour="onion"]',
      title: t('Onion skin'),
      content: t('Blend the last captured frame with the live view to position your next move precisely.'),
    },
    {
      selector: '[data-tour="overlays"]',
      title: t('Difference and grid'),
      content: t('Compare the live view with the last captured frame, or display grids to help compose your shot.'),
    },
    {
      selector: '[data-tour="playback"]',
      title: t('Preview your animation'),
      content: t('Play your animation at any time. Enable loop to replay it endlessly, or short play to preview only the last frames.'),
    },
    {
      selector: '[data-tour="fps"]',
      title: t('Framerate'),
      content: t('Set the number of frames per second of the scene, 12 FPS is a great start for stop motion.'),
    },
    {
      selector: '[data-tour="timeline"]',
      title: t('Timeline'),
      content: t('All captured frames appear here. Click a frame to review it, or drag it to reorder your animation.'),
    },
    {
      selector: '[data-tour="scenes"]',
      title: t('Project and scenes'),
      content: t('Rename your project and organize your animation in several scenes.'),
    },
    {
      title: t('You are ready!'),
      content: t('Once your animation is done, use the export button at the top to save it as a video or as images. Have fun animating!'),
    },
  ],
};

export default TOURS;
