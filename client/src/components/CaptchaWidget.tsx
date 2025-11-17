import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2, CheckCircle2, XCircle, Bot, X, UserCheck, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { solveProofOfWork } from "@/lib/captcha-solver";
import { apiRequest } from "@/lib/queryClient";
import { detectClientAutomation } from "@/lib/automation-detector";
import { generateJigsawPath } from "@shared/puzzle-utils";
import { 
  isEncryptionAvailable, 
  performHandshake, 
  decryptChallengeData,
  encryptSolutionData,
  clearSession,
  type EncryptedPayload
} from "@/lib/encryption";
import UpsideDownCaptcha from "./UpsideDownCaptcha";

interface CaptchaWidgetProps {
  publicKey: string;
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  type?: "grid" | "jigsaw" | "gesture" | "upside_down" | "random";
}

export default function CaptchaWidget({
  publicKey,
  onSuccess,
  onError,
  type = "random",
}: CaptchaWidgetProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "solving" | "success" | "error" | "blocked">("idle");
  const [showOverlay, setShowOverlay] = useState(false);
  const [challenge, setChallenge] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [actualType, setActualType] = useState<"grid" | "jigsaw" | "gesture" | "upside_down" | null>(null);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [jigsawPieces, setJigsawPieces] = useState<number[]>([]);
  const [blockExpiresAt, setBlockExpiresAt] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>("");
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [sessionEstablished, setSessionEstablished] = useState(false);

  // Ref to track challenge timeout ID for manual cleanup
  const challengeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to store onError callback without causing effect re-run
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Perform handshake on mount to establish encrypted session
  useEffect(() => {
    async function initEncryption() {
      if (!isEncryptionAvailable()) {
        console.warn('[ENCRYPTION] Web Crypto API not available, using plaintext mode');
        setEncryptionEnabled(false);
        return;
      }

      try {
        const session = await performHandshake(publicKey);
        if (session) {
          setSessionEstablished(true);
          setEncryptionEnabled(true);
          console.log('[ENCRYPTION] Session established successfully');
        } else {
          console.warn('[ENCRYPTION] Handshake failed, falling back to plaintext');
          setEncryptionEnabled(false);
        }
      } catch (error) {
        console.error('[ENCRYPTION] Handshake error:', error);
        setEncryptionEnabled(false);
      }
    }

    initEncryption();

    // Cleanup on unmount
    return () => {
      clearSession();
    };
  }, [publicKey]);

  useEffect(() => {
    if (status !== "blocked" || !blockExpiresAt) {
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = blockExpiresAt - now;

      if (remaining <= 0) {
        setStatus("idle");
        setBlockExpiresAt(null);
        setRemainingTime("");
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      if (hours > 0) {
        setRemainingTime(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setRemainingTime(`${minutes}m ${seconds}s`);
      } else {
        setRemainingTime(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [status, blockExpiresAt]);

  // Challenge timeout: Auto-close overlay after 1 minute if not verified
  // Key: Only depend on showOverlay to prevent timer reset on status/callback changes
  useEffect(() => {
    // Clear any existing timeout when overlay closes
    if (!showOverlay) {
      if (challengeTimeoutRef.current) {
        clearTimeout(challengeTimeoutRef.current);
        challengeTimeoutRef.current = null;
      }
      return;
    }

    // Start new timeout when overlay opens (keyed only to overlay state)
    challengeTimeoutRef.current = setTimeout(() => {
      // Check status at timeout execution time, not at effect setup time
      setStatus((currentStatus) => {
        if (currentStatus !== "success") {
          setShowOverlay(false);
          onErrorRef.current?.("Challenge expired - time limit exceeded");
          return "error";
        }
        return currentStatus;
      });
    }, 60000); // 1 minute

    return () => {
      if (challengeTimeoutRef.current) {
        clearTimeout(challengeTimeoutRef.current);
        challengeTimeoutRef.current = null;
      }
    };
  }, [showOverlay]);

  // Verification timeout: Auto-reset after 1 minute if verified but token not used
  useEffect(() => {
    if (status !== "success") {
      return;
    }

    const timeoutId = setTimeout(() => {
      setStatus((currentStatus) => {
        if (currentStatus === "success") {
          setChallenge(null);
          setToken("");
          setProgress(0);
          setAttempts(0);
          setSelectedCells([]);
          setJigsawPieces([]);
          setDragPosition({ x: 0, y: 0 });
          onErrorRef.current?.("Verification expired - token not used within time limit");
          return "idle";
        }
        return currentStatus;
      });
    }, 60000); // 1 minute

    return () => clearTimeout(timeoutId);
  }, [status]);

  const handleCheckboxClick = async () => {
    if (status !== "idle" && status !== "error") return;

    setStatus("loading");
    setShowOverlay(true);

    try {
      const clientDetections = detectClientAutomation();
      
      // Encode request body
      const requestBody = { 
        publicKey, 
        type, 
        clientDetections
      };
      const jsonString = JSON.stringify(requestBody);
      const encodedBody = btoa(jsonString);
      
      const response = await fetch("/api/captcha/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: encodedBody }),
        credentials: "include",
      });
      
      // Decode response
      const rawData = await response.json();
      let data: any;
      
      if (rawData.data) {
        try {
          const decodedString = atob(rawData.data);
          data = JSON.parse(decodedString);
        } catch (decodeError) {
          console.error('[REQUEST] Failed to decode response:', decodeError);
          throw new Error('Failed to decode server response');
        }
      } else {
        data = rawData;
      }
      
      if (!response.ok) {
        if (response.status === 429 && data.error === "IP blocked") {
          const remainingMinutes = data.remainingTime || 0;
          const expiresAt = Date.now() + (remainingMinutes * 60 * 1000);
          setBlockExpiresAt(expiresAt);
          setStatus("blocked");
          setShowOverlay(false);
          onError?.(data.message || "IP blocked due to too many failed attempts");
          return;
        }
        
        throw new Error(data.message || data.error || "Failed to generate challenge");
      }

      // Decrypt challenge if encrypted
      let challengeData: any;
      
      if (data.protocol === "encrypted-v1" && data.encrypted) {
        console.log('[ENCRYPTION] Received encrypted challenge, decrypting...');
        const decrypted = await decryptChallengeData(
          data.encrypted as EncryptedPayload,
          data.token,
          publicKey
        );

        if (!decrypted) {
          throw new Error('Failed to decrypt challenge data');
        }

        challengeData = decrypted;
        console.log('[ENCRYPTION] Challenge decrypted successfully');
      } else if (data.challenge) {
        // Plaintext mode
        challengeData = data.challenge;
        console.log('[ENCRYPTION] Using plaintext challenge');
      } else {
        throw new Error('Invalid challenge response format');
      }
      
      setChallenge(challengeData);
      setToken(data.token);
      setActualType(data.type);
      setStatus("idle");
    } catch (error) {
      console.error("Challenge generation error:", error);
      setStatus("error");
      setShowOverlay(false);
      onError?.(error instanceof Error ? error.message : "Failed to generate challenge");
    }
  };

  const closeOverlay = () => {
    setShowOverlay(false);
    setActualType(null);
    setChallenge(null);
    setSelectedCells([]);
    setJigsawPieces([]);
    setProgress(0);
    // Don't reset status to idle - preserve success/error states
  };

  const handleCheckboxVerify = async () => {
    if (!challenge || !token) return;

    setStatus("solving");
    setProgress(0);
    setAttempts(0);

    try {
      const solution = await solveProofOfWork(challenge, (hash, attemptCount) => {
        setAttempts(attemptCount);
        setProgress(Math.min((attemptCount / 50000) * 100, 95));
      });

      // Detect client-side automation again during verification
      const clientDetections = detectClientAutomation();

      // Encrypt solution if encryption is enabled
      let requestBody: any = { token, clientDetections };

      if (encryptionEnabled && sessionEstablished) {
        console.log('[ENCRYPTION] Encrypting solution...');
        const encrypted = await encryptSolutionData(solution, token, publicKey);
        
        if (!encrypted) {
          throw new Error('Failed to encrypt solution');
        }

        requestBody.encrypted = encrypted;
        requestBody.publicKey = publicKey;
        console.log('[ENCRYPTION] Solution encrypted successfully');
      } else {
        // Plaintext mode
        requestBody.solution = solution;
        console.log('[ENCRYPTION] Sending plaintext solution');
      }

      const response = await apiRequest("POST", "/api/captcha/verify", requestBody);

      const result = await response.json();
      
      if (result.blocked && result.message) {
        closeOverlay();
        setStatus("blocked");
        const remainingMinutes = result.remainingTime || 120;
        const expiresAt = Date.now() + (remainingMinutes * 60 * 1000);
        setBlockExpiresAt(expiresAt);
        onError?.(result.message);
        return;
      }
      
      if (result.success) {
        setProgress(100);
        setStatus("success");
        setTimeout(() => {
          closeOverlay();
          onSuccess?.(token);
        }, 1000);
      } else {
        setStatus("error");
        onError?.(result.error || "Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      onError?.(error instanceof Error ? error.message : "Verification failed");
    }
  };

  const handleGridCellClick = (cellIndex: number) => {
    if (status !== "idle") return;
    
    setSelectedCells((prev) => {
      if (prev.includes(cellIndex)) {
        return prev.filter((i) => i !== cellIndex);
      } else {
        return [...prev, cellIndex].sort((a, b) => a - b);
      }
    });
  };

  const handleGridVerify = async () => {
    if (!challenge || !token || selectedCells.length === 0) return;

    setStatus("solving");
    setProgress(50);

    try {
      // SECURITY: Solve proof-of-work to prevent ML-based automated solvers
      const powSolution = await solveProofOfWork(
        challenge,
        (hash, attempts) => {
          const powProgress = Math.min(50 + (attempts / 1000) * 25, 75);
          setProgress(powProgress);
        }
      );

      setProgress(80);

      // Create solution payload: {answer: [...], powSolution: "..."}
      const solutionPayload = {
        answer: selectedCells,
        powSolution,
      };
      const solution = JSON.stringify(solutionPayload);
      const clientDetections = detectClientAutomation();

      // Encrypt solution if encryption is enabled
      let requestBody: any = { token, clientDetections };

      if (encryptionEnabled && sessionEstablished) {
        const encrypted = await encryptSolutionData(solution, token, publicKey);
        if (!encrypted) {
          throw new Error('Failed to encrypt solution');
        }
        requestBody.encrypted = encrypted;
        requestBody.publicKey = publicKey;
      } else {
        requestBody.solution = solution;
      }
      
      const response = await apiRequest("POST", "/api/captcha/verify", requestBody);

      const result = await response.json();
      
      if (result.success) {
        setProgress(100);
        setStatus("success");
        setTimeout(() => {
          closeOverlay();
          onSuccess?.(token);
        }, 1000);
      } else {
        setStatus("error");
        onError?.(result.error || "Verification failed");
        
        // Auto-refresh challenge after 1.5 seconds if wrong
        setTimeout(() => {
          setSelectedCells([]);
          setJigsawPieces([]);
          setStatus("idle"); // Must set to idle first so handleCheckboxClick doesn't early return
          setTimeout(() => handleCheckboxClick(), 50);
        }, 1500);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      onError?.(error instanceof Error ? error.message : "Verification failed");
      
      // Auto-refresh on error
      setTimeout(() => {
        setSelectedCells([]);
        setJigsawPieces([]);
        setStatus("idle");
        setTimeout(() => handleCheckboxClick(), 50);
      }, 1500);
    }
  };

  const handleJigsawPieceClick = (pieceIndex: number) => {
    if (status !== "idle") return;
    
    setJigsawPieces((prev) => {
      if (prev.includes(pieceIndex)) {
        return prev.filter((i) => i !== pieceIndex);
      } else {
        return [...prev, pieceIndex];
      }
    });
  };

  const handleJigsawVerify = async () => {
    if (!challenge || !token || jigsawPieces.length !== 4) return;

    setStatus("solving");
    setProgress(50);

    try {
      // SECURITY: Solve proof-of-work to prevent ML-based automated solvers
      const powSolution = await solveProofOfWork(
        challenge,
        (hash, attempts) => {
          const powProgress = Math.min(50 + (attempts / 1000) * 25, 75);
          setProgress(powProgress);
        }
      );

      setProgress(80);

      // Create solution payload: {answer: [...], powSolution: "..."}
      const solutionPayload = {
        answer: jigsawPieces,
        powSolution,
      };
      const solution = JSON.stringify(solutionPayload);
      const clientDetections = detectClientAutomation();

      // Encrypt solution if encryption is enabled
      let requestBody: any = { token, clientDetections };

      if (encryptionEnabled && sessionEstablished) {
        const encrypted = await encryptSolutionData(solution, token, publicKey);
        if (!encrypted) {
          throw new Error('Failed to encrypt solution');
        }
        requestBody.encrypted = encrypted;
        requestBody.publicKey = publicKey;
      } else {
        requestBody.solution = solution;
      }
      
      const response = await apiRequest("POST", "/api/captcha/verify", requestBody);

      const result = await response.json();
      
      if (result.success) {
        setProgress(100);
        setStatus("success");
        setTimeout(() => {
          closeOverlay();
          onSuccess?.(token);
        }, 1000);
      } else {
        setStatus("error");
        onError?.(result.error || "Verification failed");
        
        // Auto-refresh challenge after 1.5 seconds if wrong
        setTimeout(() => {
          setSelectedCells([]);
          setJigsawPieces([]);
          setStatus("idle"); // Must set to idle first so handleCheckboxClick doesn't early return
          setTimeout(() => handleCheckboxClick(), 50);
        }, 1500);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      onError?.(error instanceof Error ? error.message : "Verification failed");
      
      // Auto-refresh on error
      setTimeout(() => {
        setSelectedCells([]);
        setJigsawPieces([]);
        setStatus("idle");
        setTimeout(() => handleCheckboxClick(), 50);
      }, 1500);
    }
  };
  
  const handleGestureVerify = async () => {
    if (!challenge || !token) return;

    setStatus("solving");
    setProgress(50);

    try {
      // SECURITY: Solve proof-of-work to prevent ML-based automated solvers
      const powSolution = await solveProofOfWork(
        challenge,
        (hash, attempts) => {
          const powProgress = Math.min(50 + (attempts / 1000) * 25, 75);
          setProgress(powProgress);
        }
      );

      setProgress(80);

      // Create solution payload: {answer: {x, y}, powSolution: "..."}
      const solutionPayload = {
        answer: dragPosition,
        powSolution,
      };
      const solution = JSON.stringify(solutionPayload);
      const clientDetections = detectClientAutomation();

      // Encrypt solution if encryption is enabled
      let requestBody: any = { token, clientDetections };

      if (encryptionEnabled && sessionEstablished) {
        const encrypted = await encryptSolutionData(solution, token, publicKey);
        if (!encrypted) {
          throw new Error('Failed to encrypt solution');
        }
        requestBody.encrypted = encrypted;
        requestBody.publicKey = publicKey;
      } else {
        requestBody.solution = solution;
      }
      
      const response = await apiRequest("POST", "/api/captcha/verify", requestBody);

      const result = await response.json();
      
      if (result.success) {
        setProgress(100);
        setStatus("success");
        setTimeout(() => {
          closeOverlay();
          onSuccess?.(token);
        }, 1000);
      } else {
        setStatus("error");
        onError?.(result.error || "Verification failed");
        
        // Auto-refresh challenge after 1.5 seconds if wrong
        setTimeout(() => {
          setDragPosition({ x: 0, y: 0 });
          setStatus("idle");
          setTimeout(() => handleCheckboxClick(), 50);
        }, 1500);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      onError?.(error instanceof Error ? error.message : "Verification failed");
      
      // Auto-refresh on error
      setTimeout(() => {
        setDragPosition({ x: 0, y: 0 });
        setStatus("idle");
        setTimeout(() => handleCheckboxClick(), 50);
      }, 1500);
    }
  };
  
  const handleUpsideDownVerify = async (solution: { clicks: Array<{ x: number; y: number }> }) => {
    if (!challenge || !token) return;

    setStatus("solving");
    setProgress(50);

    try {
      // SECURITY: Solve proof-of-work to prevent ML-based automated solvers
      const powSolution = await solveProofOfWork(
        challenge,
        (hash, attempts) => {
          const powProgress = Math.min(50 + (attempts / 1000) * 25, 75);
          setProgress(powProgress);
        }
      );

      setProgress(80);

      // Create solution payload: {answer: {clicks: [...]}, powSolution: "..."}
      const solutionPayload = {
        answer: solution,
        powSolution,
      };
      const solutionString = JSON.stringify(solutionPayload);
      const clientDetections = detectClientAutomation();

      // Encrypt solution if encryption is enabled
      let requestBody: any = { token, clientDetections };

      if (encryptionEnabled && sessionEstablished) {
        const encrypted = await encryptSolutionData(solutionString, token, publicKey);
        if (!encrypted) {
          throw new Error('Failed to encrypt solution');
        }
        requestBody.encrypted = encrypted;
        requestBody.publicKey = publicKey;
      } else {
        requestBody.solution = solutionString;
      }
      
      const response = await apiRequest("POST", "/api/captcha/verify", requestBody);

      const result = await response.json();
      
      if (result.success) {
        setProgress(100);
        setStatus("success");
        setTimeout(() => {
          closeOverlay();
          onSuccess?.(token);
        }, 1000);
      } else {
        setStatus("error");
        onError?.(result.error || "Verification failed");
        
        // Auto-refresh challenge after 1.5 seconds if wrong
        setTimeout(() => {
          setStatus("idle");
          setTimeout(() => handleCheckboxClick(), 50);
        }, 1500);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      onError?.(error instanceof Error ? error.message : "Verification failed");
      
      // Auto-refresh on error
      setTimeout(() => {
        setStatus("idle");
        setTimeout(() => handleCheckboxClick(), 50);
      }, 1500);
    }
  };
  
  const handleSkip = () => {
    // Skip just closes the overlay and resets
    closeOverlay();
    setStatus("idle");
    setSelectedCells([]);
    setJigsawPieces([]);
    setDragPosition({ x: 0, y: 0 });
  };

  const renderChallengeContent = () => {
    if (status === "loading") {
      return (
        <div className="flex items-center gap-3 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading challenge...</p>
        </div>
      );
    }

    if (actualType === "grid") {
      const gridSize = challenge?.gridSize || 3;
      const gridEmojis = challenge?.gridEmojis || [];
      const targetEmojis = challenge?.targetEmojis || ["🍎"];
      
      return (
        <div className="space-y-3 sm:space-y-6 p-3 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold">Grid Challenge</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Select these: {targetEmojis.map((emoji: string, idx: number) => (
                  <span key={idx} className="text-lg sm:text-2xl mx-0.5">{emoji}</span>
                ))}
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCheckboxClick}
                disabled={status === "solving"}
                title="New Challenge"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
              <Button variant="ghost" size="icon" onClick={closeOverlay} disabled={status === "solving"}>
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>

          {status === "success" ? (
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm sm:text-base text-green-900 dark:text-green-100">Puzzle solved!</p>
              </div>
            </div>
          ) : (
            <>
              <div 
                className="grid gap-2 sm:gap-3 mx-auto p-3 sm:p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl"
                style={{ 
                  gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                  maxWidth: gridSize === 3 ? '280px' : '320px'
                }}
              >
                {gridEmojis.map((emoji: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleGridCellClick(idx)}
                    disabled={status === "solving"}
                    className={`
                      aspect-square rounded-lg sm:rounded-xl border-2 transition-all duration-200 relative flex items-center justify-center text-2xl sm:text-4xl
                      ${selectedCells.includes(idx) 
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 shadow-lg scale-95" 
                        : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-slate-400"}
                      ${status === "solving" ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
                    `}
                  >
                    <span className={selectedCells.includes(idx) ? "opacity-30" : ""}>{emoji}</span>
                    {selectedCells.includes(idx) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <p className="text-center text-xs sm:text-sm text-muted-foreground">
                {selectedCells.length} cells selected
              </p>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button 
                  onClick={handleSkip}
                  disabled={status === "solving"}
                  variant="outline"
                  size="lg"
                  className="text-sm sm:text-base"
                >
                  Skip
                </Button>
                <Button 
                  onClick={handleGridVerify}
                  disabled={selectedCells.length === 0 || status === "solving"}
                  className="w-full"
                  size="lg"
                >
                  {status === "solving" ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <span className="text-sm sm:text-base">Verifying...</span>
                    </>
                  ) : (
                    <span className="text-sm sm:text-base">Verify</span>
                  )}
                </Button>
              </div>

              {status === "solving" && (
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    if (actualType === "jigsaw") {
      const pieces = challenge?.pieces || [0, 1, 2, 3];
      const pieceColors = ["bg-red-400", "bg-blue-400", "bg-green-400", "bg-yellow-400"];
      
      return (
        <div className="space-y-3 sm:space-y-6 p-3 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold">Jigsaw Challenge</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Click pieces in order: 🔴 🔵 🟢 🟡
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCheckboxClick}
                disabled={status === "solving"}
                title="New Challenge"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
              <Button variant="ghost" size="icon" onClick={closeOverlay} disabled={status === "solving"}>
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>

          {status === "success" ? (
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm sm:text-base text-green-900 dark:text-green-100">Jigsaw completed!</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl">
                {pieces.map((piece: number, idx: number) => {
                  const pieceEmoji = ["🔴", "🔵", "🟢", "🟡"];
                  const order = jigsawPieces.indexOf(piece);
                  const isSelected = jigsawPieces.includes(piece);
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleJigsawPieceClick(piece)}
                      disabled={status === "solving"}
                      className={`
                        h-20 sm:h-28 rounded-lg sm:rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 relative
                        ${pieceColors[piece]} 
                        ${isSelected
                          ? "border-white scale-95 ring-2 sm:ring-4 ring-primary/50" 
                          : "border-slate-300 dark:border-slate-600 hover:border-white hover:scale-105"}
                        ${status === "solving" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      <span className="text-2xl sm:text-4xl drop-shadow-lg">
                        {pieceEmoji[piece]}
                      </span>
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-white dark:bg-slate-800 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold border-2 border-primary">
                          {order + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-xs sm:text-sm text-muted-foreground">
                {jigsawPieces.length}/4 pieces arranged
              </p>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button 
                  onClick={handleSkip}
                  disabled={status === "solving"}
                  variant="outline"
                  size="lg"
                  className="text-sm sm:text-base"
                >
                  Skip
                </Button>
                <Button 
                  onClick={handleJigsawVerify}
                  disabled={jigsawPieces.length !== 4 || status === "solving"}
                  className="w-full"
                  size="lg"
                >
                  {status === "solving" ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <span className="text-sm sm:text-base">Verifying...</span>
                    </>
                  ) : (
                    <span className="text-sm sm:text-base">Verify</span>
                  )}
                </Button>
              </div>

              {status === "solving" && (
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    if (actualType === "gesture") {
      const gridSize = challenge?.gridSize || { width: 300, height: 300 };
      const target = challenge?.target || { x: 150, y: 150 };
      const tolerance = challenge?.tolerance || 15;
      const puzzleSeed = challenge?.puzzleSeed || 1234;
      const puzzleImageUrl = challenge?.puzzleImageUrl || 'https://picsum.photos/seed/default/400/400';
      
      const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (status !== "idle") return;
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      };

      const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || status !== "idle") return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, gridSize.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, gridSize.height));
        
        setDragPosition({ x, y });
      };

      const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isDragging) {
          setIsDragging(false);
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      };
      
      // Calculate if piece is near target
      const dx = dragPosition.x - target.x;
      const dy = dragPosition.y - target.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const isNearTarget = distance <= tolerance * 1.5;
      
      // Generate jigsaw puzzle path using seed from shared utility
      const puzzleSize = 60;
      const puzzlePath = generateJigsawPath(puzzleSeed, puzzleSize);
      
      return (
        <div className="space-y-3 sm:space-y-6 p-3 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold">Puzzle Challenge</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Drag the puzzle piece to fit the hole
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCheckboxClick}
                disabled={status === "solving"}
                title="New Challenge"
                data-testid="button-refresh-gesture"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
              <Button variant="ghost" size="icon" onClick={closeOverlay} disabled={status === "solving"} data-testid="button-close-gesture">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>

          {status === "success" ? (
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm sm:text-base text-green-900 dark:text-green-100">Perfect match!</p>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">Puzzle piece placed correctly</p>
              </div>
            </div>
          ) : (
            <>
              <div 
                className="relative mx-auto rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-700"
                style={{ 
                  width: `${gridSize.width}px`, 
                  height: `${gridSize.height}px`,
                  touchAction: 'none',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                data-testid="gesture-drag-area"
              >
                {/* SVG layer untuk background image dan hole */}
                <svg 
                  className="absolute inset-0 pointer-events-none" 
                  width={gridSize.width} 
                  height={gridSize.height}
                >
                  <defs>
                    {/* Pattern untuk gambar background */}
                    <pattern id="puzzleBackgroundImage" x="0" y="0" width="1" height="1">
                      <image 
                        href={puzzleImageUrl} 
                        x="0" 
                        y="0" 
                        width={gridSize.width} 
                        height={gridSize.height}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </pattern>
                    
                    {/* Clip path untuk hole */}
                    <clipPath id="puzzleHoleClip">
                      <path d={puzzlePath} transform={`translate(${target.x - puzzleSize/2}, ${target.y - puzzleSize/2})`} />
                    </clipPath>
                    
                    {/* Mask untuk semua area kecuali hole */}
                    <mask id="puzzleHoleMask">
                      <rect width={gridSize.width} height={gridSize.height} fill="white" />
                      <path 
                        d={puzzlePath} 
                        transform={`translate(${target.x - puzzleSize/2}, ${target.y - puzzleSize/2})`}
                        fill="black"
                      />
                    </mask>
                  </defs>
                  
                  {/* Background image dengan mask (tidak tampil di hole) */}
                  <rect 
                    width={gridSize.width} 
                    height={gridSize.height} 
                    fill="url(#puzzleBackgroundImage)"
                    mask="url(#puzzleHoleMask)"
                  />
                  
                  {/* Area hole - hitam solid */}
                  <path 
                    d={puzzlePath} 
                    transform={`translate(${target.x - puzzleSize/2}, ${target.y - puzzleSize/2})`}
                    fill="rgba(0, 0, 0, 0.85)"
                  />
                  
                  {/* Border hole - subtle */}
                  <path 
                    d={puzzlePath} 
                    transform={`translate(${target.x - puzzleSize/2}, ${target.y - puzzleSize/2})`}
                    fill="none"
                    stroke={isNearTarget ? '#10b981' : 'rgba(255, 255, 255, 0.3)'}
                    strokeWidth={isNearTarget ? '2' : '1.5'}
                    opacity={isNearTarget ? '0.8' : '0.5'}
                  />
                </svg>
                
                {/* Draggable Puzzle Piece */}
                <div
                  className={`absolute transition-all duration-100 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                  style={{
                    left: `${dragPosition.x}px`,
                    top: `${dragPosition.y}px`,
                    transform: 'translate(-50%, -50%)',
                    filter: isDragging ? 'drop-shadow(0 12px 20px rgba(0, 0, 0, 0.6))' : 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5))',
                    zIndex: 2,
                  }}
                  data-testid="gesture-draggable"
                >
                  <svg 
                    width={puzzleSize + 20} 
                    height={puzzleSize + 20} 
                    viewBox={`-10 -10 ${puzzleSize + 20} ${puzzleSize + 20}`}
                    className={`transition-transform ${isDragging ? 'scale-105' : 'scale-100'}`}
                  >
                    <defs>
                      <clipPath id="puzzlePieceClip">
                        <path d={puzzlePath} />
                      </clipPath>
                    </defs>
                    
                    {/* Puzzle piece dengan gambar yang offset - selalu tampilkan bagian dari target */}
                    <g clipPath="url(#puzzlePieceClip)">
                      <image 
                        href={puzzleImageUrl} 
                        x={-target.x + puzzleSize/2} 
                        y={-target.y + puzzleSize/2}
                        width={gridSize.width} 
                        height={gridSize.height}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </g>
                    
                    {/* Puzzle piece border */}
                    <path 
                      d={puzzlePath} 
                      fill="none"
                      stroke={isNearTarget ? '#10b981' : '#ffffff'}
                      strokeWidth="2.5"
                      opacity="0.95"
                    />
                    
                    {/* Inner highlight untuk efek 3D */}
                    <path 
                      d={puzzlePath} 
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.5)"
                      strokeWidth="1"
                    />
                  </svg>
                  
                  {/* Distance indicator when near target */}
                  {isNearTarget && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse font-semibold">
                        {Math.round(distance)}px away
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-center text-xs sm:text-sm text-muted-foreground">
                {isNearTarget ? (
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    Perfect! Almost in place - {Math.round(distance)}px away
                  </span>
                ) : (
                  <span>
                    Drag the jigsaw piece to complete the puzzle
                  </span>
                )}
              </p>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button 
                  onClick={handleSkip}
                  disabled={status === "solving"}
                  variant="outline"
                  size="lg"
                  data-testid="button-skip-gesture"
                  className="text-sm sm:text-base"
                >
                  Skip
                </Button>
                <Button 
                  onClick={handleGestureVerify}
                  disabled={status === "solving"}
                  className="w-full"
                  size="lg"
                  data-testid="button-verify-gesture"
                >
                  {status === "solving" ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <span className="text-sm sm:text-base">Verifying...</span>
                    </>
                  ) : (
                    <span className="text-sm sm:text-base">Verify</span>
                  )}
                </Button>
              </div>

              {status === "solving" && (
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    if (actualType === "upside_down") {
      return (
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Animal Challenge</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Click on all upside-down animals
              </p>
            </div>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCheckboxClick}
                disabled={status === "solving"}
                title="New Challenge"
                data-testid="button-refresh-upside-down"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
              <Button variant="ghost" size="icon" onClick={closeOverlay} disabled={status === "solving"} data-testid="button-close-upside-down">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {status === "success" ? (
            <div className="flex items-center gap-3 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">All correct!</p>
                <p className="text-sm text-green-700 dark:text-green-300">You identified all upside-down animals</p>
              </div>
            </div>
          ) : (
            <UpsideDownCaptcha
              challengeData={challenge}
              onSolve={handleUpsideDownVerify}
              disabled={status === "solving"}
            />
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Card className="w-full max-w-sm border-2 shadow-md" data-testid="card-captcha-widget">
        <div className="p-3 border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-3">
            {status === "success" ? (
              <>
                <div className="flex items-center justify-center w-8 h-8 rounded bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" data-testid="icon-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" data-testid="text-status">
                    Verified!
                  </p>
                  {attempts > 0 && (
                    <p className="text-xs text-muted-foreground" data-testid="text-attempts">
                      {attempts.toLocaleString()} computations
                    </p>
                  )}
                </div>
              </>
            ) : status === "blocked" ? (
              <>
                <div className="flex items-center justify-center w-8 h-8 rounded bg-orange-100 dark:bg-orange-900">
                  <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" data-testid="icon-blocked" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-100" data-testid="text-status">
                    IP Locked
                  </p>
                  <div className="flex items-center gap-1 text-xs text-orange-700 dark:text-orange-300" data-testid="text-countdown">
                    <Clock className="h-3 w-3" />
                    <span>{remainingTime}</span>
                  </div>
                </div>
              </>
            ) : status === "error" ? (
              <>
                <div className="flex items-center justify-center w-8 h-8 rounded bg-red-100 dark:bg-red-900">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" data-testid="icon-error" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" data-testid="text-status">
                    Verification failed
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatus("idle")}
                    data-testid="button-retry"
                    className="h-auto p-0 text-xs hover:underline"
                  >
                    Try again
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Checkbox
                  checked={false}
                  onCheckedChange={handleCheckboxClick}
                  data-testid="checkbox-verify"
                  className="h-7 w-7 border-2 data-[state=checked]:bg-blue-600"
                  disabled={status === "loading"}
                />
                <p className="text-sm font-semibold" data-testid="text-instruction">
                  I'm not a robot
                </p>
              </>
            )}

            <div className={`ml-auto flex items-center justify-center w-10 h-10 rounded-md shadow-md ${
              status === "success" 
                ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                : status === "blocked"
                ? "bg-gradient-to-br from-orange-500 to-amber-600"
                : "bg-gradient-to-br from-blue-500 to-indigo-600"
            }`}>
              {status === "success" ? (
                <UserCheck className="h-6 w-6 text-white" data-testid="icon-human" />
              ) : status === "blocked" ? (
                <Shield className="h-6 w-6 text-white" data-testid="icon-shield" />
              ) : (
                <Bot className="h-6 w-6 text-white" data-testid="icon-bot" />
              )}
            </div>
          </div>
        </div>

        <div className="px-3 py-2 text-[10px] text-muted-foreground flex items-center justify-between bg-white dark:bg-slate-950" data-testid="text-branding">
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline" data-testid="link-privacy">Privacy</a>
          <span className="font-semibold">ProofCaptcha</span>
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:underline" data-testid="link-terms">Terms</a>
        </div>
      </Card>

      {showOverlay && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 captcha-overlay-fade"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && status !== "solving") {
              closeOverlay();
            }
          }}
        >
          <Card 
            className="w-full max-w-md max-h-[90vh] overflow-y-auto captcha-modal-slide" 
            style={{
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 1000000,
            }}
          >
            {renderChallengeContent()}
          </Card>
        </div>,
        document.body
      )}
    </>
  );
}
