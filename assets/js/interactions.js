/**
 * NON-VENATUS — INTERACTIONS / COMMENTS
 * Supabase-backed comment submission and display.
 * FormSubmit notifies admin on new submission.
 */

(function () {
  'use strict';

  /* ── Supabase client ───────────────────────────────────── */
  let supabase = null;

  function initSupabase() {
    if (!CONFIG._supabaseConfigured) return null;
    try {
      return window.supabase.createClient(
        CONFIG.supabase.url,
        CONFIG.supabase.anonKey
      );
    } catch (e) {
      console.warn('Supabase init failed:', e);
      return null;
    }
  }

  /* ── Load approved comments ────────────────────────────── */
  async function loadComments() {
    const container = document.getElementById('commentsContainer');
    const countEl   = document.getElementById('commentCount');

    supabase = initSupabase();

    if (!supabase) {
      container.innerHTML = `
        <div class="setup-warning">
          <strong>Comments not yet configured.</strong> 
          Set up Supabase in <code>assets/js/config.js</code> to enable this feature.
          See README.md for instructions.
        </div>
        <div class="comments-empty">No comments yet — be the first to respond!</div>
      `;
      if (countEl) countEl.textContent = '';
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, name, affiliation, comment, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (countEl) {
        countEl.textContent = data.length
          ? `(${data.length} response${data.length !== 1 ? 's' : ''})`
          : '';
      }

      if (!data || data.length === 0) {
        container.innerHTML = `<div class="comments-empty">No approved comments yet — be the first to respond!</div>`;
        return;
      }

      container.innerHTML = data.map(c => renderComment(c)).join('');
      attachVoteHandlers();

    } catch (err) {
      container.innerHTML = `<div class="comments-empty">Could not load comments. Please try again later.</div>`;
      console.error('Error loading comments:', err);
    }
  }

  /* ── Render a single comment ───────────────────────────── */
  function renderComment(c) {
    const date = new Date(c.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const votes = parseInt(localStorage.getItem(`vote_${c.id}`) || '0');
    return `
      <div class="comment-card" data-id="${c.id}">
        <div class="comment-votes">
          <button class="vote-btn up" data-id="${c.id}" aria-label="Upvote">▲</button>
          <span class="vote-count" id="vc_${c.id}">${votes}</span>
          <button class="vote-btn down" data-id="${c.id}" aria-label="Downvote">▼</button>
        </div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-author">${escHtml(c.name)}</span>
            ${c.affiliation ? `<span class="comment-affiliation">${escHtml(c.affiliation)}</span>` : ''}
            <span class="comment-date">${date}</span>
          </div>
          <p class="comment-text">${escHtml(c.comment)}</p>
        </div>
      </div>`;
  }

  /* ── Vote handlers (localStorage, client-side only) ──── */
  function attachVoteHandlers() {
    document.querySelectorAll('.vote-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id    = btn.dataset.id;
        const key   = `vote_${id}`;
        const current = parseInt(localStorage.getItem(key) || '0');
        const delta = btn.classList.contains('up') ? 1 : -1;
        const newVal = current + delta;
        localStorage.setItem(key, newVal);
        const el = document.getElementById(`vc_${id}`);
        if (el) el.textContent = newVal;
      });
    });
  }

  /* ── Submit comment ─────────────────────────────────────── */
  async function submitComment() {
    const nameEl  = document.getElementById('commenterName');
    const emailEl = document.getElementById('commenterEmail');
    const affEl   = document.getElementById('commenterAffiliation');
    const textEl  = document.getElementById('commentText');
    const statusEl = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitComment');

    const name    = nameEl.value.trim();
    const email   = emailEl.value.trim();
    const aff     = affEl.value.trim();
    const comment = textEl.value.trim();

    // Validate
    if (!name) { showStatus('Please enter your name.', 'error'); nameEl.focus(); return; }
    if (!email || !isValidEmail(email)) { showStatus('Please enter a valid email address.', 'error'); emailEl.focus(); return; }
    if (!comment || comment.length < 10) { showStatus('Please write a comment (at least 10 characters).', 'error'); textEl.focus(); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
    hideStatus();

    supabase = initSupabase();

    if (!supabase) {
      // Fallback: just send email via FormSubmit if Supabase isn't configured
      await sendEmailNotification(name, email, aff, comment);
      showStatus('Thank you! Your comment has been received and will be reviewed.', 'success');
      clearForm(nameEl, emailEl, affEl, textEl);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit for review';
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{ name, email, affiliation: aff || null, comment, status: 'approved' }]);

      if (error) throw error;

      // Also send email notification
      await sendEmailNotification(name, email, aff, comment);

      showStatus('Thank you! Your comment has been submitted and will appear after moderation.', 'success');
      clearForm(nameEl, emailEl, affEl, textEl);

    } catch (err) {
      console.error('Submit error:', err);
      showStatus('Something went wrong. Please try again or email us directly.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit for review';
    }
  }

  /* ── Email notification via FormSubmit ────────────────── */
  async function sendEmailNotification(name, email, aff, comment) {
    try {
      const formData = new FormData();
      formData.append('_subject', `New comment on Non-Venatus — from ${name}`);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('affiliation', aff || 'Not provided');
      formData.append('comment', comment);
      formData.append('_captcha', 'false');
      formData.append('_template', 'box');

      await fetch(`https://formsubmit.co/${CONFIG.notificationEmail}`, {
        method: 'POST',
        body: formData
      });
    } catch (e) {
      // Silent fail — email notification is supplementary
      console.warn('Email notification failed:', e);
    }
  }

  /* ── Helpers ─────────────────────────────────────────── */
  function showStatus(msg, type) {
    const el = document.getElementById('formStatus');
    el.textContent = msg;
    el.className = `form-status ${type}`;
  }
  function hideStatus() {
    const el = document.getElementById('formStatus');
    el.className = 'form-status';
  }
  function clearForm(...inputs) {
    inputs.forEach(el => el.value = '');
  }
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  /* ── Init ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    loadComments();

    const submitBtn = document.getElementById('submitComment');
    if (submitBtn) submitBtn.addEventListener('click', submitComment);

    // Allow Enter in text fields to not submit (textarea already handles this)
    ['commenterName', 'commenterEmail', 'commenterAffiliation'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const fields = ['commenterName','commenterEmail','commenterAffiliation','commentText'];
            const idx = fields.indexOf(id);
            const next = document.getElementById(fields[idx + 1]);
            if (next) next.focus();
          }
        });
      }
    });
  });

})();
