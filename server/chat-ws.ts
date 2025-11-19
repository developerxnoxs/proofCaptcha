import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { getStorage } from './storage';
import type { InsertChatMessage } from '@shared/schema';
import type { IncomingMessage } from 'http';
import { parse as parseCookie } from 'cookie';
import signature from 'cookie-signature';

export interface AuthenticatedWebSocket extends WebSocket {
  developerId?: string;
  developerName?: string;
  developerEmail?: string;
  developerAvatar?: string | null;
  isAlive?: boolean;
  isTyping?: boolean;
}

// Helper function to broadcast active users count
function broadcastActiveUsersCount(wss: WebSocketServer) {
  const activeUsers = Array.from(wss.clients as Set<AuthenticatedWebSocket>)
    .filter(client => client.readyState === WebSocket.OPEN && client.developerId)
    .length;

  const message = JSON.stringify({
    type: 'active_users',
    payload: { count: activeUsers }
  });

  wss.clients.forEach((client: AuthenticatedWebSocket) => {
    if (client.readyState === WebSocket.OPEN && client.developerId) {
      try {
        client.send(message);
      } catch (error) {
        console.error('[WebSocket] Error broadcasting active users count:', error);
      }
    }
  });
}

// Parse session from cookie
function parseSessionFromRequest(req: IncomingMessage, sessionSecret: string): any {
  try {
    const cookies = parseCookie(req.headers.cookie || '');
    const sessionCookie = cookies['connect.sid'];
    
    if (!sessionCookie) {
      return null;
    }

    // Remove 's:' prefix and decode signature
    const cookieValue = sessionCookie.startsWith('s:') ? sessionCookie.slice(2) : sessionCookie;
    const unsigned = signature.unsign(cookieValue, sessionSecret);
    
    if (!unsigned) {
      return null;
    }

    // For express-session with default memory store, the session ID is just the unsigned value
    // The actual session data is in memory, we'll need to validate differently
    return { sessionId: unsigned };
  } catch (error) {
    console.error('[WebSocket] Error parsing session:', error);
    return null;
  }
}

export async function setupChatWebSocket(server: Server, sessionSecret: string, getSessionStore: () => any) {
  const wss = new WebSocketServer({ 
    noServer: true,
  });

  const storage = await getStorage();

  // Handle WebSocket upgrade with session validation
  server.on('upgrade', (request: IncomingMessage, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    
    if (url.pathname === '/ws/chat') {
      // Parse session from cookie
      const sessionInfo = parseSessionFromRequest(request, sessionSecret);
      const clientIP = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
      
      if (!sessionInfo) {
        console.log(`[WebSocket] SECURITY: No valid session cookie from IP ${clientIP}`);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Get session data from store
      const sessionStore = getSessionStore();
      sessionStore.get(sessionInfo.sessionId, (err: any, sessionData: any) => {
        if (err || !sessionData || !sessionData.developerId) {
          console.log(`[WebSocket] SECURITY: Invalid or unauthenticated session ID ${sessionInfo.sessionId} from IP ${clientIP}`);
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        // Attach session data to request for connection handler
        (request as any).sessionData = sessionData;

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      });
    }
  });

  // Heartbeat mechanism to detect dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.isAlive === false) {
        console.log('[WebSocket] Terminating dead connection');
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds

  wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    const sessionData = (req as any).sessionData;
    
    if (!sessionData || !sessionData.developerId) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    // Fetch full developer info from database
    const developer = await storage.getDeveloperById(sessionData.developerId);
    
    if (!developer) {
      ws.close(1008, 'Developer not found');
      return;
    }

    // Authenticate the WebSocket connection with server-verified identity
    ws.developerId = developer.id;
    ws.developerName = developer.name;
    ws.developerEmail = developer.email;
    ws.developerAvatar = developer.avatar;
    ws.isAlive = true;
    ws.isTyping = false;

    console.log(`[WebSocket] User authenticated: ${developer.email}`);
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    ws.on('message', async (data) => {
      try {
        // Parse incoming message
        let message;
        try {
          message = JSON.parse(data.toString());
        } catch (parseError) {
          console.error('[WebSocket] JSON parse error:', parseError);
          ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Invalid message format - must be valid JSON' }
          }));
          return;
        }

        // Validate message structure
        if (!message || typeof message !== 'object') {
          console.error('[WebSocket] Invalid message structure:', message);
          ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Invalid message structure' }
          }));
          return;
        }

        // Validate message type
        if (!message.type) {
          console.error('[WebSocket] Missing message type:', message);
          ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Message type is required' }
          }));
          return;
        }
        
        // ⚡ PERFORMANCE: Handle ping IMMEDIATELY before any async operations
        // This ensures minimal latency for RTT measurement (<5ms instead of 100-1000ms)
        if (message.type === 'ping') {
          const timestamp = message.payload?.timestamp || Date.now();
          const serverTime = Date.now();
          
          try {
            ws.send(JSON.stringify({
              type: 'pong',
              payload: { 
                timestamp,
                serverTime,
                rtt: serverTime - timestamp
              }
            }));
          } catch (error) {
            console.error('[WebSocket] Error sending pong:', error);
          }
          return; // Exit immediately, don't process any other logic
        }
        
        // Handle chat message (no encryption, just plain text for public chat)
        if (message.type === 'message') {
          // Validate payload exists
          if (!message.payload || typeof message.payload !== 'object') {
            console.error('[WebSocket] Invalid payload structure:', message);
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Invalid payload structure' }
            }));
            return;
          }

          const { content, mediaUrl, mediaType, mediaName } = message.payload;

          // Validate that content is a string (can be empty if media is present)
          if (content === undefined || content === null || typeof content !== 'string') {
            console.error('[WebSocket] Invalid content type:', { content });
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Content must be a string' }
            }));
            return;
          }

          // Trim and validate
          const trimmedContent = content.trim();
          
          // Require either content OR media
          if (trimmedContent.length === 0 && !mediaUrl) {
            console.error('[WebSocket] Empty message:', { content, mediaUrl });
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Message must contain text or media attachment' }
            }));
            return;
          }

          // Validate message length (only if content is not empty)
          if (trimmedContent.length > 5000) {
            console.error('[WebSocket] Content too long:', trimmedContent.length);
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Message too long (max 5000 characters)' }
            }));
            return;
          }

          // Verify user is still authenticated
          if (!ws.developerId || !ws.developerName || !ws.developerEmail) {
            console.error('[WebSocket] User not authenticated:', { developerId: ws.developerId });
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Authentication required' }
            }));
            return;
          }

          // Save plain text message to database (use server-verified identity)
          const chatMessage: InsertChatMessage = {
            developerId: ws.developerId,
            developerName: ws.developerName,
            developerEmail: ws.developerEmail,
            developerAvatar: ws.developerAvatar,
            content: trimmedContent,
            // Include media fields if present
            ...(mediaUrl && { mediaUrl }),
            ...(mediaType && { mediaType }),
            ...(mediaName && { mediaName }),
          };

          let savedMessage;
          try {
            savedMessage = await storage.createChatMessage(chatMessage);
            console.log(`[WebSocket] Message saved to storage:`, { id: savedMessage.id, from: ws.developerEmail });
          } catch (storageError) {
            console.error('[WebSocket] Storage error:', storageError);
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Failed to save message to database' }
            }));
            return;
          }

          // Broadcast message to all authenticated clients
          const broadcastMessage = {
            type: 'message',
            payload: {
              id: savedMessage.id,
              developerId: savedMessage.developerId,
              developerName: savedMessage.developerName,
              developerEmail: savedMessage.developerEmail,
              developerAvatar: savedMessage.developerAvatar,
              content: savedMessage.content,
              createdAt: savedMessage.createdAt,
              // Include media fields if present
              ...(savedMessage.mediaUrl && { mediaUrl: savedMessage.mediaUrl }),
              ...(savedMessage.mediaType && { mediaType: savedMessage.mediaType }),
              ...(savedMessage.mediaName && { mediaName: savedMessage.mediaName }),
            }
          };

          let broadcastCount = 0;
          wss.clients.forEach((client: AuthenticatedWebSocket) => {
            if (client.readyState === WebSocket.OPEN && client.developerId) {
              try {
                client.send(JSON.stringify(broadcastMessage));
                broadcastCount++;
              } catch (sendError) {
                console.error('[WebSocket] Error sending to client:', sendError);
              }
            }
          });

          console.log(`[WebSocket] Message broadcasted from ${ws.developerEmail} to ${broadcastCount} clients`);
        } else if (message.type === 'typing') {
          // Handle typing indicator
          // Validate payload
          if (!message.payload || typeof message.payload !== 'object') {
            console.log('[WebSocket] Invalid typing payload');
            return;
          }

          const { isTyping } = message.payload;

          // Validate typing status
          if (typeof isTyping !== 'boolean') {
            console.log('[WebSocket] Invalid typing status type');
            return;
          }

          // Verify user is authenticated
          if (!ws.developerId || !ws.developerName) {
            console.log('[WebSocket] User not authenticated for typing indicator');
            return;
          }

          // Only broadcast if typing state has changed
          if (ws.isTyping === isTyping) {
            console.log(`[WebSocket] Typing state unchanged for ${ws.developerName}: ${isTyping}`);
            return;
          }

          // Update typing state
          ws.isTyping = isTyping;
          console.log(`[WebSocket] ${ws.developerName} typing status: ${isTyping}`);

          // Broadcast typing status to all other authenticated clients (except sender)
          const typingMessage = {
            type: 'typing',
            payload: {
              developerId: ws.developerId,
              developerName: ws.developerName,
              developerAvatar: ws.developerAvatar,
              isTyping: isTyping,
            }
          };

          let broadcastCount = 0;
          wss.clients.forEach((client: AuthenticatedWebSocket) => {
            // Don't send to the sender themselves
            if (client.readyState === WebSocket.OPEN && client.developerId && client.developerId !== ws.developerId) {
              try {
                client.send(JSON.stringify(typingMessage));
                broadcastCount++;
              } catch (sendError) {
                console.error('[WebSocket] Error sending typing indicator:', sendError);
              }
            }
          });
          console.log(`[WebSocket] Typing indicator from ${ws.developerName} broadcasted to ${broadcastCount} clients`);
        } else if (message.type === 'delete_message') {
          // Handle delete message
          if (!message.payload || typeof message.payload !== 'object') {
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Invalid payload structure' }
            }));
            return;
          }

          const { messageId } = message.payload;

          if (!messageId || typeof messageId !== 'string') {
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Message ID is required' }
            }));
            return;
          }

          // Verify user is authenticated
          if (!ws.developerId) {
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Authentication required' }
            }));
            return;
          }

          // Delete message from storage (only if user owns the message)
          try {
            const deleted = await storage.deleteChatMessage(messageId, ws.developerId);
            
            if (!deleted) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { error: 'Message not found or you are not authorized to delete it' }
              }));
              return;
            }

            console.log(`[WebSocket] Message deleted: ${messageId} by ${ws.developerEmail}`);

            // Broadcast delete event to all authenticated clients
            const deleteMessage = {
              type: 'message_deleted',
              payload: { messageId }
            };

            let broadcastCount = 0;
            wss.clients.forEach((client: AuthenticatedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && client.developerId) {
                try {
                  client.send(JSON.stringify(deleteMessage));
                  broadcastCount++;
                } catch (sendError) {
                  console.error('[WebSocket] Error broadcasting delete:', sendError);
                }
              }
            });

            console.log(`[WebSocket] Delete broadcasted to ${broadcastCount} clients`);
          } catch (error) {
            console.error('[WebSocket] Error deleting message:', error);
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Failed to delete message' }
            }));
          }
        } else {
          console.log(`[WebSocket] Ignoring unknown message type: ${message.type}`);
        }

      } catch (error) {
        console.error('[WebSocket] Unexpected error processing message:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        ws.send(JSON.stringify({
          type: 'error',
          payload: { error: `Failed to process message: ${errorMessage}` }
        }));
      }
    });

    ws.on('close', () => {
      console.log(`[WebSocket] Connection closed: ${ws.developerEmail}`);
      
      // If user was typing, broadcast stop typing to other clients
      if (ws.isTyping && ws.developerId) {
        const stopTypingMessage = {
          type: 'typing',
          payload: {
            developerId: ws.developerId,
            developerName: ws.developerName,
            developerAvatar: ws.developerAvatar,
            isTyping: false,
          }
        };

        wss.clients.forEach((client: AuthenticatedWebSocket) => {
          if (client.readyState === WebSocket.OPEN && client.developerId && client.developerId !== ws.developerId) {
            try {
              client.send(JSON.stringify(stopTypingMessage));
            } catch (sendError) {
              console.error('[WebSocket] Error sending stop typing on disconnect:', sendError);
            }
          }
        });
      }

      // Broadcast updated active users count
      broadcastActiveUsersCount(wss);
    });

    // Send authentication success message
    ws.send(JSON.stringify({
      type: 'auth_success',
      payload: { 
        message: 'Connected successfully',
        developer: {
          id: ws.developerId,
          name: ws.developerName,
          email: ws.developerEmail
        }
      }
    }));

    // Broadcast updated active users count
    broadcastActiveUsersCount(wss);
  });

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  console.log('[WebSocket] Chat server ready at /ws/chat');

  return wss;
}
