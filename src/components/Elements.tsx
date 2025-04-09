import React from 'react';
import { RenderElementProps, RenderLeafProps } from 'slate-react';
import ImageElement from './ImageElement';
import IframeElement from './IframeElement';
import LinkElement from './LinkElement';

export const Element = ({ attributes, children, element }: RenderElementProps) => {
  const type = element.type as string;
  
  switch (type) {
    case 'block-quote':
      return (
        <blockquote 
          {...attributes} 
          className="border-l-4 border-indigo-400 dark:border-indigo-600 pl-4 italic my-5 dark:text-gray-300 dark:bg-gray-800 py-2 px-2 rounded"
        >
          {children}
        </blockquote>
      );
    case 'heading-one':
      return (
        <h1 {...attributes} className="text-3xl font-bold my-6 dark:text-white">
          {children}
        </h1>
      );
    case 'heading-two':
      return (
        <h2 {...attributes} className="text-2xl font-bold my-5 dark:text-gray-100">
          {children}
        </h2>
      );
    case 'numbered-list':
      return (
        <ol {...attributes} className="list-decimal pl-10 my-5 space-y-1">
          {children}
        </ol>
      );
    case 'bulleted-list':
      return (
        <ul {...attributes} className="list-disc pl-10 my-5 space-y-1">
          {children}
        </ul>
      );
    case 'list-item':
      return <li {...attributes} className="pl-1">{children}</li>;
    case 'image':
      return <ImageElement attributes={attributes} element={element as any} children={children} />;
    case 'iframe':
      return <IframeElement attributes={attributes} element={element as any} children={children} />;
    case 'link':
      return <LinkElement attributes={attributes} element={element as any} children={children} />;
    default:
      return <p {...attributes} className="my-3 dark:text-gray-200 leading-relaxed">{children}</p>;
  }
};

export const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  let el = <>{children}</>;
  
  if ((leaf as any).bold) {
    el = <strong className="font-bold">{el}</strong>;
  }
  
  if ((leaf as any).italic) {
    el = <em className="italic">{el}</em>;
  }
  
  if ((leaf as any).underline) {
    el = <u className="underline decoration-1">{el}</u>;
  }
  
  if ((leaf as any).code) {
    el = <code className="dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono dark:text-indigo-400">{el}</code>;
  }
  
  if ((leaf as any).link) {
    el = <a href={(leaf as any).link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{el}</a>;
  }
  
  return <span {...attributes}>{el}</span>;
}; 