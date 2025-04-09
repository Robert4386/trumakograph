import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createEditor, Descendant, BaseEditor, Transforms, Editor as SlateEditor, Path, Range, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import FormatToolbar from './components/FormatToolbar';
import { Element, Leaf } from './components/Elements';
import ArticleView from './components/ArticleView';
import './App.css';

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  link?: string;
};

type CustomElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'block-quote' | 'numbered-list' | 'bulleted-list' | 'list-item' | 'image' | 'iframe' | 'link';
  children: CustomText[];
  url?: string;
  alt?: string;
  caption?: string;
  src?: string;
  width?: string;
  height?: string;
};

type InsertionUI = {
  show: boolean;
  type: 'link' | 'iframe' | 'image';
  url: string;
  caption?: string;
  selection?: any;
  file?: File;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

type CustomEditorWithImages = BaseEditor & ReactEditor & HistoryEditor;

const withImages = (editor: CustomEditorWithImages) => {
  const { insertData, isVoid } = editor;

  editor.isVoid = (element: any) => {
    return element.type === 'image' || element.type === 'iframe' ? true : isVoid(element);
  };

  editor.insertData = (data: any) => {
    const text = data.getData('text/plain');
    const { files } = data;
    
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      for (const file of fileArray) {
        if (typeof file === 'object' && file !== null && 'type' in file) {
          const reader = new FileReader();
          const [mime] = (file as File).type.split('/');
          
          if (mime === 'image') {
            reader.addEventListener('load', () => {
              const url = reader.result;
              insertImage(editor, url as string);
            });
            
            reader.readAsDataURL(file as Blob);
          }
        }
      }
    } else if (text) {
      insertData(data);
    }
  };
  
  return editor;
};

const insertImage = (editor: CustomEditorWithImages, url: string, caption: string = '') => {
  const text = { text: '' };
  const image: CustomElement = { 
    type: 'image', 
    url,
    caption,
    children: [text]
  };
  Transforms.insertNodes(editor, image);
};

const transliterate = (text: string): string => {
  const rusToEng: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '',
    'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };

  return text.split('').map(char => rusToEng[char] || char).join('');
};

const generateSlug = (title: string, articles: Article[]): string => {
  const transliteratedTitle = transliterate(title);
  
  const slugBase = transliteratedTitle
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  
  const dateSlug = `${slugBase}-${day}-${month}-${year}`;
  
  const sameSlugArticles = articles.filter(article => {
    const articleSlugBase = article.slug.replace(/-\d+$/, '');
    return articleSlugBase === dateSlug;
  });
  
  if (sameSlugArticles.length > 0) {
    return `${dateSlug}-${sameSlugArticles.length + 1}`;
  }
  
  return dateSlug;
};

interface Article {
  id: string;
  title: string;
  author: string;
  content: Descendant[];
  slug: string;
  createdAt: string;
}

const isUrl = (text: string): boolean => {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
};

const isIframeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || 
         url.includes('youtu.be') ||
         url.includes('vimeo.com') ||
         url.includes('twitter.com');
};

const getEmbedUrl = (url: string): string => {
  if (!url) {
    console.error('Пустой URL в getEmbedUrl');
    return '';
  }

  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = extractYoutubeVideoId(url);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
      }
    }
    
    if (url.includes('vimeo.com') && !url.includes('player.vimeo.com')) {
      const vimeoId = url.match(/vimeo\.com\/([0-9]+)/);
      if (vimeoId && vimeoId[1]) {
        return `https://player.vimeo.com/video/${vimeoId[1]}?dnt=1`;
      }
    }
    
    if (url.includes('twitter.com') || url.includes('x.com')) {
      const tweetMatch = url.match(/twitter\.com\/[^/]+\/status\/(\d+)/);
      const xMatch = url.match(/x\.com\/[^/]+\/status\/(\d+)/);
      const tweetId = tweetMatch ? tweetMatch[1] : (xMatch ? xMatch[1] : null);
      
      if (tweetId) {
        return `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}`;
      }
    }
    
    return url;
  } catch (error) {
    console.error('Ошибка в getEmbedUrl:', error);
    return url;
  }
};

const extractYoutubeVideoId = (url: string): string | null => {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return match[2];
    }
    
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get('v');
      if (videoId && videoId.length === 11) {
        return videoId;
      }
    }
    
    if (url.includes('youtu.be/')) {
      const parts = url.split('youtu.be/')[1].split(/[?&]/);
      if (parts[0].length === 11) {
        return parts[0];
      }
    }
    
    if (url.includes('youtube.com/embed/')) {
      const parts = url.split('youtube.com/embed/')[1].split(/[?&/]/);
      if (parts[0].length === 11) {
        return parts[0];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Ошибка при извлечении ID видео YouTube:', error);
    return null;
  }
};

const insertLink = (editor: CustomEditorWithImages, url: string, text: string) => {
  if (!url || !text) {
    console.error('URL или текст ссылки не могут быть пустыми');
    return;
  }

  const { selection } = editor;
  
  if (!selection) {
    const link = {
      type: 'link' as const,
      url,
      children: [{ text }],
    };
    
    Transforms.insertNodes(editor, link);
    Transforms.move(editor, { unit: 'offset', distance: 1 });
    return;
  }
  
  if (Range.isCollapsed(selection)) {
    const link = {
      type: 'link' as const,
      url,
      children: [{ text }],
    };
    
    Transforms.insertNodes(editor, link);
    Transforms.move(editor, { unit: 'offset', distance: 1 });
  } else {
    const selectedText = SlateEditor.string(editor, selection);
    
    const linkElement = {
      type: 'link' as const,
      url,
      children: [{ text: selectedText || text }],
    };
    
    Transforms.delete(editor);
    Transforms.insertNodes(editor, linkElement);
    Transforms.move(editor, { unit: 'offset', distance: 1 });
  }
  
  Transforms.insertText(editor, ' ');
};

const insertIframe = (editor: CustomEditorWithImages, src: string, caption: string = '') => {
  const iframe: CustomElement = {
    type: 'iframe' as const,
    src: getEmbedUrl(src),
    caption,
    children: [{ text: '' }],
  };
  
  Transforms.insertNodes(editor, iframe);
  
  Transforms.insertNodes(editor, {
    type: 'paragraph',
    children: [{ text: '' }],
  } as CustomElement);
  
  Transforms.select(editor, SlateEditor.end(editor, []));
};

const withLinks = (editor: CustomEditorWithImages) => {
  const { isInline, insertBreak } = editor;

  editor.isInline = (element) => {
    return element.type === 'link' ? true : isInline(element);
  };

  editor.insertBreak = () => {
    const { selection } = editor;
    
    if (!selection) {
      insertBreak();
      return;
    }

    const [linkNode] = Array.from(
      SlateEditor.nodes(editor, {
        match: n => 
          !SlateEditor.isEditor(n) && 
          SlateElement.isElement(n) && 
          n.type === 'link',
        at: selection,
      })
    ) || [];

    if (linkNode) {
      const [, parentPath] = Array.from(
        SlateEditor.nodes(editor, {
          match: n => 
            !SlateEditor.isEditor(n) && 
            SlateElement.isElement(n) && 
            !editor.isInline(n as any),
          at: selection,
        })
      )[0];
      
      Transforms.splitNodes(editor, { 
        always: true,
        match: n => 
          !SlateEditor.isEditor(n) && 
          SlateElement.isElement(n) && 
          !editor.isInline(n as any)
      });
      
      Transforms.setNodes(
        editor,
        { type: 'paragraph' },
        { 
          match: n => 
            !SlateEditor.isEditor(n) && 
            SlateElement.isElement(n) && 
            !editor.isInline(n as any),
          at: Path.next(parentPath)
        }
      );
      
      const newPoint = { path: [...Path.next(parentPath), 0], offset: 0 };
      Transforms.select(editor, newPoint);
      
      return;
    }
    
    insertBreak();
  };

  return editor;
};

const Editor: React.FC = () => {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  
  const [publishedUrl, setPublishedUrl] = useState<string>('');
  const [published, setPublished] = useState<boolean>(false);
  const [articles, setArticles] = useState<Article[]>([]);
  
  const [insertionUI, setInsertionUI] = useState<InsertionUI>({
    show: false,
    type: 'link',
    url: '',
    caption: '',
  });
  
  const editor = useMemo(() => 
    withLinks(
      withImages(
        withHistory(
          withReact(createEditor())
        ) as CustomEditorWithImages
      )
    ), 
  []);
  
  const [value, setValue] = useState<Descendant[]>([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    } as CustomElement,
  ]);

  useEffect(() => {
    const savedArticles = localStorage.getItem('articles');
    if (savedArticles) {
      setArticles(JSON.parse(savedArticles));
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const handleCaptionUpdate = (e: CustomEvent) => {
      const { element, caption } = e.detail;
      try {
        const path = ReactEditor.findPath(editor, element);
        Transforms.setNodes(
          editor,
          { caption },
          { at: path }
        );
      } catch (err) {
        console.error('Ошибка при обновлении подписи:', err);
      }
    };

    document.addEventListener('update-iframe-caption', handleCaptionUpdate as EventListener);
    
    return () => {
      document.removeEventListener('update-iframe-caption', handleCaptionUpdate as EventListener);
    };
  }, [editor]);

  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);
  
  const handleInsertionConfirm = () => {
    if ((!insertionUI.url && insertionUI.type !== 'image') || (insertionUI.type === 'image' && !insertionUI.file)) {
      setInsertionUI({ ...insertionUI, show: false });
      return;
    }
    
    if (insertionUI.selection) {
      ReactEditor.focus(editor);
      Transforms.select(editor, insertionUI.selection);
    }
    
    if (insertionUI.selection) {
      try {
        const [currentNode] = SlateEditor.node(editor, insertionUI.selection.anchor.path);
        if ('text' in currentNode && typeof currentNode.text === 'string') {
          Transforms.delete(editor, { 
            at: { 
              anchor: { path: insertionUI.selection.anchor.path, offset: 0 },
              focus: { path: insertionUI.selection.focus.path, offset: currentNode.text.length }
            } 
          });
        }
      } catch (err) {
        console.error('Ошибка при удалении текста:', err);
      }
    }
    
    if (insertionUI.type === 'iframe') {
      insertIframe(editor, insertionUI.url, insertionUI.caption);
    } else if (insertionUI.type === 'link') {
      insertLink(editor, insertionUI.url, insertionUI.url);
    } else if (insertionUI.type === 'image' && insertionUI.file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        insertImage(editor, imageUrl, insertionUI.caption || '');
      };
      reader.readAsDataURL(insertionUI.file);
    }
    
    setInsertionUI({
      show: false,
      type: 'link',
      url: '',
      caption: '',
    });
  };
  
  const handleInsertionCancel = () => {
    setInsertionUI({
      show: false,
      type: 'link',
      url: '',
      caption: '',
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, editor: CustomEditorWithImages) => {
    if (event.key === 'Enter') {
      const selection = editor.selection;
      
      if (selection && Range.isCollapsed(selection)) {
        try {
          const [currentNode] = SlateEditor.node(editor, selection.anchor.path);
          
          if ('text' in currentNode && typeof currentNode.text === 'string') {
            const text = currentNode.text.trim();
            
            if (isUrl(text)) {
              event.preventDefault();
              
              if (isIframeUrl(text)) {
                setInsertionUI({
                  show: true,
                  type: 'iframe',
                  url: text,
                  caption: '',
                  selection
                });
              } else {
                Transforms.delete(editor, { 
                  at: { 
                    anchor: { path: selection.anchor.path, offset: 0 },
                    focus: { path: selection.focus.path, offset: currentNode.text.length }
                  } 
                });
                
                insertLink(editor, text, text);
              }
            }
          }
        } catch (err) {
          console.error('Ошибка при обработке текста:', err);
        }
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const { clipboardData } = event;
    const text = clipboardData.getData('text/plain').trim();
    
    if (text && isUrl(text)) {
      event.preventDefault();
      
      if (isIframeUrl(text)) {
        setInsertionUI({
          show: true,
          type: 'iframe',
          url: text,
          caption: '',
          selection: editor.selection
        });
      } else {
        try {
          ReactEditor.focus(editor);
          
          if (editor.selection) {
            const [currentNode] = SlateEditor.node(editor, editor.selection.anchor.path);
            if ('text' in currentNode && 
                typeof currentNode.text === 'string' && 
                !Range.isCollapsed(editor.selection)) {
              Transforms.delete(editor);
            }
          }
          
          insertLink(editor, text, text);
        } catch (err) {
          console.error('Ошибка при вставке ссылки:', err);
        }
      }
      return;
    }
    
    if (clipboardData.items && clipboardData.items.length > 0) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        if (clipboardData.items[i].type.indexOf('image') !== -1) {
          event.preventDefault();
          const file = clipboardData.items[i].getAsFile();
          
          if (file) {
            setInsertionUI({
              show: true,
              type: 'image',
              url: '',
              caption: '',
              selection: editor.selection,
              file
            });
            return;
          }
        }
      }
    }
  };

  const publishArticle = () => {
    if (!title.trim()) {
      alert('Пожалуйста, добавьте заголовок для вашей статьи');
      return;
    }
    
    if (!author.trim()) {
      alert('Пожалуйста, укажите имя автора');
      return;
    }
    
    const slug = generateSlug(title, articles);
    const id = Date.now().toString();
    const newArticle: Article = {
      id,
      title,
      author,
      content: value,
      slug,
      createdAt: new Date().toISOString()
    };
    
    const updatedArticles = [...articles, newArticle];
    setArticles(updatedArticles);
    localStorage.setItem('articles', JSON.stringify(updatedArticles));
    
    setPublishedUrl(`/${slug}`);
    setPublished(true);
    
    setTimeout(() => {
      navigate(`/${slug}`);
    }, 1000);
  };

  return (
    <div className="min-h-screen dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <header className="dark:bg-gray-800 shadow-md py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold dark:text-indigo-400">Makograph</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {published ? (
          <div className="dark:bg-green-900 p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold dark:text-green-200 mb-2">Статья опубликована!</h2>
            <p className="dark:text-green-300 mb-4">
              Ваша статья опубликована и доступна по адресу:
            </p>
            <div className="flex items-center space-x-2">
              <code className="dark:bg-gray-800 px-3 py-2 rounded text-sm flex-grow overflow-x-auto">
                {window.location.origin}{publishedUrl}
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}${publishedUrl}`);
                  alert('Ссылка скопирована в буфер обмена!');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded"
              >
                Копировать
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => {
                  setPublished(false);
                  setTitle('');
                  setAuthor('');
                  setValue([{ type: 'paragraph', children: [{ text: '' }] } as CustomElement]);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
              >
                Написать новую статью
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Заголовок"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-3xl font-bold border-b-2 border-gray-300 focus:outline-none focus:border-indigo-500 bg-transparent dark:text-white dark:border-gray-700 dark:focus:border-indigo-400"
              />
            </div>
            
            <div className="mb-10">
              <input
                type="text"
                placeholder="Автор"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full italic border-b-2 border-gray-300 focus:outline-none focus:border-indigo-500 bg-transparent dark:text-white dark:border-gray-700 dark:focus:border-indigo-400"
              />
            </div>
            
            {insertionUI.show && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4 dark:text-white">
                    {insertionUI.type === 'iframe' ? 'Вставить фрейм' : 
                    insertionUI.type === 'image' ? 'Вставить изображение' : 'Вставить ссылку'}
                  </h3>
                  
                  {insertionUI.type !== 'image' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL
                      </label>
                      <input
                        type="text"
                        value={insertionUI.url}
                        onChange={(e) => setInsertionUI({ ...insertionUI, url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="https://"
                        autoFocus
                      />
                    </div>
                  )}
                  
                  {insertionUI.type === 'image' && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Изображение готово к вставке
                      </p>
                      {insertionUI.file && (
                        <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-xs text-gray-600 dark:text-gray-400">
                          {insertionUI.file.name} ({Math.round(insertionUI.file.size / 1024)} KB)
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(insertionUI.type === 'iframe' || insertionUI.type === 'image') && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Подпись (необязательно)
                      </label>
                      <input
                        type="text"
                        value={insertionUI.caption}
                        onChange={(e) => setInsertionUI({ ...insertionUI, caption: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder={insertionUI.type === 'iframe' ? "Описание фрейма" : "Описание изображения"}
                        autoFocus={insertionUI.type === 'image'}
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleInsertionCancel}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleInsertionConfirm}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                    >
                      Вставить
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <Slate editor={editor} initialValue={value} onChange={setValue}>
                <FormatToolbar />
                <Editable
                  renderElement={renderElement}
                  renderLeaf={renderLeaf}
                  placeholder="Напишите свою историю... (Вставьте изображения с помощью Ctrl+V)"
                  onKeyDown={(event) => handleKeyDown(event, editor)}
                  onPaste={handlePaste}
                  className="min-h-[50vh] focus:outline-none p-6 border dark:border-gray-700 rounded-lg shadow-sm"
                />
              </Slate>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={publishArticle}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition-colors duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5.528c0 .4-.16.784-.445 1.068L11 15.202V16h3a1 1 0 1 1 0 2H7a1 1 0 1 1 0-2h3v-.798L5.445 10.596A1.5 1.5 0 0 1 5 9.528V4zm2 1v4.528l4.5 4.5L15 9.528V5H6z" clipRule="evenodd" />
                </svg>
                Опубликовать статью
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Editor />} />
        <Route path="/:slug" element={<ArticleView />} />
      </Routes>
    </Router>
  );
};

export default App;
