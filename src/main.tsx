import React from 'react';
import {createRoot} from 'react-dom/client';
import {ResearchSpaces} from './ResearchSpaces';
import {StartupBoundary} from './StartupBoundary';
import {registerAppLaunch} from './appLaunch';
registerAppLaunch();
createRoot(document.getElementById('root')!).render(<StartupBoundary><ResearchSpaces/></StartupBoundary>);
