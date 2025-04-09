import React, { useState, useEffect } from 'react';
import { useSelected, useFocused } from 'slate-react';

type IframeElementProps = {
  attributes: any;
  children: React.ReactNode;
  element: {
    type: 'iframe';
    src?: string;
    caption?: string;
    width?: string;
    height?: string;
  };
};

const dispatchCaptionUpdate = (element: any, caption: string) => {
  const event = new CustomEvent('update-iframe-caption', { 
    detail: { element, caption },
    bubbles: true 
  });
  document.dispatchEvent(event);
};

const IframeElement: React.FC<IframeElementProps> = ({ attributes, children, element }) => {
  const selected = useSelected();
  const focused = useFocused();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState(element.caption || '');

  useEffect(() => {
    if (!element.src) {
      setError(true);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(false);
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [element.src]);

  useEffect(() => {
    setCaptionValue(element.caption || '');
  }, [element.caption]);

  const handleLoad = () => {
    console.log('iframe loaded successfully');
    setLoading(false);
  };

  const handleError = () => {
    console.log('iframe loading error');
    setError(true);
    setLoading(false);
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaptionValue(e.target.value);
  };

  const handleCaptionSave = () => {
    if (captionValue !== element.caption) {
      dispatchCaptionUpdate(element, captionValue);
    }
    setIsEditingCaption(false);
  };

  const handleCaptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCaptionSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCaptionValue(element.caption || '');
      setIsEditingCaption(false);
    }
  };

  return (
    <div {...attributes} contentEditable={false}>
      <div
        contentEditable={false}
        className={`relative my-6 ${
          selected && focused ? 'ring-2 ring-indigo-500' : 'hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700'
        }`}
      >
        <div className="rounded-lg overflow-hidden shadow-md">
          {loading && (
            <div className="bg-gray-100 dark:bg-gray-700 w-full aspect-video flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}
          
          {error && !loading && (
            <div className="bg-gray-100 dark:bg-gray-700 w-full aspect-video flex flex-col items-center justify-center p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Не удалось загрузить содержимое
              </p>
            </div>
          )}
          
          {!loading && !error && (
            <iframe
              src={element.src}
              className="w-full aspect-video"
              width={element.width || '100%'}
              height={element.height || '315'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              title="Embedded content"
              onLoad={handleLoad}
              onError={handleError}
            />
          )}
        </div>
        
        {/* Редактируемая подпись */}
        <div className="flex justify-center mt-2">
          {isEditingCaption ? (
            <div className="flex items-center w-full max-w-lg">
              <input
                type="text"
                value={captionValue}
                onChange={handleCaptionChange}
                onKeyDown={handleCaptionKeyDown}
                onBlur={handleCaptionSave}
                autoFocus
                className="flex-grow px-2 py-1 bg-transparent dark:text-gray-300 border-b border-gray-400 focus:outline-none focus:border-indigo-500 text-sm italic text-center"
                placeholder="Описание (по желанию)"
              />
            </div>
          ) : (
            <span 
              className={`text-sm dark:text-gray-400 italic cursor-pointer hover:text-indigo-500 dark:hover:text-indigo-400 ${!element.caption && 'text-gray-400 dark:text-gray-600'}`}
              onClick={() => setIsEditingCaption(true)}
            >
              {element.caption || 'Описание (по желанию)'}
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

export default IframeElement; 