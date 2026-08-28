import React, { useState } from 'react';
import { X, MessageSquare, Copy, Check, Share2 } from 'lucide-react';
import { generateWhatsAppRosterText } from '../utils/dateUtils';

export default function WhatsAppShareModal({ isOpen, onClose, roster }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !roster) return null;

  const rosterText = generateWhatsAppRosterText(roster);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rosterText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback copy
      const textarea = document.createElement('textarea');
      textarea.value = rosterText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppSend = () => {
    const encoded = encodeURIComponent(rosterText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Staff Roster - ${roster.year}`,
          text: rosterText,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleWhatsAppSend();
        }
      }
    } else {
      handleWhatsAppSend();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ width: '36px', height: '36px', background: 'var(--green-50)', color: 'var(--green-600)' }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem' }}>Share Roster via WhatsApp</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                Formatted text ready for staff group chats
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Message Preview:</label>
            <textarea
              className="form-textarea"
              rows={10}
              readOnly
              value={rosterText}
              style={{
                fontFamily: 'monospace',
                fontSize: '0.8125rem',
                backgroundColor: 'var(--gray-50)',
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap'
              }}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? <Check size={16} color="var(--green-600)" /> : <Copy size={16} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handleWebShare}>
              <Share2 size={16} />
              <span>Share to WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
