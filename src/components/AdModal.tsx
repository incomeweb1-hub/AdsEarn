import React, { useEffect, useState, useRef } from 'react';
import { X, CheckCircle, Clock, ShieldCheck, Play } from 'lucide-react';
import type { AdItem } from '../types.ts';
import { api } from '../services/api.ts';

interface AdModalProps {
  ad: AdItem;
  onClose: () => void;
  onRewardClaimed: (rewardAdded: number, newBalance: number) => void;
}

export const AdModal: React.FC<AdModalProps> = ({ ad, onClose, onRewardClaimed }) => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(ad.duration || 15);
  const [canClaim, setCanClaim] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const duration = ad.duration || 15;

  // Initialize ad session
  useEffect(() => {
    let mounted = true;
    setTimeLeft(duration);
    setCanClaim(false);
    setError(null);

    api.startAdSession(ad.id)
      .then(res => {
        if (mounted) {
          setSessionToken(res.sessionToken);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message || 'Failed to start ad session');
        }
      });

    return () => {
      mounted = false;
    };
  }, [ad.id, duration]);

  // Countdown timer
  useEffect(() => {
    if (!sessionToken || timeLeft <= 0) {
      if (timeLeft <= 0) {
        setCanClaim(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClaim(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionToken, timeLeft]);

  // Inject Adsterra script into iframe
  useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 250px;
              background: #0f172a;
              color: #94a3b8;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              text-align: center;
              overflow: hidden;
            }
            .ad-container {
              width: 100%;
              max-width: 320px;
              min-height: 250px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .placeholder-box {
              border: 1px dashed #334155;
              border-radius: 12px;
              padding: 24px 16px;
              background: #1e293b;
              width: 90%;
              max-width: 300px;
            }
            .title {
              font-size: 15px;
              font-weight: 600;
              color: #f8fafc;
              margin-bottom: 6px;
            }
            .sub {
              font-size: 12px;
              color: #64748b;
            }
            .tag {
              display: inline-block;
              background: #0284c7;
              color: #fff;
              font-size: 10px;
              font-weight: bold;
              padding: 2px 8px;
              border-radius: 4px;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="ad-container">
            ${
              ad.code && ad.code.trim().length > 0
                ? ad.code
                : `
                <div class="placeholder-box">
                  <div class="tag">Official Ad</div>
                  <div class="title">${ad.title}</div>
                  <div class="sub">Watching sponsored advertisement...</div>
                </div>
                `
            }
          </div>
        </body>
      </html>
    `);
    doc.close();
  }, [ad.code, ad.title]);

  const handleClaimReward = async () => {
    if (!sessionToken || isVerifying) return;
    setIsVerifying(true);
    setError(null);

    try {
      const result = await api.verifyAdReward(sessionToken);
      if (result.success) {
        onRewardClaimed(result.rewardAdded, result.newBalance);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const progressPercent = Math.min(100, Math.round(((duration - timeLeft) / duration) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
              {ad.title}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5">
          <div
            className="bg-blue-500 h-1.5 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Ad Content Viewport */}
        <div className="p-4 flex flex-col items-center justify-center min-h-[280px] bg-slate-950/40">
          <iframe
            ref={iframeRef}
            title="Advertisement"
            className="w-full h-[260px] rounded-xl border border-slate-800/80 bg-slate-950"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />

          {error && (
            <div className="mt-3 w-full p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 text-center">
              {error}
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col gap-2">
          {!canClaim ? (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-4 h-4 text-blue-400 animate-spin" />
                Please wait...
              </span>
              <span className="font-mono font-bold text-blue-400 tabular-nums">
                {timeLeft}s
              </span>
            </div>
          ) : (
            <button
              onClick={handleClaimReward}
              disabled={isVerifying}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 disabled:opacity-50"
            >
              {isVerifying ? (
                <span>Verifying with server...</span>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span>Claim ৳{ad.reward.toFixed(2)} Reward</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Anti-cheat secured view verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};
