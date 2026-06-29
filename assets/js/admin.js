/**
 * NON-VENATUS — ADMIN DASHBOARD
 * Password-protected comment moderation panel.
 * Uses Supabase service role key to read/update all comments.
 */

(function () {
  'use strict';

  /* ── State ───────────────────────────────────────────────── */
  let supabase    = null;
  let allComments = [];
  let activeTab   = 'pending';

  /* ── Auth ────────────────────────────────────────────────── */
  const loginScreen    = document.getElementById('adminLogin');
  const dashboard      = document.getElementById('adminDashboard');
  const loginBtn       = document.getElementById('loginBtn');
  const logoutBtn      = document.getElementById('logoutBtn');
  const passInput      = document.getElementById('adminPass');
  const loginError     = document.getElementById('loginError');
  const setupWarning   = document.getElementById('setupWarning');

  // Check if already logged in (session)
  if (sessionStorage.getItem('nvAdminAuth') === 'true') {
    showDashboard();
  }

  loginBtn.addEventListener('click', attemptLogin);
  passInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('nvAdminAuth');
    loginScreen.style.display = '';
    dashboard.style.display = 'none';
    passInput.value = '';
    loginError.style.display = 'none';
  });

  function attemptLogin() {
    const pass = passInput.value;
    if (pass === CONFIG.admin.password) {
      sessionStorage.setItem('nvAdminAuth', 'true');
      loginError.style.display = 'none';
      showDashboard();
    } else {
      loginError.style.display = 'block';
      passInput.value = '';
      passInput.focus();
    }
  }

  function showDashboard() {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'block';

    // Check Supabase config
    const svcKey = CONFIG.supabase.serviceRoleKey;
    if (!CONFIG._supabaseConfigured || svcKey === 'YOUR_SUPABASE_SERVICE_ROLE_KEY') {
      setupWarning.style.display = 'block';
      showDemoData();
      return;
    }

    // Init Supabase with service role key (bypasses RLS)
    supabase = window.supabase.createClient(
      CONFIG.supabase.url,
      svcKey
    );
    loadAllComments();
  }

  /* ── Demo data when Supabase is not configured ─────────── */
  function showDemoData() {
    allComments = [
      {
        id: 1,
        name: 'Sample Reviewer',
        email: 'sample@example.com',
        affiliation: 'University of Delhi',
        comment: 'This is a sample pending comment. Once Supabase is configured, real comments will appear here.',
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Approved Reader',
        email: 'approved@example.com',
        affiliation: '',
        comment: 'This is a sample approved comment that would appear publicly on the Interactions page.',
        status: 'approved',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    updateUI();
  }

  /* ── Load all comments from Supabase ────────────────────── */
  async function loadAllComments() {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      allComments = data || [];
      updateUI();
    } catch (err) {
      console.error('Failed to load comments:', err);
      document.getElementById('listPending').innerHTML =
        `<div class="admin-empty">Failed to load comments: ${err.message}</div>`;
    }
  }

  /* ── Update all UI elements ─────────────────────────────── */
  function updateUI() {
    const pending  = allComments.filter(c => c.status === 'pending');
    const approved = allComments.filter(c => c.status === 'approved');
    const rejected = allComments.filter(c => c.status === 'rejected');

    // Stats
    document.getElementById('statPending').textContent  = pending.length;
    document.getElementById('statApproved').textContent = approved.length;
    document.getElementById('statRejected').textContent = rejected.length;

    // Badges
    document.getElementById('badgePending').textContent  = pending.length;
    document.getElementById('badgeApproved').textContent = approved.length;
    document.getElementById('badgeRejected').textContent = rejected.length;

    // Lists
    renderList('listPending',  pending,  ['approve', 'reject']);
    renderList('listApproved', approved, ['pending', 'reject']);
    renderList('listRejected', rejected, ['approve', 'pending', 'delete']);
  }

  /* ── Render a comment list ──────────────────────────────── */
  function renderList(containerId, comments, actions) {
    const el = document.getElementById(containerId);
    if (!comments.length) {
      el.innerHTML = '<div class="admin-empty">No comments in this category.</div>';
      return;
    }
    el.innerHTML = comments.map(c => renderAdminComment(c, actions)).join('');
    attachActionHandlers(el);
  }

  function renderAdminComment(c, actions) {
    const date = new Date(c.created_at).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const actionBtns = actions.map(a => {
      const labels = {
        approve: '✓ Approve',
        reject:  '✗ Reject',
        pending: '↩ Move to Pending',
        delete:  '🗑 Delete'
      };
      return `<button class="admin-btn ${a}" data-action="${a}" data-id="${c.id}">${labels[a]}</button>`;
    }).join('');

    return `
      <div class="admin-comment" data-id="${c.id}">
        <div>
          <div class="admin-comment__meta">
            <strong>${escHtml(c.name)}</strong>
            ${c.affiliation ? `<span>· ${escHtml(c.affiliation)}</span>` : ''}
            <span class="admin-comment__email">✉ ${escHtml(c.email)}</span>
            <span style="margin-left:auto; color:var(--silver);">${date}</span>
          </div>
          <p class="admin-comment__text">${escHtml(c.comment)}</p>
        </div>
        <div class="admin-comment__actions">${actionBtns}</div>
      </div>`;
  }

  /* ── Attach action button handlers ──────────────────────── */
  function attachActionHandlers(container) {
    container.querySelectorAll('.admin-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id     = parseInt(btn.dataset.id);
        const action = btn.dataset.action;
        handleAction(id, action, btn);
      });
    });
  }

  async function handleAction(id, action, btn) {
    btn.disabled = true;
    btn.textContent = '…';

    if (action === 'delete') {
      if (!confirm('Permanently delete this comment?')) {
        btn.disabled = false;
        return;
      }
    }

    if (!supabase) {
      // Demo mode: update local array
      if (action === 'delete') {
        allComments = allComments.filter(c => c.id !== id);
      } else {
        const statusMap = { approve: 'approved', reject: 'rejected', pending: 'pending' };
        const c = allComments.find(c => c.id === id);
        if (c) c.status = statusMap[action] || c.status;
      }
      updateUI();
      return;
    }

    try {
      if (action === 'delete') {
        const { error } = await supabase.from('comments').delete().eq('id', id);
        if (error) throw error;
        allComments = allComments.filter(c => c.id !== id);
      } else {
        const statusMap = { approve: 'approved', reject: 'rejected', pending: 'pending' };
        const newStatus = statusMap[action];
        const { error } = await supabase
          .from('comments')
          .update({ status: newStatus })
          .eq('id', id);
        if (error) throw error;
        const c = allComments.find(c => c.id === id);
        if (c) c.status = newStatus;
      }
      updateUI();
    } catch (err) {
      console.error('Action failed:', err);
      alert('Action failed: ' + err.message);
      btn.disabled = false;
    }
  }

  /* ── Tab switching ───────────────────────────────────────── */
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;

      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
      const panel = document.getElementById(`tab${capitalize(activeTab)}`);
      if (panel) panel.style.display = '';
    });
  });

  /* ── Helpers ─────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

})();
