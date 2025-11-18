import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface ChatMessage {
  id: string;
  developerId: string;
  developerName: string;
  developerEmail: string;
  developerAvatar: string | null;
  content: string;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyTypingRef = useRef<boolean>(false);

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
    };
  }, [developer]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive or typing users change
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  // Send typing indicator to server
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    try {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        payload: { isTyping }
      }));
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, []);

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
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'auth_success') {
          console.log('[Chat] WebSocket authenticated successfully');
          setIsConnected(true);
          setIsSending(false);
        } else if (data.type === 'message') {
          console.log('[Chat] Received new message');
          const msg: ChatMessage = data.payload;
          setMessages(prev => [...prev, msg]);
          setIsSending(false);
        } else if (data.type === 'typing') {
          console.log('[Chat] Received typing indicator');
          const { developerId, developerName, developerAvatar, isTyping } = data.payload;
          
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            if (isTyping) {
              newMap.set(developerId, { developerId, developerName, developerAvatar });
            } else {
              newMap.delete(developerId);
            }
            return newMap;
          });
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
    };

    ws.onclose = (event) => {
      console.log('[Chat] WebSocket closed. Code:', event.code, 'Reason:', event.reason);
      setIsConnected(false);
      setIsSending(false);
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (developer) {
          console.log('[Chat] Attempting to reconnect...');
          connectWebSocket();
        }
      }, 3000);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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

  return (
    <div className="container mx-auto p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-chat">Developer Chat</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Secure public chat for all developers • WSS encrypted transport</span>
          {isConnected ? (
            <span className="ml-auto flex items-center gap-1 text-green-600 dark:text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1 text-red-600 dark:text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400" />
              Disconnected
            </span>
          )}
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
                      className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
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
                        <div
                          className={`rounded-md px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                          data-testid={`text-content-${msg.id}`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Typing indicators */}
              {typingUsers.size > 0 && (
                <div className="flex items-center gap-2 pl-3" data-testid="typing-indicators">
                  <div className="flex -space-x-2">
                    {Array.from(typingUsers.values()).map((user) => (
                      <Avatar key={user.developerId} className="h-6 w-6 border-2 border-background">
                        {user.developerAvatar && (
                          <AvatarImage src={user.developerAvatar} alt={user.developerName} />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(user.developerName)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>
                      {typingUsers.size === 1
                        ? `${Array.from(typingUsers.values())[0].developerName} is typing`
                        : typingUsers.size === 2
                        ? `${Array.from(typingUsers.values())[0].developerName} and ${Array.from(typingUsers.values())[1].developerName} are typing`
                        : `${typingUsers.size} people are typing`}
                    </span>
                    <span className="flex gap-0.5">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder={isConnected ? "Type your message..." : "Connecting..."}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={!isConnected || isSending}
              className="flex-1"
              data-testid="input-chat-message"
            />
            <Button
              onClick={sendMessage}
              disabled={!isConnected || !inputMessage.trim() || isSending}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </Card>
    </div>
  );
}
