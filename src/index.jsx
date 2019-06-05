import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import SentryLogger from './components/SentryLogger';
import { gaInit } from './core/utils';

ReactDOM.render(
    <SentryLogger>
        {' '}
        <App />
    </SentryLogger>, document.getElementById('root'),
);

gaInit();
