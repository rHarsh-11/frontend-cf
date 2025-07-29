'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Babel from '@babel/standalone';

interface PreviewFrameProps {
  jsxCode: string;
  cssCode: string;
  onError?: (error: string) => void;
}

const PreviewFrame: React.FC<PreviewFrameProps> = ({ 
  jsxCode, 
  cssCode, 
  onError 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!iframeRef.current) return;
    
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument;
    if (!doc) return;

    setIsLoading(true);

    // Cleanup function
    const cleanup = () => {
      if (doc && doc.defaultView) {
        doc.defaultView.removeEventListener('error', handleError);
      }
    };

    const handleError = (event: ErrorEvent) => {
      const errorMsg = `Runtime Error: ${event.message}`;
      onError?.(errorMsg);
      console.error('Preview Frame Error:', event);
    };

    try {
      // Wrap JSX in a component with better error handling
      const wrappedJsx = `
        const App = () => {
          try {
            return (
              <React.Fragment>
                ${jsxCode}
              </React.Fragment>
            );
          } catch (error) {
            return React.createElement('pre', {
              style: { color: 'red', padding: '10px', fontFamily: 'monospace' }
            }, 'Component Error: ' + error.message);
          }
        };
      `;

      let compiledJs = '';
      try {
        const result = Babel.transform(wrappedJsx, {
          presets: ['react'],
          plugins: []
        });
        compiledJs = result.code || '';
      } catch (error) {
        const errorMsg = `JSX Compile Error: ${error instanceof Error ? error.message : String(error)}`;
        onError?.(errorMsg);
        // Properly escape the error message for HTML
        const escapedError = errorMsg.replace(/'/g, "\\'").replace(/"/g, '\\"');
        compiledJs = `
          document.getElementById('root').innerHTML = 
            '<pre style="color:red;padding:10px;font-family:monospace;">' + 
            '${escapedError}' + 
            '</pre>';
        `;
      }

      // Create iframe content with proper DOCTYPE and meta tags
      const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { margin: 0; padding: 10px; font-family: system-ui, sans-serif; }
      ${cssCode}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script>
      window.addEventListener('error', function(e) {
        console.error('Frame error:', e);
      });
      
      ${compiledJs}
      
      try {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
      } catch (error) {
        document.getElementById('root').innerHTML = 
          '<pre style="color:red;padding:10px;font-family:monospace;">Render Error: ' + error.message + '</pre>';
      }
    </script>
  </body>
</html>`;

      doc.open();
      doc.write(htmlContent);
      doc.close();

      // Add error listener to iframe window
      if (doc.defaultView) {
        doc.defaultView.addEventListener('error', handleError);
      }

    } catch (error) {
      const errorMsg = `Preview Error: ${error instanceof Error ? error.message : String(error)}`;
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }

    // Return cleanup function
    return cleanup;
  }, [jsxCode, cssCode, onError]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 rounded">
          <div className="text-sm text-gray-600">Loading preview...</div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="w-full h-96 border rounded"
        sandbox="allow-scripts allow-same-origin"
        title="Code Preview"
      />
    </div>
  );
};

export default PreviewFrame;