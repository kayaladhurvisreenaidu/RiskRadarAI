import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Shield, AlertTriangle, Terminal } from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SerialPort } from '@/types/web-serial';

type SensorStatus = 'SAFE' | 'DANGER';

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  isDanger: boolean;
}

export default function LiveSensor() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<SensorStatus>('SAFE');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hasReceivedData, setHasReceivedData] = useState(false);

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);

  const addLog = useCallback((message: string) => {
    const isDanger = message.toUpperCase().includes('DANGER');
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (isDanger) {
      setStatus('DANGER');
    }

    setLogs(prev => [
      { id: crypto.randomUUID(), timestamp, message, isDanger },
      ...prev,
    ].slice(0, 5));

    if (!hasReceivedData) {
      setHasReceivedData(true);
    }
  }, [hasReceivedData]);

  const handleConnect = async () => {
    // Check for Web Serial API support
    if (!('serial' in navigator)) {
      alert('Please use Chrome or Edge to access the Live Sensor Monitor.');
      return;
    }

    setIsConnecting(true);

    try {
      // Request port access
      const port = await navigator.serial.requestPort();
      portRef.current = port;

      try {
        await port.open({ baudRate: 115200 });
      } catch (openError) {
        // If port is already open, try to close and reopen
        if ((openError as Error).message?.includes('NetworkError') || 
            (openError as Error).name === 'NetworkError') {
          alert('PORT BUSY: Please close Arduino IDE Serial Monitor and refresh.');
          setIsConnecting(false);
          return;
        }

        try {
          await port.close();
          await port.open({ baudRate: 115200 });
        } catch {
          throw openError;
        }
      }

      setIsConnected(true);
      setIsConnecting(false);

      // Set up text decoder stream
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable!.pipeTo(textDecoder.writable as unknown as WritableStream<Uint8Array>);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      // Read loop
      let lineBuffer = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          lineBuffer += value;
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              addLog(line.trim());
            }
          }
        }
      } catch (error) {
        console.error('Read error:', error);
      } finally {
        reader.releaseLock();
        await readableStreamClosed.catch(() => {});
      }
    } catch (error) {
      console.error('Connection error:', error);
      if ((error as Error).name === 'NotFoundError') {
        // User cancelled port selection
      } else {
        alert('Failed to connect to sensor. Please try again.');
      }
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }

      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    } finally {
      setIsConnected(false);
      setHasReceivedData(false);
      setStatus('SAFE');
      setLogs([]);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        try {
          if (readerRef.current) {
            await readerRef.current.cancel();
            readerRef.current = null;
          }
          if (portRef.current) {
            await portRef.current.close();
            portRef.current = null;
          }
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      };
      cleanup();
    };
  }, []);

  return (
    <MainLayout darkMode>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-white flex items-center gap-3"
          >
            <Radio className="w-8 h-8" />
            Live Accelerometer Feed
          </motion.h1>

          <Button
            onClick={isConnected ? handleDisconnect : handleConnect}
            disabled={isConnecting}
            variant={isConnected ? 'destructive' : 'default'}
            className={cn(
              isConnected ? 'bg-destructive hover:bg-destructive/90' : 'bg-success hover:bg-success/90'
            )}
          >
            {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] transition-all duration-300',
              status === 'SAFE'
                ? 'bg-success/10 border-2 border-success/30'
                : 'bg-destructive/10 border-2 border-destructive/30 pulse-danger'
            )}
          >
            <AnimatePresence mode="wait">
              {status === 'SAFE' ? (
                <motion.div
                  key="safe"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-center"
                >
                  <Shield className="w-24 h-24 text-success mx-auto mb-4" />
                  <h2 className="text-4xl font-bold text-success mb-2">SAFE</h2>
                  <p className="text-success/70">All systems nominal</p>
                </motion.div>
              ) : (
                <motion.div
                  key="danger"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    <AlertTriangle className="w-24 h-24 text-destructive mx-auto mb-4" />
                  </motion.div>
                  <h2 className="text-4xl font-bold text-destructive mb-2">DANGER</h2>
                  <p className="text-destructive/70">Anomaly detected!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Terminal Logs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black rounded-2xl border border-gray-800 overflow-hidden min-h-[400px]"
          >
            {/* Terminal Header */}
            <div className="bg-gray-900 px-4 py-2 flex items-center gap-2 border-b border-gray-800">
              <Terminal className="w-4 h-4 text-terminal-text" />
              <span className="font-mono text-xs text-terminal-text">&gt; /dev/ttyUSB0</span>
              <div className={cn(
                'ml-auto w-2 h-2 rounded-full',
                isConnected ? 'bg-terminal-text' : 'bg-gray-600'
              )} />
            </div>

            {/* Terminal Content */}
            <div className="p-4 font-mono text-xs space-y-1 h-[350px] overflow-hidden">
              {!isConnected ? (
                <p className="text-gray-500">Waiting for connection...</p>
              ) : !hasReceivedData ? (
                <p className="text-gray-500 animate-pulse">Awaiting Data stream…</p>
              ) : (
                <>
                  <p className="text-terminal-text mb-3">System: Data Stream Verified (Online)</p>
                  {logs.map((log) => (
                    <motion.p
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'terminal-glow',
                        log.isDanger ? 'text-terminal-danger' : 'text-terminal-text'
                      )}
                    >
                      <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                    </motion.p>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
