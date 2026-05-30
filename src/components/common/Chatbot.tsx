import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Send, Maximize2, Minimize2 } from 'lucide-react';
import { Button, cn } from '@heroui/react';
import './Chatbot.css';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const WEBHOOK_URL = import.meta.env.VITE_PESSOBOT_WEBHOOK_URL?.trim() || '';
const WEBHOOK_SIGNATURE = import.meta.env.VITE_PESSOBOT_SIGNATURE ?? '';

/** Mascotte officielle — avatars (FAB, header, bulles assistant) */
const PESSOBOT_AVATAR = '/images/pessobot-mascot.png';
/** Photo lifestyle — fiche « Profil » uniquement */
const PESSOBOT_VISUAL = '/images/pessobot-assistant.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

const QUICK_SUGGESTIONS = {
  default: ['Voir le menu', 'Horaires d’ouverture', 'Différence entre les boissons', 'Créer un compte'],
  menu: ['Wellness (Douceur)', 'Énergie Drink (Focus)', 'Shakes protéinés (Sport)', 'Prix des boissons'],
  health: ['Combien de protéines ?', 'Végétalien ?', 'Calories ?', 'Ingrédients'],
};

const KNOWLEDGE_BASE: Record<string, string> = {
  horaire:
    'Nous sommes ouverts :\n\nLundi - Vendredi : 9h30 - 18h\nSamedi : 10h30 - 14h\nDimanche : fermé',
  adresse: 'Nous sommes situés au :\n\nC.C. La Véranda – Cluny\n97200 Fort-de-France, Martinique',
  menu:
    'Notre menu est divisé en 3 gammes principales :\n\nWELLNESS — santé / beauté\nÉNERGIE — pré-workout\nSHAKES — récupération & gourmandise',
};

const focusLink =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sapin/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

/**
 * Détecte [label](url) markdown et URLs nues http(s)://… / mailto: / tel:.
 * Les liens sont ouverts en nouvel onglet avec `rel="noopener noreferrer"`
 * pour préserver la session chat courante.
 */
const LINK_REGEX =
  /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|tel:[^\s)]+|\/[^\s)]*)\)|(https?:\/\/[^\s<>)]+)|(mailto:[^\s<>)]+)|(tel:\+?[0-9 ()\-.]+)/g;

const stripTrailingPunct = (url: string): { href: string; trail: string } => {
  const match = url.match(/^(.*?)([.,;:!?)\]]+)$/);
  if (!match) return { href: url, trail: '' };
  return { href: match[1], trail: match[2] };
};

/**
 * Rend le markdown inline (**bold**, *italic*, _italic_) sur un segment de texte
 * qui ne contient PAS de lien. Les bornes sont sécurisées :
 * - non-greedy `+?` pour ne pas avaler plusieurs segments adjacents
 * - negative lookbehind/lookahead pour éviter de matcher `5 * 3` (math) ou `_snake_case`
 * - pas de capture à travers les sauts de ligne (chaque ligne est traitée isolément
 *   par `renderMessageContent`).
 */
const MD_REGEX =
  /\*\*([^*\n]+?)\*\*|(?<![*\w])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![*\w])|(?<![_\w])_(?!\s)([^_\n]+?)(?<!\s)_(?![_\w])/g;

const renderInlineMarkdown = (text: string, keyPrefix: string): ReactNode[] => {
  if (!text) return [];
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let counter = 0;
  const regex = new RegExp(MD_REGEX.source, MD_REGEX.flags);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, bold, italicAst, italicUnd] = match;
    const key = `${keyPrefix}-md-${counter++}`;
    if (bold) {
      nodes.push(<strong key={key}>{bold}</strong>);
    } else {
      nodes.push(<em key={key}>{italicAst || italicUnd}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.length === 0 ? [text] : nodes;
};

const renderLineWithLinks = (line: string, lineKey: number): ReactNode => {
  if (!line) return null;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let counter = 0;

  const regex = new RegExp(LINK_REGEX.source, LINK_REGEX.flags);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    const [full, mdLabel, mdHref, bareHttp, bareMail, bareTel] = match;
    if (match.index > lastIndex) {
      nodes.push(...renderInlineMarkdown(line.slice(lastIndex, match.index), `ln-${lineKey}-t${counter}`));
    }
    let href = mdHref || bareHttp || bareMail || bareTel;
    let label = mdLabel || href;
    let trail = '';
    if (!mdHref) {
      const cleaned = stripTrailingPunct(href);
      href = cleaned.href;
      label = cleaned.href;
      trail = cleaned.trail;
    }
    const isInternal = href.startsWith('/');
    if (isInternal) {
      nodes.push(
        <Link key={`ln-${lineKey}-${counter++}`} to={href} className="chatbot-link">
          {label}
        </Link>
      );
    } else {
      nodes.push(
        <a
          key={`ln-${lineKey}-${counter++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="chatbot-link"
        >
          {label}
        </a>
      );
    }
    if (trail) nodes.push(trail);
    lastIndex = match.index + full.length;
  }
  if (lastIndex < line.length) {
    nodes.push(...renderInlineMarkdown(line.slice(lastIndex), `ln-${lineKey}-t${counter}`));
  }
  return nodes.length === 0 ? line : nodes;
};

interface ChatbotProps {
  embedded?: boolean;
}

/**
 * Persistance de la conversation (sessionId + messages) en sessionStorage.
 * - Scope : onglet du navigateur. Nouvelle session = nouvel onglet.
 * - Survit aux remounts du composant (navigation entre routes qui mountent/unmountent
 *   le Chatbot, reload manuel, etc.) → zéro perte d'historique visible.
 * - Côté serveur, le même sessionId est envoyé à n8n → la mémoire LangChain garde
 *   aussi son fil de discussion.
 */
const STORAGE_KEY_SESSION = 'pessobot:sessionId';
const STORAGE_KEY_MESSAGES = 'pessobot:messages';

const readStoredSessionId = (): string => {
  if (typeof window === 'undefined') return `session-${Math.random().toString(36).substring(7)}`;
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY_SESSION);
    if (stored) return stored;
  } catch {}
  const fresh = `session-${Math.random().toString(36).substring(7)}`;
  try {
    window.sessionStorage.setItem(STORAGE_KEY_SESSION, fresh);
  } catch {}
  return fresh;
};

const readStoredMessages = (): Message[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ role: Message['role']; content: string; timestamp?: string }>;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
    }));
  } catch {
    return [];
  }
};

const Chatbot = ({ embedded = false }: ChatbotProps) => {
  const reduceMotion = useReducedMotion() ?? false;
  const location = useLocation();
  const navigate = useNavigate();
  const { user, subscription } = useAuth();

  const [isOpen, setIsOpen] = useState(embedded);
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** Bulle flottante (~420px) — fiche profil en hero + overlay */
  const profileInMiniPanel = !embedded && !isFullscreen;
  /** Chat agrandi plein écran (toujours flottant, pas embedded) */
  const profileInFullscreenPanel = !embedded && isFullscreen;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => readStoredMessages());
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  /**
   * Compte le nombre de secondes écoulées depuis le début de la requête courante.
   * Sert uniquement à afficher un micro-message d'attente évolutif au-delà de 3 s
   * (temps normal d'un aller-retour PessoBot : 3-14 s selon tool call).
   */
  const [typingElapsed, setTypingElapsed] = useState(0);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sessionId = useRef(readStoredSessionId());

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        role: 'assistant',
        content:
          "Bienvenue chez PessÓra.\n\nJe suis PessoBot, votre interlocuteur nutrition.\nBesoin d'énergie, de récupération ou d'un conseil bien-être ?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      setTimeout(() => {
        setQuickSuggestions(QUICK_SUGGESTIONS.default);
      }, 500);
    }
  }, [messages.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  /**
   * Scroll intelligent : après un message user on va en bas (pour voir son message
   * + l'indicateur de typing), après un message assistant on aligne le HAUT du message
   * en haut de la zone visible pour que la lecture commence au début de la réponse
   * (évite le saut en bas d'une réponse longue).
   */
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    const behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth';
    if (last.role === 'assistant' && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior, block: 'start' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    }
  }, [messages, reduceMotion]);

  useEffect(() => {
    if (isTyping) {
      messagesEndRef.current?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'end',
      });
    }
  }, [isTyping, reduceMotion]);

  useEffect(() => {
    if (!isTyping) {
      setTypingElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = window.setInterval(() => {
      setTypingElapsed(Math.floor((Date.now() - start) / 1000));
    }, 500);
    return () => window.clearInterval(interval);
  }, [isTyping]);

  const typingHint =
    typingElapsed < 3
      ? null
      : typingElapsed < 7
        ? 'Je consulte la carte…'
        : typingElapsed < 13
          ? 'Je prépare une réponse détaillée…'
          : 'Un instant, encore quelques secondes…';

  const getNextSuggestions = (response: string): string[] => {
    const lower = response.toLowerCase();
    if (lower.includes('menu') || lower.includes('gamme')) return QUICK_SUGGESTIONS.menu;
    if (lower.includes('protéine') || lower.includes('kcal')) return QUICK_SUGGESTIONS.health;
    return QUICK_SUGGESTIONS.default;
  };

  const sendMessage = async (messageText: string | null = null) => {
    const messageToSend = messageText || inputMessage.trim();
    if (!messageToSend || isTyping) return;

    setInputMessage('');
    setQuickSuggestions([]);

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    if (!WEBHOOK_URL) {
      const assistantMessage: Message = {
        role: 'assistant',
        content:
          'Le chatbot n’est pas configuré sur cet environnement (URL webhook manquante). Définissez VITE_PESSOBOT_WEBHOOK_URL.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
      return;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (WEBHOOK_SIGNATURE) headers['X-Pessobot-Signature'] = WEBHOOK_SIGNATURE;

      /** Identité envoyée au webhook — priorité AuthContext, repli session Supabase (évite userId null si le contexte est en retard). */
      let payloadUserId = user?.id ?? null;
      let payloadFirstName = user?.firstName?.trim() || null;
      let payloadEmail = user?.email ?? null;
      let payloadTier = subscription?.plan ?? null;

      if (!payloadUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        const su = session?.user;
        if (su?.id) {
          payloadUserId = su.id;
          payloadEmail = su.email ?? payloadEmail;
          if (!payloadFirstName) {
            const meta = su.user_metadata as { first_name?: string } | undefined;
            const fromMeta = meta?.first_name?.trim();
            if (fromMeta) payloadFirstName = fromMeta;
          }
        }
      }

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: messageToSend,
          sessionid: sessionId.current,
          page: location.pathname,
          userId: payloadUserId,
          first_name: payloadFirstName,
          email: payloadEmail,
          subscription_tier: payloadTier,
        }),
      });

      if (!response.ok) throw new Error('Webhook failed');

      const data = await response.json();

      let botResponse = '';
      if (data && data.response) {
        botResponse = data.response;
      } else if (Array.isArray(data) && data[0]?.response) {
        botResponse = data[0].response;
      } else {
        botResponse = "J'ai bien reçu le message mais je n'ai pas pu générer de réponse.";
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: botResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setQuickSuggestions(getNextSuggestions(botResponse));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Chatbot error:', error);
      }

      let fallbackResponse = 'Désolé, le service est momentanément indisponible. Réessayez dans un instant.';
      const lowerMessage = messageToSend.toLowerCase();
      for (const [keyword, response] of Object.entries(KNOWLEDGE_BASE)) {
        if (lowerMessage.includes(keyword)) fallbackResponse = response;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <p key={index} style={{ minHeight: line ? 'auto' : '0.5em' }}>
        {renderLineWithLinks(line, index)}
      </p>
    ));
  };

  if (!embedded && !isOpen) {
    return (
      <Button
        type="button"
        variant="ghost"
        onPress={() => setIsOpen(true)}
        className={cn('chatbot-fab', focusLink)}
        aria-label="Ouvrir Pessobot"
      >
        <img
          src={PESSOBOT_AVATAR}
          alt=""
          className="chatbot-fab-img object-contain object-center p-2"
        />
      </Button>
    );
  }

  return (
    <div
      className={`chatbot-container ${isFullscreen && !embedded ? 'fullscreen' : ''} ${embedded ? 'chatbot-container--embedded' : ''}`}
    >
      <div className="chatbot-header">
        <Button
          type="button"
          variant="ghost"
          onPress={() => setIsProfileOpen(true)}
          className={cn(
            focusLink,
            'chatbot-header-info group border-none bg-transparent p-0 text-left transition-opacity hover:opacity-80'
          )}
        >
          <div className="chatbot-avatar overflow-hidden bg-white">
            <img
              src={PESSOBOT_AVATAR}
              alt=""
              className="h-full w-full object-contain object-center p-1"
            />
          </div>
          <div>
            <h3 className="chatbot-title text-white">Pessobot</h3>
            <p className="chatbot-status transition-colors group-hover:text-white">
              Expert nutrition · <span className="underline">Profil</span>
            </p>
          </div>
        </Button>
        <div className="chatbot-header-actions">
          {!embedded && (
            <>
              <Button
                type="button"
                variant="ghost"
                isIconOnly
                aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
                onPress={() => setIsFullscreen(!isFullscreen)}
                className={cn('chatbot-icon-btn', focusLink)}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                isIconOnly
                aria-label="Fermer le chat"
                onPress={() => setIsOpen(false)}
                className={cn('chatbot-icon-btn', focusLink)}
              >
                <X className="h-5 w-5" />
              </Button>
            </>
          )}
          {embedded && (
            <Link
              to={location.pathname.startsWith('/demo-espace') ? '/demo-espace' : '/mon-espace'}
              className={cn(
                focusLink,
                'chatbot-icon-btn flex !w-auto items-center gap-2 !rounded-full px-4 text-xs font-semibold uppercase tracking-[0.14em] text-noir hover:bg-noir/[0.06]'
              )}
            >
              <X className="h-4 w-4" aria-hidden />
              Fermer
            </Link>
          )}
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            ref={index === messages.length - 1 ? lastMessageRef : null}
            className={`chatbot-message ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            {message.role === 'assistant' && (
              <div className="chatbot-message-avatar overflow-hidden bg-white">
                <img
                  src={PESSOBOT_AVATAR}
                  alt=""
                  className="h-full w-full object-contain object-center p-0.5"
                />
              </div>
            )}
            <div className="chatbot-message-content">{renderMessageContent(message.content)}</div>
          </div>
        ))}
        {isTyping && (
          <div className="chatbot-message assistant">
            <div className="chatbot-message-avatar overflow-hidden bg-white">
              <img
                src={PESSOBOT_AVATAR}
                alt=""
                className="h-full w-full object-contain object-center p-0.5"
              />
            </div>
            <div className="chatbot-message-content">
              <div className="chatbot-typing" aria-hidden>
                <span />
                <span />
                <span />
              </div>
              {typingHint && (
                <p className="chatbot-typing-hint" aria-live="polite">
                  {typingHint}
                </p>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {quickSuggestions.length > 0 && (
        <div className="chatbot-suggestions">
          {quickSuggestions.map((suggestion, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              onPress={() => sendMessage(suggestion)}
              className={cn('chatbot-suggestion-btn', focusLink)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      <div className="chatbot-input-container">
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pose ta question…"
          className="chatbot-input"
          rows={1}
        />
        <Button
          type="button"
          variant="ghost"
          isIconOnly
          aria-label="Envoyer"
          onPress={() => sendMessage()}
          isDisabled={!inputMessage.trim() || isTyping}
          className={cn('chatbot-send-btn', focusLink)}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      <AnimatePresence>
        {isProfileOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
            className={cn(
              'absolute inset-0 z-[100] flex bg-noir/65 backdrop-blur-[10px]',
              profileInMiniPanel
                ? 'items-stretch justify-stretch p-2'
                : 'items-center justify-center p-4 sm:p-6 md:p-8'
            )}
          >
            <motion.div
              initial={reduceMotion ? false : { scale: 0.96, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { scale: 0.96, opacity: 0, y: 16 }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.25, 0.1, 0.25, 1] }}
              className={cn(
                'chatbot-profile-sheet relative flex min-h-0 flex-col overflow-hidden rounded-[2px] border border-white/12 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10',
                profileInMiniPanel && 'h-full w-full max-h-full',
                profileInFullscreenPanel &&
                  'h-[min(88dvh,860px)] w-full max-w-lg flex-shrink-0 sm:h-[min(90dvh,900px)]',
                embedded && 'mx-auto h-[min(82dvh,700px)] w-full max-w-md flex-shrink-0'
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby="pessobot-profile-title"
            >
              {/* Hero plein cadre : image visible + texte en overlay (mini, plein écran, embedded) */}
              <div className="relative flex min-h-0 flex-1 flex-col">
                <img
                  src={PESSOBOT_VISUAL}
                  alt=""
                  width={2100}
                  height={900}
                  className="absolute inset-0 h-full w-full object-cover object-[center_36%] sm:object-[center_34%]"
                  loading="eager"
                  decoding="async"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15"
                  aria-hidden
                />
                <Button
                  type="button"
                  variant="ghost"
                  isIconOnly
                  aria-label="Fermer la fiche Pessobot"
                  onPress={() => setIsProfileOpen(false)}
                  className={cn(
                    focusLink,
                    'absolute right-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-[2px] border border-white/30 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/55 sm:right-3 sm:top-3'
                  )}
                >
                  <X size={18} strokeWidth={1.5} />
                </Button>

                <div
                  className={cn(
                    'relative z-10 mt-auto flex min-h-0 flex-col items-center text-center text-white',
                    profileInMiniPanel &&
                      'max-h-[55%] gap-2 overflow-y-auto overscroll-contain px-3 pb-4 pt-10 sm:max-h-[58%] sm:px-4 sm:pb-5',
                    profileInFullscreenPanel && 'gap-3 px-6 pb-10 pt-24 sm:px-10 sm:pb-12 sm:pt-28',
                    embedded && 'gap-3 px-6 pb-8 pt-20 sm:px-8 sm:pb-10 sm:pt-24'
                  )}
                >
                  <div
                    className={cn(
                      'space-y-1',
                      profileInMiniPanel ? 'space-y-0.5' : 'space-y-1.5'
                    )}
                  >
                    <h4
                      id="pessobot-profile-title"
                      className={cn(
                        'font-display font-normal tracking-[-0.02em] text-white drop-shadow-md',
                        profileInMiniPanel ? 'text-xl leading-tight' : 'text-[1.65rem] sm:text-3xl'
                      )}
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      PessoBot
                    </h4>
                    <p
                      className={cn(
                        'font-normal uppercase tracking-[0.24em] text-white/75',
                        profileInMiniPanel ? 'text-[9px]' : 'text-[10px]'
                      )}
                    >
                      Assistant nutrition
                    </p>
                  </div>

                  <p
                    className={cn(
                      'max-w-sm text-pretty font-light leading-relaxed text-white/90',
                      profileInMiniPanel ? 'text-[12px] leading-snug' : 'text-[13px] sm:text-[14px]'
                    )}
                  >
                    Je vous aide à choisir une boisson adaptée à vos objectifs — depuis la Martinique et au-delà.
                  </p>

                  <div
                    className={cn(
                      'flex w-full max-w-xs flex-col',
                      profileInMiniPanel ? 'mt-1 gap-1.5' : 'gap-2.5 pt-1'
                    )}
                  >
                    <Button
                      variant="primary"
                      size="md"
                      onPress={() => {
                        setIsProfileOpen(false);
                        setIsOpen(false);
                        navigate('/pessobot');
                      }}
                      className={cn(
                        focusLink,
                        'rounded-[2px] bg-white text-center text-[10px] font-normal uppercase tracking-[0.16em] text-black transition-colors hover:bg-white/90',
                        profileInMiniPanel ? 'py-2.5' : 'py-3.5 sm:py-4'
                      )}
                    >
                      En savoir plus
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onPress={() => setIsProfileOpen(false)}
                      className={cn(
                        'min-h-10 rounded-[2px] font-normal uppercase tracking-[0.14em] text-white/85 hover:bg-white/10 hover:text-white',
                        profileInMiniPanel ? 'py-2 text-[10px]' : 'text-[11px]'
                      )}
                    >
                      Retour au chat
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
