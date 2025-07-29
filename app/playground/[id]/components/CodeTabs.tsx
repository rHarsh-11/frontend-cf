'use client';

import { useState } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

interface CodeTabsProps {
  jsxCode: string;
  cssCode: string;
  sessionId: string;
}

export default function CodeTabs({ jsxCode, cssCode, sessionId }: CodeTabsProps) {
  const [activeTab, setActiveTab] = useState<'jsx' | 'css'>('jsx');

  const handleDownload = async () => {
    const zip = new JSZip();
    zip.file('component.jsx', jsxCode);
    zip.file('styles.css', cssCode);
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `session-${sessionId}.zip`);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      alert('Failed to copy');
    }
  };

  return (
    <div className="mt-6">
      <div className="flex space-x-4">
        <button
          className={`px-4 py-2 ${activeTab === 'jsx' ? 'bg-gray-200' : ''}`}
          onClick={() => setActiveTab('jsx')}
        >
          JSX
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'css' ? 'bg-gray-200' : ''}`}
          onClick={() => setActiveTab('css')}
        >
          CSS
        </button>
      </div>

      <pre className="bg-gray-100 p-4 mt-2 rounded text-sm overflow-x-auto">
        {activeTab === 'jsx' ? jsxCode : cssCode}
      </pre>

      <div className="mt-2 flex space-x-4">
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded"
          onClick={() => copyToClipboard(activeTab === 'jsx' ? jsxCode : cssCode)}
        >
          Copy
        </button>
        <button
          className="bg-green-600 text-white px-3 py-1 rounded"
          onClick={handleDownload}
        >
          Download ZIP
        </button>
      </div>
    </div>
  );
}