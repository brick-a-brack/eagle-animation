import Window from '@components/Window';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const defaultState = { component: null, props: {} };

export const WindowContext = createContext({
  component: null,
  actions: {
    open() {},
    loading() {},
    close() {},
  },
});

export const useWindow = () => useContext(WindowContext);

const WindowManager = () => {
  const { isOpened, component: Component, props, actions } = useWindow();

  return (
    <>
      <Window {...props} isOpened={isOpened} onClose={actions.close}>
        {Component && <Component />}
      </Window>
    </>
  );
};

export const WindowProvider = ({ children }) => {
  const [openState, setOpenState] = useState(false);
  const [state, setState] = useState(defaultState);
  const { pathname } = useLocation();

  const actions = useMemo(
    () => ({
      open({ component = null, ...props }) {
        setState({
          component,
          props,
        });
        setOpenState(true);
      },
      close() {
        setOpenState(false);
      },
    }),
    []
  );

  useEffect(() => {
    if (openState) setOpenState(false);
  }, [pathname]);

  return (
    <WindowContext.Provider value={{ isOpened: openState, component: state.component, props: state.props, actions }}>
      <WindowManager />
      {children}
    </WindowContext.Provider>
  );
};
