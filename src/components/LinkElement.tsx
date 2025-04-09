import React from 'react';

type LinkElementProps = {
  attributes: any;
  children: React.ReactNode;
  element: {
    url: string;
  };
};

const LinkElement: React.FC<LinkElementProps> = ({ attributes, children, element }) => {
  return (
    <a 
      {...attributes} 
      href={element.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-indigo-600 dark:text-indigo-400 hover:underline"
    >
      {children}
    </a>
  );
};

export default LinkElement; 