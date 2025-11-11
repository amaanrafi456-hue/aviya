// ====== BASIC ELEMENTS ======
const chat = document.getElementById('chat')
const input = document.getElementById('messageInput')
const sendBtn = document.getElementById('sendBtn')
const typing = document.getElementById('typing')
const fileInput = document.getElementById('fileInput')
const convoList = document.getElementById('convoList')
const newChatBtn = document.getElementById('newChatBtn')
const chatTitle = document.getElementById('chatTitle')
const authOrUser = document.getElementById('authOrUser')
const browseBtn = document.getElementById('browseBtn')
const researchBtn = document.getElementById('researchBtn')
const authOverlay = document.getElementById('authOverlay')
const authClose = document.getElementById('authClose')
const authGoogle = document.getElementById('authGoogle')
const authMicrosoft = document.getElementById('authMicrosoft')

// ====== LOAD USER / SHOW LOGIN OR CARD ======
async function loadUser() {
  try {
    const res = await fetch('/me')
    const data = await res.json()

    if (data.user) {
      // logged in -> show user card + dropdown container
      authOrUser.innerHTML = `
        <div class="user-card-wrapper">
          <div class="user-card">
            <div class="avatar">
              ${
                (data.user.name || 'U')
                  .split(' ')
                  .map(p => p[0]?.toUpperCase() || '')
                  .join('')
                  .slice(0, 2)
              }
            </div>
            <div class="user-meta">
              <p class="user-name">${data.user.name || 'User'}</p>
              <p class="user-plan">${data.user.role === 'creator' ? 'Creator' : 'Free plan'}</p>
            </div>
            <button class="more-btn" id="userMenuToggle" aria-label="User menu">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path
                  fill="currentColor"
                  d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"
                />
              </svg>
            </button>
          </div>

          <div class="user-menu hidden" id="userMenu">
            <button id="userSettingsBtn">Settings</button>
            <button id="userLogoutBtn">Log out</button>
          </div>
        </div>
      `

      // ---- attach listeners AFTER inserting HTML ----
      const userMenuToggle = document.getElementById('userMenuToggle')
      const userMenu = document.getElementById('userMenu')
      const userLogoutBtn = document.getElementById('userLogoutBtn')
      const userSettingsBtn = document.getElementById('userSettingsBtn')

      if (userMenuToggle && userMenu) {
        userMenuToggle.addEventListener('click', e => {
          e.stopPropagation()
          userMenu.classList.toggle('hidden')
        })
      }

      // clicking outside closes
      document.addEventListener('click', e => {
        if (userMenu && !userMenu.contains(e.target) && e.target !== userMenuToggle) {
          userMenu.classList.add('hidden')
        }
      })

      if (userLogoutBtn) {
        userLogoutBtn.addEventListener('click', async () => {
          await fetch('/logout', { method: 'POST' })
          loadUser() // refresh sidebar
        })
      }

      if (userSettingsBtn) {
        userSettingsBtn.addEventListener('click', () => {
          // for now just show a bubble in chat
          addAssistantMessage('Settings — coming soon.')
          userMenu.classList.add('hidden')
        })
      }
    } else {
      // NOT logged in -> show only 2 buttons
      authOrUser.innerHTML = `
        <div class="auth-mini-two">
          <button class="auth-mini-btn" id="signInBtn">Sign in</button>
          <button class="auth-mini-btn" id="signUpBtn">Sign up</button>
        </div>
      `

      const signInBtn = document.getElementById('signInBtn')
      const signUpBtn = document.getElementById('signUpBtn')

      if (signInBtn) {
        signInBtn.onclick = () => {
          const overlay = document.getElementById('authOverlay')
          const title = overlay.querySelector('.auth-card h2')
          title.textContent = 'Sign in to Aviya'
          overlay.classList.remove('hidden')
        }
      }

      if (signUpBtn) {
        signUpBtn.onclick = () => {
          const overlay = document.getElementById('authOverlay')
          const title = overlay.querySelector('.auth-card h2')
          title.textContent = 'Create your account'
          overlay.classList.remove('hidden')
        }
      }
    }
  } catch (err) {
    console.log('could not load user', err)
  }
}
// ====== BOTTOM BAR ICONS ======
const plusBtn = document.getElementById('plusBtn')
const imageBtn = document.getElementById('imageBtn')
const appsBtn = document.getElementById('appBtn')

// ====== TOP ICONS ======
const layoutBtn = document.querySelector('.top-icon[title="Layout"]')
const editBtn = document.querySelector('.top-icon[title="Edit"]')

// ====== MIC BUTTONS ======
const micBtn = document.querySelector('.circle-btn[title="Mic"]')
const stopBtn = document.querySelector('.circle-btn.solid[title="Stop"]')

// ====== CONTEXT MENU ======
const contextMenu = document.getElementById('chatContextMenu')
const deleteChatBtn = document.getElementById('deleteChatBtn')

// ====== LOCAL STORAGE CHATS ======
let conversations = JSON.parse(localStorage.getItem('aviya_convos') || '[]')
let currentConvo = null

function saveConvos() {
  localStorage.setItem('aviya_convos', JSON.stringify(conversations))
}

function createNewConvo() {
  const id = 'web-' + Math.random().toString(36).slice(2, 10)
  const convo = { id, title: 'New chat', messages: [] }
  conversations.unshift(convo)
  currentConvo = convo
  saveConvos()
  renderConvoList()
  renderMessages()
  addAssistantMessage('Hi, I’m Aviya. How are you feeling today?')
}

// ====== SIDEBAR LIST ======
function renderConvoList() {
  convoList.innerHTML = ''
  conversations.forEach(c => {
    const div = document.createElement('div')
    div.classList.add('convo-item')
    if (currentConvo && c.id === currentConvo.id) div.classList.add('active')
    div.textContent = c.title || 'Conversation'

    // open
    div.onclick = () => {
      currentConvo = c
      renderConvoList()
      renderMessages()
    }

    // right click -> delete menu
    div.oncontextmenu = e => {
      e.preventDefault()
      currentConvo = c
      renderConvoList()
      showContextMenu(e.pageX, e.pageY)
    }

    convoList.appendChild(div)
  })
}

// ====== RENDER MESSAGES ======
function renderMessages() {
  chat.innerHTML = ''
  if (!currentConvo) return
  chatTitle.textContent = 'Aviya'
  currentConvo.messages.forEach(msg => {
    addMessageToUI(msg.text, msg.sender, false)
  })
  chat.scrollTop = chat.scrollHeight
}

// ====== ADD MESSAGE ======
function addMessageToUI(text, sender = 'assistant', push = true) {
  const row = document.createElement('div')
  row.classList.add('message-row')

  const wrap = document.createElement('div')
  wrap.classList.add('message', sender)

  if (sender === 'assistant') {
  const avatar = document.createElement('div')
  avatar.classList.add('avatar')
  const img = document.createElement('img')
  img.src = 'aviya-logo.png'
  img.alt = 'Aviya'
  img.classList.add('avatar-img')
  avatar.appendChild(img)
  wrap.appendChild(avatar)
}

  const bubble = document.createElement('div')
  bubble.classList.add('bubble')
  bubble.textContent = text
  wrap.appendChild(bubble)

  row.appendChild(wrap)
  chat.appendChild(row)

  if (push && currentConvo) {
    currentConvo.messages.push({ sender, text })

    // update sidebar name
    if (sender === 'user' && (!currentConvo.title || currentConvo.title === 'New chat')) {
      const first = text.split(/[.!?]/)[0].trim()
      currentConvo.title = first.slice(0, 28) || 'Conversation'
    }

    saveConvos()
    renderConvoList()
  }

  chat.scrollTop = chat.scrollHeight
}

function addAssistantMessage(text) {
  addMessageToUI(text, 'assistant', true)
}

// ====== SEND MESSAGE ======
async function sendMessage() {
  const text = input.value.trim()
  if (!text || !currentConvo) return

  addMessageToUI(text, 'user', true)
  input.value = ''
  input.focus()

  typing.classList.remove('hidden')
  const started = Date.now()

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: currentConvo.id,
        message: text
      })
    })
    const data = await res.json()

    const elapsed = Date.now() - started
    const wait = elapsed < 300 ? 300 - elapsed : 0

    setTimeout(() => {
      typing.classList.add('hidden')
      if (data.reply) addAssistantMessage(data.reply)
      else addAssistantMessage('Aviya couldn’t reply right now.')
    }, wait)
  } catch (err) {
    typing.classList.add('hidden')
    addAssistantMessage('I lost connection for a second, can you try again?')
  }
}

// ====== CONTEXT MENU ======
function showContextMenu(x, y) {
  if (!contextMenu) return
  contextMenu.style.left = x + 'px'
  contextMenu.style.top = y + 'px'
  contextMenu.classList.remove('hidden')
}

function hideContextMenu() {
  if (!contextMenu) return
  contextMenu.classList.add('hidden')
}

if (deleteChatBtn) {
  deleteChatBtn.addEventListener('click', () => {
    if (!currentConvo) return
    conversations = conversations.filter(c => c.id !== currentConvo.id)
    saveConvos()
    hideContextMenu()
    if (conversations.length === 0) {
      createNewConvo()
    } else {
      currentConvo = conversations[0]
      renderConvoList()
      renderMessages()
    }
  })
}

document.addEventListener('click', e => {
  if (!contextMenu) return
  if (!contextMenu.contains(e.target)) hideContextMenu()
})

// ====== BASIC EVENTS ======
sendBtn.addEventListener('click', sendMessage)
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage()
})
newChatBtn.addEventListener('click', createNewConvo)

// "+" and image -> file picker
plusBtn.addEventListener('click', () => fileInput.click())
if (imageBtn) imageBtn.addEventListener('click', () => fileInput.click())

// toggleable mini icons
function makeToggle(btn) {
  if (!btn) return
  btn.addEventListener('click', () => btn.classList.toggle('active'))
}
makeToggle(browseBtn)
makeToggle(researchBtn)
makeToggle(appsBtn)

function updatePlaceholder() {
  if (browseBtn.classList.contains('active')) {
    input.placeholder = 'Search the web'
  } else if (researchBtn.classList.contains('active')) {
    input.placeholder = 'Create a detailed response'
  } else {
    input.placeholder = 'Message Aviya...'
  }
}

// Hook into toggles
browseBtn.addEventListener('click', () => {
  // deactivate research if browse is turned on
  if (browseBtn.classList.contains('active')) researchBtn.classList.remove('active')
  updatePlaceholder()
})

researchBtn.addEventListener('click', () => {
  // deactivate browse if research is turned on
  if (researchBtn.classList.contains('active')) browseBtn.classList.remove('active')
  updatePlaceholder()
})

// Initial state
updatePlaceholder()


// ====== TOP ICONS ======
if (layoutBtn) {
  layoutBtn.addEventListener('click', e => {
    e.stopPropagation(); // don't let it reach document and auto-close

    // remove old menu if it's already open
    const old = document.querySelector('.layout-menu')
    if (old) {
      old.remove()
      return
    }

    // make menu
    const menu = document.createElement('div')
    menu.className = 'layout-menu'
    menu.innerHTML = `
      <div class="layout-option" data-layout="default">Default layout</div>
      <div class="layout-option" data-layout="compact">Compact layout</div>
    `
    document.body.appendChild(menu)

    // position near the button
    const rect = layoutBtn.getBoundingClientRect()
    menu.style.top = rect.bottom + 6 + 'px'
    menu.style.left = rect.right - 180 + 'px'

    // clicks inside menu
    menu.addEventListener('click', ev => {
      ev.stopPropagation()
      const choice = ev.target.getAttribute('data-layout')
      if (choice === 'compact') {
        document.body.classList.add('compact-layout')
        addAssistantMessage('Switched to compact layout.')
      } else if (choice === 'default') {
        document.body.classList.remove('compact-layout')
        addAssistantMessage('Switched to default layout.')
      }
      menu.remove()
    })

    // click anywhere else -> close
    document.addEventListener(
      'click',
      function onDocClick() {
        menu.remove()
        document.removeEventListener('click', onDocClick)
      },
      { once: true }
    )
  })
}

if (editBtn) {
  editBtn.addEventListener('click', () => {
    if (!currentConvo) return
    const newTitle = prompt('Rename this chat:', currentConvo.title)
    if (newTitle && newTitle.trim() !== '') {
      currentConvo.title = newTitle.trim()
      saveConvos()
      renderConvoList()
      addAssistantMessage(`Renamed conversation to "${newTitle}".`)
    }
  })
}
// mic
if (micBtn) {
  micBtn.addEventListener('click', async () => {
    typing.classList.remove('hidden')
    try {
      const res = await fetch('/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dummy: true })
      })
      const data = await res.json()
      typing.classList.add('hidden')
      if (data.reply) addAssistantMessage(data.reply)
    } catch (err) {
      typing.classList.add('hidden')
      addAssistantMessage("Couldn't process the voice message.")
    }
  })
}

if (stopBtn) {
  stopBtn.addEventListener('click', () => {
    addAssistantMessage('Okay, I stopped listening to audio for now.')
  })
}

// ====== ON LOAD ======
window.addEventListener('load', () => {
  if (conversations.length === 0) {
    createNewConvo()
  } else {
    currentConvo = conversations[0]
    renderConvoList()
    renderMessages()
  }
  loadUser()
})

/* =========================================================
   AUTH OVERLAY (popup) — fixed so buttons actually redirect
   ========================================================= */

// close with X
if (authClose) {
  authClose.addEventListener('click', e => {
    e.stopPropagation()
    authOverlay.classList.add('hidden')
  })
}

// click on dark bg closes
if (authOverlay) {
  authOverlay.addEventListener('click', e => {
    if (e.target === authOverlay) {
      authOverlay.classList.add('hidden')
    }
  })
}

// GOOGLE
if (authGoogle) {
  authGoogle.addEventListener('click', e => {
    e.stopPropagation()
    console.log('GOOGLE BTN CLICKED')
    window.location.href = '/auth/google'
  })
}

// MICROSOFT
if (authMicrosoft) {
  authMicrosoft.addEventListener('click', e => {
    e.stopPropagation()
    console.log('MICROSOFT BTN CLICKED')
    window.location.href = '/auth/microsoft'
  })
}

function makeToggle(btn) {
  if (!btn) return
  btn.addEventListener('click', () => {
    btn.classList.toggle('active')

    // Special animation for research button
    if (btn.id === 'researchBtn') {
      if (btn.classList.contains('active')) {
        btn.style.width = '120px'
        btn.style.borderRadius = '9999px'
        btn.style.padding = '0 14px'
      } else {
        btn.style.width = '36px'
        btn.style.borderRadius = '10px'
        btn.style.padding = '0'
      }
    }
  })
}
// after loadUser has possibly rendered "Sign in" / "Sign up", hook them
document.addEventListener('click', e => {
  // if sign in button exists and was clicked
  if (e.target && e.target.id === 'signInBtn') {
    const overlay = document.getElementById('authOverlay')
    const title = document.getElementById('authTitle')
    const sub = document.getElementById('authSub')
    if (title) title.textContent = 'Sign in to Aviya'
    if (sub) sub.textContent = 'Use your existing account to continue.'
    if (overlay) overlay.classList.remove('hidden')
  }

  // if sign up button exists and was clicked
  if (e.target && e.target.id === 'signUpBtn') {
    const overlay = document.getElementById('authOverlay')
    const title = document.getElementById('authTitle')
    const sub = document.getElementById('authSub')
    if (title) title.textContent = 'Create your Aviya account'
    if (sub) sub.textContent = 'Pick Google or Microsoft to get started.'
    if (overlay) overlay.classList.remove('hidden')
  }
})
