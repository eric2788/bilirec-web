import { createRoot } from 'react-dom/client'
import { withErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { ThemeProvider } from 'next-themes'

import "./main.css"
import "./styles/theme.css"
import "./index.css"
import { FallbackProps } from 'react-error-boundary';

const AppWithErrorBoundary = withErrorBoundary(App, { 
  fallbackRender: (props: FallbackProps) => <ErrorFallback {...props} /> 
});

createRoot(document.getElementById('root')!).render(
  // @ts-ignore - next-themes children typing mismatch
  <ThemeProvider attribute="data-appearance" defaultTheme="system">
    <AppWithErrorBoundary />
  </ThemeProvider>
)    
