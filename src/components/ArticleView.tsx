import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Descendant } from 'slate';

interface Article {
  id: string;
  title: string;
  author: string;
  content: Descendant[];
  slug: string;
  createdAt: string;
}

const ArticleView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (!slug) {
      setError('Статья не найдена');
      setLoading(false);
      return;
    }

    try {
      const savedArticles = localStorage.getItem('articles');
      
      if (savedArticles) {
        const articles: Article[] = JSON.parse(savedArticles);
        const foundArticle = articles.find(a => a.slug === slug);
        
        if (foundArticle) {
          setArticle(foundArticle);
        } else {
          setError('Статья не найдена');
        }
      } else {
        setError('Нет доступных статей');
      }
    } catch (err) {
      setError('Ошибка при загрузке статьи');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const renderContent = (content: Descendant[]) => {
    return content.map((node: any, index) => {
      if (node.type) {
        switch (node.type) {
          case 'paragraph':
            return <p key={index} className="my-3 dark:text-gray-200 leading-relaxed">{renderChildren(node.children)}</p>;
          case 'heading-one':
            return <h1 key={index} className="text-3xl font-bold my-6 dark:text-white">{renderChildren(node.children)}</h1>;
          case 'heading-two':
            return <h2 key={index} className="text-2xl font-bold my-5 dark:text-gray-100">{renderChildren(node.children)}</h2>;
          case 'block-quote':
            return (
              <blockquote key={index} className="border-l-4 border-indigo-400 dark:border-indigo-600 pl-4 italic my-5 dark:text-gray-300 dark:bg-gray-800 py-2 px-2 rounded">
                {renderChildren(node.children)}
              </blockquote>
            );
          case 'numbered-list':
            return <ol key={index} className="list-decimal pl-10 my-5 space-y-1">{renderChildren(node.children)}</ol>;
          case 'bulleted-list':
            return <ul key={index} className="list-disc pl-10 my-5 space-y-1">{renderChildren(node.children)}</ul>;
          case 'list-item':
            return <li key={index} className="pl-1">{renderChildren(node.children)}</li>;
          case 'image':
            return (
              <div key={index} className="my-6">
                <div className="rounded-lg overflow-hidden shadow-md">
                  <img src={node.url} alt={node.alt || 'Изображение'} className="max-w-full h-auto object-contain" />
                </div>
                {(node.caption || node.alt) && (
                  <div className="flex justify-center mt-2">
                    <span className="text-xs dark:text-gray-400 italic">{node.caption || node.alt}</span>
                  </div>
                )}
              </div>
            );
          case 'iframe':
            return (
              <div key={index} className="my-6">
                <div className="rounded-lg overflow-hidden shadow-md aspect-video">
                  <iframe
                    src={node.src}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    loading="lazy"
                    title="Embedded content"
                  ></iframe>
                </div>
                {node.caption && (
                  <div className="flex justify-center mt-2">
                    <span className="text-xs dark:text-gray-400 italic">{node.caption}</span>
                  </div>
                )}
              </div>
            );
          case 'link':
            return (
              <a key={index} href={node.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                {renderChildren(node.children)}
              </a>
            );
          default:
            return <p key={index}>{renderChildren(node.children)}</p>;
        }
      }
      return null;
    });
  };

  const renderChildren = (children: any[]) => {
    return children.map((child, index) => {
      if (typeof child.text === 'string') {
        let textElement = <>{child.text}</>;
        
        if (child.bold) {
          textElement = <strong key={`bold-${index}`} className="font-bold">{textElement}</strong>;
        }
        
        if (child.italic) {
          textElement = <em key={`italic-${index}`} className="italic">{textElement}</em>;
        }
        
        if (child.underline) {
          textElement = <u key={`underline-${index}`} className="underline decoration-1">{textElement}</u>;
        }
        
        if (child.code) {
          textElement = <code key={`code-${index}`} className="dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono dark:text-indigo-400">{textElement}</code>;
        }
        
        return <React.Fragment key={index}>{textElement}</React.Fragment>;
      }
      
      if (child.children) {
        return renderContent([child])[0];
      }
      
      return null;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dark:bg-gray-900 dark:text-white">
        <div className="text-xl mb-4">{error}</div>
        <Link to="/" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <header className="dark:bg-gray-800 shadow-md py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold dark:text-indigo-400">
              Makograph
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        {article && (
          <article className="prose prose-lg dark:prose-invert mx-auto">
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
            <div className="flex items-center mb-8 dark:text-gray-400">
              <span className="mr-4">{article.author}</span>
              <span className="mr-4">{formatDate(article.createdAt)}</span>
            </div>
            
            <div className="mb-8 border-b dark:border-gray-700"></div>
            
            <div className="article-content">
              {renderContent(article.content)}
            </div>
          </article>
        )}
      </main>
    </div>
  );
};

export default ArticleView; 