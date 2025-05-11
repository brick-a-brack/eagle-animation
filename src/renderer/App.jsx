import Container from '@components/Container';
import CustomErrorBoundary from '@components/CustomErrorBoundary';
import AnimatorView from '@views/Animator';
import ExportView from '@views/Export';
import HomeView from '@views/Home';
import SettingsView from '@views/Settings';
import ShortcutsView from '@views/Shortcuts';
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';

import { WindowProvider } from './contexts/WindowContext';

const App = () => (
  <CustomErrorBoundary>
    <Container>
      <Router>
        <WindowProvider>
          <Routes>
            <Route exact path="/" element={<HomeView />} />
            <Route exact path="/settings" element={<SettingsView />} />
            <Route exact path="/shortcuts" element={<ShortcutsView />} />
            <Route exact path="/animator/:id/:track" element={<AnimatorView />} />
            <Route exact path="/export/:id/:track" element={<ExportView />} />
            <Route path="*" element={null} />
          </Routes>
        </WindowProvider>
      </Router>
    </Container>
  </CustomErrorBoundary>
);

export default App;
