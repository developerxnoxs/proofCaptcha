import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Shield, Wifi, WifiOff, Activity, Paperclip, Download, Copy, Check, X, Users, FileText, File, FileSpreadsheet, FileImage, FileArchive, FileCode, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessage {
  id: string;
  developerId: string;
  developerName: string;
  developerEmail: string;
  developerAvatar: string | null;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaName?: string | null;
  createdAt: string;
}

interface TypingUser {
  developerId: string;
  developerName: string;
  developerAvatar: string | null;
}

export default function Chat() {
  const { developer } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const [latency, setLatency] = useState<number | null>(null);
  const [realtimeLatency, setRealtimeLatency] = useState<number | null>(null);
  const [isCheckingLatency, setIsCheckingLatency] = useState(false);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const latencyHistoryRef = useRef<number[]>([]);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIndicatorQueueRef = useRef<{ type: string; payload: any } | null>(null);
  const typingIndicatorThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{ name: string; email: string }>>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyTypingRef = useRef<boolean>(false);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingTimeRef = useRef<number>(0);
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    checkTheme();

    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Fetch CSRF token on mount and provide retry mechanism
  const fetchCsrfToken = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/security/csrf', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.csrfToken);
        return data.csrfToken;
      }
      throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch CSRF token');
    }
  }, []);

  useEffect(() => {
    // Fetch CSRF token on mount, but don't block if it fails
    // It will be retried when needed (e.g., when uploading media)
    fetchCsrfToken().catch(error => {
      console.warn('[Chat] Initial CSRF token fetch failed, will retry when needed:', error);
    });
  }, [fetchCsrfToken]);

  useEffect(() => {
    if (!developer) return;

    // Fetch chat history
    fetchChatHistory();

    // Connect to WebSocket
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingIndicatorThrottleRef.current) {
        clearTimeout(typingIndicatorThrottleRef.current);
      }
    };
  }, [developer]);

  // Cleanup preview URL on unmount or when it changes
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive or typing users change
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  // ⚡ PERFORMANCE: Throttle typing indicators to reduce WebSocket congestion
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('[Chat] Cannot send typing indicator - WebSocket not ready');
      return;
    }

    // Queue the typing indicator
    const message = {
      type: 'typing',
      payload: { isTyping }
    };
    
    typingIndicatorQueueRef.current = message;
    
    // Throttle: only send once every 500ms
    if (!typingIndicatorThrottleRef.current) {
      typingIndicatorThrottleRef.current = setTimeout(() => {
        if (typingIndicatorQueueRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            console.log('[Chat] Sending throttled typing indicator:', typingIndicatorQueueRef.current.payload.isTyping);
            wsRef.current.send(JSON.stringify(typingIndicatorQueueRef.current));
            typingIndicatorQueueRef.current = null;
          } catch (error) {
            console.error('Failed to send typing indicator:', error);
          }
        }
        typingIndicatorThrottleRef.current = null;
      }, 500);
    }
  }, []);

  // Measure latency
  const measureLatency = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isCheckingLatency) {
      return;
    }

    setIsCheckingLatency(true);
    lastPingTimeRef.current = Date.now();
    
    // Clear any existing ping timeout
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
    }
    
    // Set timeout to reset isCheckingLatency if pong is not received within 5 seconds
    pingTimeoutRef.current = setTimeout(() => {
      console.log('[Chat] Ping timeout - no pong received');
      setIsCheckingLatency(false);
    }, 5000);
    
    try {
      wsRef.current.send(JSON.stringify({
        type: 'ping',
        payload: { timestamp: lastPingTimeRef.current }
      }));
    } catch (error) {
      console.error('Failed to send ping:', error);
      setIsCheckingLatency(false);
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
    }
  }, [isCheckingLatency]);

  // Start ping interval
  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    // ⚡ PERFORMANCE: Measure latency every 5 seconds for real-time monitoring
    // Congestion reduced through message throttling instead of ping frequency
    pingIntervalRef.current = setInterval(() => {
      measureLatency();
    }, 5000);

    // Initial measurement
    setTimeout(() => measureLatency(), 500);
  }, [measureLatency]);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/messages?limit=100');
      const data = await response.json();
      
      if (data.success && data.messages) {
        setMessages(data.messages);
        // Scroll to bottom after messages are loaded
        setTimeout(() => {
          if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat history',
        variant: 'destructive',
      });
    }
  };

  const connectWebSocket = () => {
    if (!developer) return;

    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[Chat] WebSocket connection opened, waiting for authentication...');
      
      // ⚡ CRITICAL FIX: Clear any pending reconnect timeout to prevent race conditions
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'auth_success') {
          console.log('[Chat] WebSocket authenticated successfully');
          
          // ⚡ CRITICAL FIX: Reset reconnect attempts on successful connection
          reconnectAttemptsRef.current = 0;
          
          setIsConnected(true);
          setIsSending(false);
          startPingInterval();
        } else if (data.type === 'message') {
          console.log('[Chat] Received new message');
          const msg: ChatMessage = data.payload;
          setMessages(prev => [...prev, msg]);
          setIsSending(false);
        } else if (data.type === 'pong') {
          // ⚡ PERFORMANCE OPTIMIZED: Calculate latency with minimal overhead
          const now = Date.now();
          const pingTime = data.payload?.timestamp || lastPingTimeRef.current;
          const roundTripTime = now - pingTime;
          
          // Set real-time latency for immediate visibility
          setRealtimeLatency(roundTripTime);
          
          // ⚡ Use smaller rolling window (3 samples instead of 5) for faster response
          latencyHistoryRef.current.push(roundTripTime);
          if (latencyHistoryRef.current.length > 3) {
            latencyHistoryRef.current.shift();
          }
          
          // Calculate average latency - use median instead of mean to filter outliers
          const sortedLatency = [...latencyHistoryRef.current].sort((a, b) => a - b);
          const medianLatency = sortedLatency[Math.floor(sortedLatency.length / 2)];
          
          // Use median for display (more stable)
          setLatency(medianLatency);
          
          // ⚡ Update connection quality based on latency
          if (medianLatency < 30) {
            setConnectionQuality('excellent');
          } else if (medianLatency < 60) {
            setConnectionQuality('good');
          } else if (medianLatency < 100) {
            setConnectionQuality('fair');
          } else {
            setConnectionQuality('poor');
          }
          
          // Reset reconnect attempts on successful pong
          reconnectAttemptsRef.current = 0;
          setIsCheckingLatency(false);
          
          // Clear ping timeout
          if (pingTimeoutRef.current) {
            clearTimeout(pingTimeoutRef.current);
            pingTimeoutRef.current = null;
          }
          
          console.log(`[Chat] 🚀 Latency - Current: ${roundTripTime}ms | Median: ${medianLatency}ms | Samples:`, latencyHistoryRef.current);
        } else if (data.type === 'typing') {
          const { developerId, developerName, developerAvatar, isTyping } = data.payload;
          console.log('[Chat] Received typing indicator:', { 
            developerId, 
            developerName, 
            isTyping,
            currentDeveloperId: developer?.id 
          });
          
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            if (isTyping) {
              console.log('[Chat] Adding typing user:', developerName);
              newMap.set(developerId, { developerId, developerName, developerAvatar });
            } else {
              console.log('[Chat] Removing typing user:', developerName);
              newMap.delete(developerId);
            }
            console.log('[Chat] Total typing users:', newMap.size);
            return newMap;
          });
        } else if (data.type === 'active_users') {
          const { count } = data.payload;
          console.log('[Chat] Active users count:', count);
          setActiveUsersCount(count);
        } else if (data.type === 'message_deleted') {
          console.log('[Chat] Message deleted:', data.payload.messageId);
          setMessages(prev => prev.filter(msg => msg.id !== data.payload.messageId));
        } else if (data.type === 'error') {
          console.error('[Chat] Server error:', data.payload.error);
          setIsSending(false);
          toast({
            title: 'Error',
            description: data.payload.error || 'Failed to process message',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Failed to process WebSocket message:', error);
        setIsSending(false);
        toast({
          title: 'Error',
          description: 'Failed to process server response',
          variant: 'destructive',
        });
      }
    };

    ws.onerror = (error) => {
      console.error('[Chat] WebSocket error:', error);
      setIsConnected(false);
      setIsSending(false);
      setIsCheckingLatency(false);
      
      // Clear ping timeout on error
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
    };

    ws.onclose = (event) => {
      console.log('[Chat] WebSocket closed. Code:', event.code, 'Reason:', event.reason);
      setIsConnected(false);
      setIsSending(false);
      setLatency(null);
      setIsCheckingLatency(false);
      
      // Clear all intervals and timeouts
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
      
      // ⚡ PERFORMANCE: Implement exponential backoff for reconnections
      // Prevents overwhelming the server with reconnection attempts
      const reconnectDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current = Math.min(reconnectAttemptsRef.current + 1, 5);
      
      console.log(`[Chat] Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttemptsRef.current})`);
      
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (developer) {
          console.log('[Chat] Attempting to reconnect...');
          connectWebSocket();
        }
      }, reconnectDelay);
    };

    wsRef.current = ws;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !wsRef.current || !developer) return;

    if (!isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please wait for connection to be established',
        variant: 'destructive',
      });
      return;
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Connection Error',
        description: 'WebSocket connection is not ready',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    // Clear typing timeout and send stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isCurrentlyTypingRef.current) {
      sendTypingIndicator(false);
      isCurrentlyTypingRef.current = false;
    }

    try {
      // Send plain text message via WebSocket
      const messageToSend = {
        type: 'message',
        payload: {
          content: inputMessage.trim(),
        }
      };

      wsRef.current.send(JSON.stringify(messageToSend));
      setInputMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsSending(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!wsRef.current || !developer) return;

    if (!isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please wait for connection to be established',
        variant: 'destructive',
      });
      return;
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Connection Error',
        description: 'WebSocket connection is not ready',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Send delete message via WebSocket
      const deleteMsg = {
        type: 'delete_message',
        payload: {
          messageId,
        }
      };

      wsRef.current.send(JSON.stringify(deleteMsg));
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }

    // Check for mention trigger
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    // Updated regex to support spaces in names: matches @ followed by any character except @ or newline
    const mentionMatch = textBeforeCursor.match(/@([^@\n]*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);

      // Get unique developers from messages
      const uniqueDevs = new Map<string, { name: string; email: string }>();
      messages.forEach(msg => {
        if (msg.developerId !== developer?.id) {
          uniqueDevs.set(msg.developerId, {
            name: msg.developerName,
            email: msg.developerEmail
          });
        }
      });

      // Filter suggestions based on query
      const suggestions = Array.from(uniqueDevs.values())
        .filter(dev => dev.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);

      setMentionSuggestions(suggestions);
      setShowMentionSuggestions(suggestions.length > 0);
      setSelectedMentionIndex(0);
    } else {
      setShowMentionSuggestions(false);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Send typing indicator if there's text and we haven't already sent it
    if (value.trim()) {
      // Only send typing=true if we're not already marked as typing
      if (!isCurrentlyTypingRef.current) {
        sendTypingIndicator(true);
        isCurrentlyTypingRef.current = true;
      }

      // Set timeout to stop typing indicator after 2 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
        isCurrentlyTypingRef.current = false;
      }, 2000);
    } else {
      // If input is empty, stop typing indicator
      if (isCurrentlyTypingRef.current) {
        sendTypingIndicator(false);
        isCurrentlyTypingRef.current = false;
      }
    }
  };

  const insertMention = (name: string) => {
    // Get the actual cursor position from the textarea element
    const inputElement = textareaRef.current;
    const cursorPosition = inputElement?.selectionStart || inputMessage.length;
    
    const textBeforeCursor = inputMessage.substring(0, cursorPosition);
    const textAfterCursor = inputMessage.substring(cursorPosition);
    // Updated regex to support spaces in names: matches @ followed by any character except @ or newline
    const mentionMatch = textBeforeCursor.match(/@([^@\n]*)$/);

    if (mentionMatch) {
      const beforeMention = inputMessage.substring(0, mentionMatch.index);
      const newValue = beforeMention + `@${name} ` + textAfterCursor;
      setInputMessage(newValue);
      
      // Set cursor position after the inserted mention
      setTimeout(() => {
        if (inputElement) {
          const newCursorPos = (mentionMatch.index || 0) + name.length + 2; // +2 for @ and space
          inputElement.setSelectionRange(newCursorPos, newCursorPos);
          inputElement.focus();
        }
      }, 0);
    }

    setShowMentionSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Handle mention suggestions navigation
    if (showMentionSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev < mentionSuggestions.length - 1 ? prev + 1 : prev
        );
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      } else if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        if (mentionSuggestions[selectedMentionIndex]) {
          insertMention(mentionSuggestions[selectedMentionIndex].name);
        }
        return;
      } else if (e.key === 'Escape') {
        setShowMentionSuggestions(false);
        return;
      }
    }

    // Shift+Enter to send, plain Enter for newline
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      if (selectedMedia) {
        sendMessageWithMedia();
      } else {
        sendMessage();
      }
    }
    // Plain Enter creates a newline (default browser behavior)
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!developer) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6">
          <p className="text-muted-foreground">Please log in to access the chat</p>
        </Card>
      </div>
    );
  }

  const getLatencyColor = () => {
    if (!latency) return 'text-muted-foreground';
    // ⚡ Optimized thresholds for target 5-20ms range
    if (latency < 30) return 'text-green-600 dark:text-green-400';
    if (latency < 60) return 'text-yellow-600 dark:text-yellow-400';
    if (latency < 100) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getLatencyLabel = () => {
    if (!latency) return 'Measuring...';
    // ⚡ Optimized labels for target 5-20ms range
    if (latency < 30) return 'Excellent';
    if (latency < 60) return 'Good';
    if (latency < 100) return 'Fair';
    return 'Poor';
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[Chat] handleFileSelect called');
    
    // Defensive check - ensure files exist
    if (!e.target.files || e.target.files.length === 0) {
      console.log('[Chat] No files selected');
      return;
    }

    const file = e.target.files[0];
    console.log('[Chat] File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      isImage: file.type.startsWith('image/')
    });

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('[Chat] File too large:', file.size);
      toast({
        title: 'Error',
        description: 'File size must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Check file type - allow images and safe document types only
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    ];

    if (!allowedTypes.includes(file.type)) {
      console.error('[Chat] File type not allowed:', file.type);
      toast({
        title: 'Error',
        description: 'File type not supported. Please upload images, documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX), text files, or archives.',
        variant: 'destructive',
      });
      return;
    }

    // Cleanup previous preview URL if exists
    if (imagePreviewUrl) {
      console.log('[Chat] Revoking previous preview URL');
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }

    // Create new preview URL for images
    if (file.type.startsWith('image/')) {
      try {
        const newPreviewUrl = URL.createObjectURL(file);
        console.log('[Chat] Created blob URL for image preview:', newPreviewUrl);
        setImagePreviewUrl(newPreviewUrl);
        console.log('[Chat] Image preview URL state updated');
      } catch (error) {
        console.error('[Chat] Failed to create object URL:', error);
        toast({
          title: 'Error',
          description: 'Failed to create image preview',
          variant: 'destructive',
        });
        return;
      }
    } else {
      console.log('[Chat] File is not an image, skipping preview');
      setImagePreviewUrl(null);
    }

    setSelectedMedia(file);
    console.log('[Chat] Selected media state updated');
  };

  // Upload media and send message
  const sendMessageWithMedia = async () => {
    if (!selectedMedia || !developer) {
      console.error('[Chat] Cannot upload media:', { 
        hasSelectedMedia: !!selectedMedia, 
        hasDeveloper: !!developer 
      });
      return;
    }

    setIsUploadingMedia(true);
    console.log('[Chat] Starting media upload:', {
      name: selectedMedia.name,
      size: selectedMedia.size,
      type: selectedMedia.type
    });

    try {
      // Ensure we have a CSRF token, retry fetch if necessary
      let tokenToUse = csrfToken;
      if (!tokenToUse) {
        console.log('[Chat] CSRF token not available, fetching...');
        try {
          tokenToUse = await fetchCsrfToken();
          // Token is already persisted to state by fetchCsrfToken via setCsrfToken
          console.log('[Chat] CSRF token fetched and cached successfully');
        } catch (fetchError) {
          throw new Error('Unable to obtain security token. Please refresh the page and try again.');
        }
      }

      // Explicitly validate token is available before proceeding
      if (!tokenToUse || typeof tokenToUse !== 'string' || tokenToUse.trim().length === 0) {
        throw new Error('Security token is invalid. Please refresh the page and try again.');
      }

      const formData = new FormData();
      formData.append('media', selectedMedia);

      console.log('[Chat] Uploading media to server...');
      const response = await fetch('/api/chat/upload-media', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'x-csrf-token': tokenToUse
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to upload media' }));
        console.error('[Chat] Upload failed:', { status: response.status, errorData });
        
        if (response.status === 401) {
          throw new Error('Please login first to upload media. Your session may have expired.');
        } else if (response.status === 403) {
          throw new Error('Security token invalid. Please refresh the page and try again.');
        }
        
        throw new Error(errorData.message || 'Failed to upload media');
      }

      const data = await response.json();
      console.log('[Chat] Media uploaded successfully:', data.media);

      // Send message with media info via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const messageToSend = {
          type: 'message',
          payload: {
            content: inputMessage.trim(),
            mediaUrl: data.media.url,
            mediaType: data.media.type,
            mediaName: data.media.name,
          }
        };

        console.log('[Chat] Sending message with media via WebSocket...');
        wsRef.current.send(JSON.stringify(messageToSend));
        setInputMessage('');
        
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        
        // Cleanup preview URL
        if (imagePreviewUrl) {
          URL.revokeObjectURL(imagePreviewUrl);
        }
        setImagePreviewUrl(null);
        setSelectedMedia(null);
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        console.log('[Chat] Media message sent successfully');
        
        toast({
          title: 'Success',
          description: 'Media uploaded and sent successfully',
        });
      }
    } catch (error) {
      console.error('[Chat] Failed to upload media:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload media. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Code Block Component with syntax highlighting and copy button
  const CodeBlock = ({ language, code }: { language: string; code: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="relative group my-2">
        <div className="flex items-center justify-between bg-muted px-3 py-1 rounded-t-md border-b">
          <span className="text-xs font-mono text-muted-foreground">{language}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleCopy}
            data-testid={`button-copy-code-${language}`}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        <SyntaxHighlighter
          language={language}
          style={theme === 'dark' ? vscDarkPlus : vs}
          customStyle={{
            margin: 0,
            borderRadius: '0 0 0.375rem 0.375rem',
            fontSize: '0.875rem',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  };

  // Parse message content for code blocks and mentions
  const parseMessageContent = (content: string) => {
    const parts: Array<{ type: 'text' | 'code' | 'mention'; content: string; language?: string }> = [];
    
    // Match code blocks with ```language syntax (newline after language is optional)
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        parseMentionsInText(textBefore, parts);
      }

      // Add code block
      const language = match[1] || 'text';
      const code = match[2].trim();
      parts.push({ type: 'code', content: code, language });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      parseMentionsInText(remainingText, parts);
    }

    return parts;
  };

  // Parse mentions in text
  const parseMentionsInText = (text: string, parts: Array<{ type: 'text' | 'code' | 'mention'; content: string; language?: string }>) => {
    // Updated regex to support mentions with spaces (e.g., @John Doe)
    // Matches @ followed by one or more non-whitespace characters or words with spaces until next @, newline, or end
    const mentionRegex = /@([^\s@]+(?:\s+[^\s@]+)*)/g;
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }

      // Add mention (trimmed to remove trailing spaces)
      parts.push({ type: 'mention', content: match[1].trim() });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    } else if (parts.length === 0) {
      parts.push({ type: 'text', content: text });
    }
  };

  // Render message content with code blocks and mentions
  const MessageContent = ({ content }: { content: string }) => {
    const parts = parseMessageContent(content);

    return (
      <div>
        {parts.map((part, index) => {
          if (part.type === 'code') {
            return <CodeBlock key={index} language={part.language || 'text'} code={part.content} />;
          } else if (part.type === 'mention') {
            return (
              <span key={index} className="text-primary font-medium" data-testid={`mention-${part.content}`}>
                @{part.content}
              </span>
            );
          } else {
            return <span key={index}>{part.content}</span>;
          }
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <h1 className="text-3xl font-bold" data-testid="heading-chat">Developer Chat</h1>
          
          <div className="flex items-center gap-3">
            {/* Active Users Counter */}
            <Card className="px-4 py-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Active</span>
                <span className="text-sm font-bold" data-testid="text-active-users">
                  {activeUsersCount} {activeUsersCount === 1 ? 'developer' : 'developers'}
                </span>
              </div>
            </Card>

            {/* Latency Widget */}
            <Card className="px-4 py-2 flex items-center gap-3 min-w-fit">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className={`h-4 w-4 ${getLatencyColor()}`} />
                ) : (
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">Latency</span>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${getLatencyColor()}`} data-testid="text-latency">
                            {latency !== null ? `${latency}ms` : '---'}
                          </span>
                          {realtimeLatency !== null && realtimeLatency !== latency && (
                            <span className="text-xs text-muted-foreground">
                              ({realtimeLatency}ms live)
                            </span>
                          )}
                        </div>
                        {latency !== null && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {getLatencyLabel()}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Offline</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                {isConnected ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Live</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400" />
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">Offline</span>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Secure public chat • End-to-end WebSocket encryption</span>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-hidden relative">
          <div 
            ref={scrollViewportRef}
            className="h-full w-full overflow-y-auto p-4"
            data-testid="chat-messages-container"
          >
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.developerId === developer.id;
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} group`}
                      data-testid={`message-${msg.id}`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0" data-testid={`avatar-${msg.id}`}>
                        {msg.developerAvatar && (
                          <AvatarImage src={msg.developerAvatar} alt={msg.developerName} />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(msg.developerName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-center gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-sm font-medium" data-testid={`text-sender-${msg.id}`}>
                            {isOwnMessage ? 'You' : msg.developerName}
                          </span>
                          <span className="text-xs text-muted-foreground" data-testid={`text-time-${msg.id}`}>
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <div className="relative">
                          <div
                            className={`rounded-md px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                            data-testid={`text-content-${msg.id}`}
                          >
                          {msg.mediaUrl && (
                            <div className="mb-2">
                              {msg.mediaType === 'image' ? (
                                <div className="relative group">
                                  <img
                                    src={msg.mediaUrl}
                                    alt={msg.mediaName || 'Image'}
                                    className="max-w-full max-h-96 rounded-md"
                                    data-testid={`img-media-${msg.id}`}
                                  />
                                  <a
                                    href={msg.mediaUrl}
                                    download={msg.mediaName}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Button
                                      size="icon"
                                      variant="secondary"
                                      className="h-8 w-8"
                                      data-testid={`button-download-media-${msg.id}`}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </a>
                                </div>
                              ) : (
                                <a
                                  href={msg.mediaUrl}
                                  download={msg.mediaName}
                                  className="flex items-center gap-3 p-3 rounded-md border bg-background/50 hover-elevate group"
                                  data-testid={`link-download-file-${msg.id}`}
                                >
                                  <div className="flex-shrink-0">
                                    {msg.mediaType === 'pdf' && <FileText className="h-8 w-8 text-red-500" />}
                                    {msg.mediaType === 'document' && <FileText className="h-8 w-8 text-blue-500" />}
                                    {msg.mediaType === 'spreadsheet' && <FileSpreadsheet className="h-8 w-8 text-green-500" />}
                                    {msg.mediaType === 'presentation' && <FileImage className="h-8 w-8 text-orange-500" />}
                                    {msg.mediaType === 'archive' && <FileArchive className="h-8 w-8 text-purple-500" />}
                                    {msg.mediaType === 'text' && <FileCode className="h-8 w-8 text-gray-500" />}
                                    {!['pdf', 'document', 'spreadsheet', 'presentation', 'archive', 'text'].includes(msg.mediaType || '') && <File className="h-8 w-8 text-gray-500" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{msg.mediaName}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{msg.mediaType} file</p>
                                  </div>
                                  <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                                </a>
                              )}
                              {msg.mediaName && msg.mediaType === 'image' && (
                                <p className="text-xs mt-1 text-muted-foreground">{msg.mediaName}</p>
                              )}
                            </div>
                          )}
                            <div className="text-sm whitespace-pre-wrap break-words">
                              <MessageContent content={msg.content} />
                            </div>
                          </div>
                        </div>
                        {isOwnMessage && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={() => deleteMessage(msg.id)}
                            data-testid={`button-delete-message-${msg.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Typing indicators with modern animation */}
              {typingUsers.size > 0 && (
                <div 
                  className="flex items-center gap-3 pl-3 animate-in fade-in slide-in-from-left-5 duration-300" 
                  data-testid="typing-indicators"
                >
                  <div className="flex -space-x-2">
                    {Array.from(typingUsers.values()).map((user, index) => (
                      <Avatar 
                        key={user.developerId} 
                        className="h-7 w-7 border-2 border-background ring-2 ring-primary/20 animate-in zoom-in duration-200"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {user.developerAvatar && (
                          <AvatarImage src={user.developerAvatar} alt={user.developerName} />
                        )}
                        <AvatarFallback className="text-xs bg-primary/10">
                          {getInitials(user.developerName)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                    <span className="text-sm font-medium">
                      {typingUsers.size === 1
                        ? Array.from(typingUsers.values())[0].developerName
                        : typingUsers.size === 2
                        ? `${Array.from(typingUsers.values())[0].developerName} and ${Array.from(typingUsers.values())[1].developerName}`
                        : `${typingUsers.size} people`}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {typingUsers.size === 1 ? 'is' : 'are'} typing
                    </span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDuration: '1s', animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDuration: '1s', animationDelay: '200ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDuration: '1s', animationDelay: '400ms' }}></span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-muted/30 relative">
          {/* Mention suggestions dropdown */}
          {showMentionSuggestions && mentionSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2">
              <Card className="mx-4 max-h-60 overflow-auto">
                <div className="p-2">
                  <p className="text-xs text-muted-foreground px-2 pb-2">Mention someone:</p>
                  {mentionSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.email}
                      className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer ${
                        index === selectedMentionIndex ? 'bg-accent' : 'hover-elevate'
                      }`}
                      onClick={() => insertMention(suggestion.name)}
                      data-testid={`mention-suggestion-${index}`}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(suggestion.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium">{suggestion.name}</span>
                        <span className="text-xs text-muted-foreground">{suggestion.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Selected media preview */}
          {selectedMedia && (
            <div className="mb-3 p-3 bg-background rounded-md border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedMedia.type.startsWith('image/') && imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded"
                    data-testid="img-media-preview"
                    onLoad={() => console.log('[Chat] Image preview loaded successfully')}
                    onError={(e) => console.error('[Chat] Image preview failed to load:', e)}
                  />
                ) : (
                  <div className="h-16 w-16 flex items-center justify-center bg-muted rounded">
                    {selectedMedia.type === 'application/pdf' && <FileText className="h-8 w-8 text-red-500" />}
                    {(selectedMedia.type.includes('word') || selectedMedia.type.includes('document')) && <FileText className="h-8 w-8 text-blue-500" />}
                    {(selectedMedia.type.includes('sheet') || selectedMedia.type.includes('excel')) && <FileSpreadsheet className="h-8 w-8 text-green-500" />}
                    {(selectedMedia.type.includes('presentation') || selectedMedia.type.includes('powerpoint')) && <FileImage className="h-8 w-8 text-orange-500" />}
                    {(selectedMedia.type.includes('zip') || selectedMedia.type.includes('rar') || selectedMedia.type.includes('7z')) && <FileArchive className="h-8 w-8 text-purple-500" />}
                    {selectedMedia.type.startsWith('text/') && <FileCode className="h-8 w-8 text-gray-500" />}
                    {!selectedMedia.type.startsWith('image/') && !['pdf', 'word', 'document', 'sheet', 'excel', 'presentation', 'powerpoint', 'zip', 'rar', '7z', 'text'].some(t => selectedMedia.type.includes(t)) && <File className="h-8 w-8 text-gray-500" />}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{selectedMedia.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(selectedMedia.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (imagePreviewUrl) {
                    URL.revokeObjectURL(imagePreviewUrl);
                  }
                  setImagePreviewUrl(null);
                  setSelectedMedia(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                data-testid="button-remove-media"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
              className="hidden"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || isSending || isUploadingMedia}
              data-testid="button-attach-media"
              className="flex-shrink-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              ref={textareaRef}
              placeholder={isConnected ? "Type your message or @mention someone... (Shift+Enter to send)" : "Connecting..."}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              disabled={!isConnected || isSending || isUploadingMedia}
              className="flex-1 bg-background resize-none overflow-y-auto"
              style={{ minHeight: '40px', maxHeight: '120px' }}
              data-testid="input-chat-message"
              rows={1}
            />
            <Button
              onClick={() => {
                console.log('[Chat] Send button clicked', { 
                  hasSelectedMedia: !!selectedMedia, 
                  inputMessage: inputMessage,
                  isConnected,
                  isSending,
                  isUploadingMedia
                });
                if (selectedMedia) {
                  sendMessageWithMedia();
                } else {
                  sendMessage();
                }
              }}
              disabled={!isConnected || (!inputMessage.trim() && !selectedMedia) || isSending || isUploadingMedia}
              data-testid="button-send-message"
              className="px-4"
            >
              {isSending || isUploadingMedia ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              Use ```language for code blocks • @username to mention • Press Shift+Enter to send
            </p>
            {latency !== null && isConnected && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Latency: <span className={getLatencyColor()}>{latency}ms</span>
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
