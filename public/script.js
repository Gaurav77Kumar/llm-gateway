function setStatus(elId, text, type) {
  const el = document.getElementById(elId);

  el.textContent = text;
  el.className = 'status' + (type ? ' ' + type : '');
}

function showResult(elId, data) {
  document.getElementById(elId).textContent =
    typeof data === 'string'
      ? data
      : JSON.stringify(data, null, 2);
}


async function sendChat() {
  const btn = document.getElementById('sendBtn');

  const apiKey =
    document.getElementById('apiKey').value.trim();

  const message =
    document.getElementById('message').value.trim();

  setStatus('chatStatus', '', '');
  showResult('chatResult', '');

  if (!apiKey) {
    setStatus(
      'chatStatus',
      'Enter a virtual API key first.',
      'error'
    );
    return;
  }

  if (!message) {
    setStatus(
      'chatStatus',
      'Enter a message first.',
      'error'
    );
    return;
  }

  btn.disabled = true;

  setStatus(
    'chatStatus',
    'Sending...',
    ''
  );

  try {

    const res = await fetch('/api/chat', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },

      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(
        'chatStatus',
        `Request failed (${res.status})`,
        'error'
      );

      showResult('chatResult', data);

      return;
    }

    setStatus(
      'chatStatus',
      'Success',
      'success'
    );

    showResult(
      'chatResult',
      data
    );

  } catch (err) {

    setStatus(
      'chatStatus',
      `Network error: ${err.message}`,
      'error'
    );

  } finally {

    btn.disabled = false;
  }
}


async function checkUsage() {

  const btn =
    document.getElementById('usageBtn');

  const apiKey =
    document.getElementById('apiKey').value.trim();

  setStatus(
    'usageStatus',
    '',
    ''
  );

  showResult(
    'usageResult',
    ''
  );

  if (!apiKey) {

    setStatus(
      'usageStatus',
      'Enter a virtual API key first.',
      'error'
    );

    return;
  }

  btn.disabled = true;

  setStatus(
    'usageStatus',
    'Checking...',
    ''
  );

  try {

    const res = await fetch('/api/usage', {

      method: 'GET',

      headers: {
        Authorization: `Bearer ${apiKey}`
      }

    });

    const data = await res.json();

    if (!res.ok) {

      setStatus(
        'usageStatus',
        `Request failed (${res.status})`,
        'error'
      );

      showResult(
        'usageResult',
        data
      );

      return;
    }

    setStatus(
      'usageStatus',
      'Success',
      'success'
    );

    showResult(
      'usageResult',
      data
    );

  } catch (err) {

    setStatus(
      'usageStatus',
      `Network error: ${err.message}`,
      'error'
    );

  } finally {

    btn.disabled = false;
  }
}


async function createKey() {

  const btn =
    document.getElementById('createKeyBtn');

  const adminSecret =
    document.getElementById('adminSecret').value.trim();

  const label =
    document.getElementById('keyLabel').value.trim();

  const tokenBudget =
    Number(
      document.getElementById('tokenBudget').value
    );

  setStatus(
    'createKeyStatus',
    '',
    ''
  );

  showResult(
    'createKeyResult',
    ''
  );
  if (!adminSecret) {

    setStatus(
      'createKeyStatus',
      'Enter the admin secret first.',
      'error'
    );

    return;
  }
  if (!label) {

    setStatus(
      'createKeyStatus',
      'Enter a label first.',
      'error'
    );

    return;
  }

  if (
    !Number.isFinite(tokenBudget) ||
    tokenBudget < 0
  ) {

    setStatus(
      'createKeyStatus',
      'Enter a valid token budget.',
      'error'
    );

    return;
  }
  btn.disabled = true;

  setStatus(
    'createKeyStatus',
    'Creating...',
    ''
  );

  try {
    const res = await fetch('/api/keys', {

      method: 'POST',

      headers: {

        'Content-Type':
          'application/json',

        'X-Admin-Secret':
          adminSecret

      },

      body: JSON.stringify({

        label,
        tokenBudget

      })

    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(
        'createKeyStatus',
        `Request failed (${res.status})`,
        'error'
      );

      showResult(
        'createKeyResult',
        data
      );

      return;
    }
    setStatus(
      'createKeyStatus',
      'Key created — copy it now, it will not be shown again.',
      'success'
    );

    showResult(
      'createKeyResult',
      data
    );

    if (data.key) {

      document.getElementById(
        'apiKey'
      ).value = data.key;

    }

  } catch (err) {

    setStatus(
      'createKeyStatus',
      `Network error: ${err.message}`,
      'error'
    );

  } finally {

    btn.disabled = false;
  }
}

document
  .getElementById('sendBtn')
  .addEventListener(
    'click',
    sendChat
  );

document
  .getElementById('usageBtn')
  .addEventListener(
    'click',
    checkUsage
  );

document
  .getElementById('createKeyBtn')
  .addEventListener(
    'click',
    createKey
  );