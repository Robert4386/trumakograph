import React from 'react';
import { Editor, Transforms, Element as SlateElement } from 'slate';
import { useSlate } from 'slate-react';

type FormatToolbarProps = {
  className?: string;
};

const FormatToolbar: React.FC<FormatToolbarProps> = ({ className = '' }) => {
  const editor = useSlate();

  const isMarkActive = (format: string) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format as keyof typeof marks] === true : false;
  };

  const isBlockActive = (format: string) => {
    try {
      const [match] = Array.from(
        Editor.nodes(editor, {
          match: n => 
            !Editor.isEditor(n) && 
            SlateElement.isElement(n) && 
            (n as any).type === format,
        })
      );
      return !!match;
    } catch (e) {
      return false;
    }
  };

  const toggleMark = (format: string) => {
    const isActive = isMarkActive(format);
    
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const toggleBlock = (format: string) => {
    const isActive = isBlockActive(format);
    
    Transforms.setNodes(
      editor,
      { type: isActive ? 'paragraph' : format } as any,
      { match: n => !Editor.isEditor(n) && SlateElement.isElement(n) }
    );
  };

  const ToolbarButton = ({ format, type, icon, title }: { format: string, type: 'mark' | 'block', icon: string, title: string }) => {
    const isActive = type === 'mark' ? isMarkActive(format) : isBlockActive(format);
    const toggleFunction = type === 'mark' ? toggleMark : toggleBlock;
    
    return (
      <button
        className={`p-2 rounded transition-colors ${
          isActive 
            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleFunction(format);
        }}
        title={title}
      >
        <span className="block" dangerouslySetInnerHTML={{ __html: icon }}></span>
      </button>
    );
  };

  return (
    <div className={`flex flex-wrap gap-1 mb-3 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm ${className}`}>
      {/* Text formatting group */}
      <div className="flex border-r border-gray-300 dark:border-gray-700 pr-2 mr-2">
        <ToolbarButton 
          format="bold" 
          type="mark" 
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055c1.143-.11 2.08-1.064 2.08-2.223 0-1.213-.89-2.14-2.231-2.14H4.7v9.627zM6.353 6.033h1.61c.748 0 1.254.47 1.254 1.15 0 .693-.502 1.168-1.272 1.168h-1.592zm0 2.487h1.723c.796 0 1.338.528 1.338 1.291 0 .762-.542 1.283-1.389 1.283h-1.672z"/></svg>'
          title="Bold"
        />
        <ToolbarButton 
          format="italic" 
          type="mark" 
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7.991 11.674 9.53 4.455c.123-.595.246-.71 1.347-.807l.11-.52H7.211l-.11.52c1.06.096 1.128.212 1.005.807L6.57 11.674c-.123.595-.246.71-1.346.806l-.11.52h3.774l.11-.52c-1.06-.095-1.129-.211-1.006-.806z"/></svg>'
          title="Italic"
        />
        <ToolbarButton 
          format="underline" 
          type="mark" 
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.313 3.136h-1.23V9.54c0 2.105 1.47 3.623 3.917 3.623s3.917-1.518 3.917-3.623V3.136h-1.23v6.323c0 1.49-.978 2.57-2.687 2.57-1.709 0-2.687-1.08-2.687-2.57z"/><path fill-rule="evenodd" d="M12.5 15h-9v-1h9z"/></svg>'
          title="Underline"
        />
        <ToolbarButton 
          format="code" 
          type="mark" 
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8z"/></svg>'
          title="Code"
        />
      </div>
      
      {/* Block formatting group */}
      <div className="flex border-r border-gray-300 dark:border-gray-700 pr-2 mr-2">
        <ToolbarButton 
          format="heading-one" 
          type="block" 
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.637 13V3.669H7.379V7.62H2.758V3.67H1.5V13h1.258V8.728h4.62V13zm5.329 0V3.669h-1.244L10.5 5.316v1.265l2.16-1.565h.062V13z"/></svg>'
          title="Heading 1"
        />
        <ToolbarButton 
          format="heading-two" 
          type="block" 
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7.638 13V3.669H6.38V7.62H1.759V3.67H.5V13h1.258V8.728h4.62V13zm3.022-6.733v-.048c0-.889.63-1.668 1.716-1.668.957 0 1.675.608 1.675 1.572 0 .855-.554 1.504-1.067 2.085l-3.513 3.999V13H15.5v-1.094h-4.245v-.075l2.481-2.844c.875-.998 1.586-1.784 1.586-2.953 0-1.463-1.155-2.556-2.919-2.556-1.941 0-2.966 1.326-2.966 2.74v.049z"/></svg>'
          title="Heading 2"
        />
      </div>
      
      {/* List formatting group */}
      <div className="flex border-r border-gray-300 dark:border-gray-700 pr-2 mr-2">
        <ToolbarButton 
          format="numbered-list" 
          type="block" 
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M1.713 11.865v-.474H2c.217 0 .363-.137.363-.317 0-.185-.158-.31-.361-.31-.223 0-.367.152-.373.31h-.59c.016-.467.373-.787.986-.787.588-.002.954.291.957.703a.595.595 0 0 1-.492.594v.033a.615.615 0 0 1 .569.631c.003.533-.502.8-1.051.8-.656 0-1-.37-1.008-.794h.582c.008.178.186.306.422.309.254 0 .424-.145.422-.35-.002-.195-.155-.348-.414-.348h-.3zm-.004-4.699h-.604v-.035c0-.408.295-.844.958-.844.583 0 .96.326.96.756 0 .389-.257.617-.476.848l-.537.572v.03h1.054V9H1.143v-.395l.957-.99c.138-.142.293-.304.293-.508 0-.18-.147-.32-.342-.32a.33.33 0 0 0-.342.338zm.018-4.285h.641c.292 0 .455-.147.455-.342 0-.195-.162-.347-.414-.347-.245 0-.404.152-.404.347h-.593c0-.463.389-.8.986-.8.594 0 1.01.317 1.01.756 0 .4-.303.71-.814.75v.033c.479.05.783.305.783.753 0 .458-.398.8-1.043.8a1.08 1.08 0 0 1-1.101-.832h.594c.045.205.232.325.451.325.255 0 .424-.15.424-.351 0-.214-.17-.361-.47-.361h-.574z"/></svg>'
          title="Numbered List"
        />
        <ToolbarButton 
          format="bulleted-list" 
          type="block" 
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/></svg>'
          title="Bulleted List"
        />
      </div>
      
      {/* Block quote */}
      <div className="flex border-r border-gray-300 dark:border-gray-700 pr-2 mr-2">
        <ToolbarButton 
          format="block-quote" 
          type="block" 
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12 12a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1h-1.388q0-.527.062-1.054.093-.558.31-.992t.559-.683q.34-.279.811-.279v-.617q-.488 0-.878.279t-.636.713q-.246.434-.371.929-.125.495-.125.996V11a1 1 0 0 0 1 1zm-6 0a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1H4.612q0-.527.062-1.054.094-.558.31-.992.217-.434.559-.683.34-.279.811-.279v-.617q-.488 0-.878.279t-.636.713q-.246.434-.371.929Q4.32 6.35 4.32 6.85V11a1 1 0 0 0 1 1z"/></svg>'
          title="Quote"
        />
      </div>

      {/* Ссылки и медиа */}
      <div className="flex">
        <button
          className="p-2 rounded transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          onMouseDown={(e) => {
            e.preventDefault();
            const url = window.prompt('Введите URL:');
            if (!url) return;
            
            const selection = editor.selection;
            if (selection) {
              const isCollapsed = selection.anchor.offset === selection.focus.offset;
              const linkText = isCollapsed 
                ? window.prompt('Введите текст ссылки:', url) || url 
                : Editor.string(editor, selection);
              
              if (isCollapsed) {
                Transforms.insertNodes(editor, {
                  type: 'link',
                  url,
                  children: [{ text: linkText }],
                } as any);
              } else {
                Transforms.wrapNodes(
                  editor,
                  { type: 'link', url, children: [] } as any,
                  { split: true }
                );
              }
            }
          }}
          title="Добавить ссылку"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
            <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FormatToolbar; 