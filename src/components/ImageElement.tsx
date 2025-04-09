import React from 'react';
import { useSelected, useFocused } from 'slate-react';

type ImageElementProps = {
  attributes: any;
  children: React.ReactNode;
  element: {
    type: 'image';
    url: string;
    alt?: string;
    caption?: string;
  };
};

const ImageElement: React.FC<ImageElementProps> = ({ attributes, children, element }) => {
  const selected = useSelected();
  const focused = useFocused();
  
  return (
    <div {...attributes} contentEditable={false}>
      <div
        contentEditable={false}
        className={`relative my-6 ${
          selected && focused ? 'ring-2 ring-indigo-500' : 'hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700'
        }`}
      >
        <div className="rounded-lg overflow-hidden shadow-md">
          <img
            src={element.url}
            alt={element.alt || 'Embedded image'}
            className="max-w-full h-auto object-contain"
          />
        </div>
        <div className="flex justify-center mt-2">
          <span className="text-xs dark:text-gray-400 italic">
            {element.caption || element.alt || 'Image'}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
};

export default ImageElement; 