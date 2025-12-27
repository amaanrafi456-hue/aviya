const chat = document.getElementById('chat')
const input = document.getElementById('messageInput')
const sendBtn = document.getElementById('sendBtn')
const typing = document.getElementById('typing')
const fileInput = document.getElementById('fileInput')
const convoList = document.getElementById('convoList')
const newChatBtn = document.getElementById('newChatBtn')
const chatTitle = document.getElementById('chatTitle')
const learnMoreBtn = document.getElementById('learnMoreBtn')
const authOrUser = document.getElementById('authOrUser')

const browseBtn = document.getElementById('browseBtn')
const researchBtn = document.getElementById('researchBtn')
const appsBtn = document.getElementById('appBtn')
const plusBtn = document.getElementById('plusBtn')
const imageBtn = document.getElementById('imageBtn')

const layoutBtn = document.getElementById('layoutBtn')
const editBtn = document.getElementById('editBtn')

const micBtn = document.querySelector('.circle-btn[title="Mic"]')
const stopBtn = document.querySelector('.circle-btn.solid[title="Stop"]')

const contextMenu = document.getElementById('chatContextMenu')
const deleteChatBtn = document.getElementById('deleteChatBtn')

const landing = document.getElementById('landingHero')
const appShell = document.getElementById('appShell')
const startBtn = document.getElementById('startChat')

const authOverlay = document.getElementById('authOverlay')
const authClose = document.getElementById('authClose')
const authGoogle = document.getElementById('authGoogle')
const authMicrosoft = document.getElementById('authMicrosoft')
const openAuth = document.getElementById('openAuth')

let conversations = JSON.parse(localStorage.getItem('aviya_convos') || '[]')
let currentConvo = null

function saveConvos() {
  localStorage.setItem('aviya_convos', JSON.stringify(conversations))
}

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

function renderMessages() {
  chat.innerHTML = ''
  if (!currentConvo) return
  chatTitle.textContent = 'Aviya'
  currentConvo.messages.forEach(msg => addMessageToUI(msg.text, msg.sender, false))
  chat.scrollTop = chat.scrollHeight
}

function renderConvoList() {
  convoList.innerHTML = ''
  conversations.forEach(c => {
    const div = document.createElement('div')
    div.classList.add('convo-item')
    if (currentConvo && c.id === currentConvo.id) div.classList.add('active')
    div.textContent = c.title || 'Conversation'

    div.onclick = () => {
      currentConvo = c
      renderConvoList()
      renderMessages()
    }

    div.oncontextmenu = e => {
      e.preventDefault()
      currentConvo = c
      renderConvoList()
      showContextMenu(e.pageX, e.pageY)
    }

    convoList.appendChild(div)
  })
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
      body: JSON.stringify({ sessionId: currentConvo.id, message: text })
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

async function loadUser() {
  try {
    const res = await fetch('/me')
    const data = await res.json()

    if (data.user) {
      authOrUser.innerHTML = `
        <div class="user-card-wrapper">
          <div class="user-card">
            <div class="avatar">
              ${
                (data.user.name || 'U')
                  .split(' ')
                  .map(p => p[0] ? p[0].toUpperCase() : '')
                  .join('')
                  .slice(0, 2)
              }
            </div>
            <div class="user-meta">
              <p class="user-name">${data.user.name || 'User'}</p>
              <p class="user-plan">${data.user.role === 'creator' ? 'Creator' : 'Free plan'}</p>
            </div>
            <button class="more-btn" id="userMenuToggle" aria-label="User menu" type="button">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path
                  fill="currentColor"
                  d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"
                />
              </svg>
            </button>
          </div>

          <div class="user-menu hidden" id="userMenu">
            <button id="userSettingsBtn" type="button">Settings</button>
            <button id="userLogoutBtn" type="button">Log out</button>
          </div>
        </div>
      `

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

      document.addEventListener('click', e => {
        if (userMenu && userMenuToggle && !userMenu.contains(e.target) && e.target !== userMenuToggle) {
          userMenu.classList.add('hidden')
        }
      })

      if (userLogoutBtn) {
        userLogoutBtn.addEventListener('click', async () => {
          await fetch('/logout', { method: 'POST' })
          await loadUser()
        })
      }

      if (userSettingsBtn) {
        userSettingsBtn.addEventListener('click', () => {
          addAssistantMessage('Settings coming soon.')
          if (userMenu) userMenu.classList.add('hidden')
        })
      }
    } else {
      authOrUser.innerHTML = `
        <div class="auth-mini-two">
          <button class="auth-mini-btn" id="signInBtn" type="button">Sign in</button>
          <button class="auth-mini-btn" id="signUpBtn" type="button">Sign up</button>
        </div>
      `
    }
  } catch (err) {
    console.log('could not load user', err)
  }
}

function updatePlaceholder() {
  if (browseBtn && browseBtn.classList.contains('active')) input.placeholder = 'Search the web'
  else if (researchBtn && researchBtn.classList.contains('active')) input.placeholder = 'Create a detailed response'
  else input.placeholder = 'Message Aviya…'
}

function setToggle(btn) {
  if (!btn) return
  btn.addEventListener('click', () => {
    btn.classList.toggle('active')
    updatePlaceholder()
  })
}

function openAuthModal(titleText, subText) {
  if (!authOverlay) return
  const t = document.getElementById('authTitle')
  const s = document.getElementById('authSub')
  if (t && titleText) t.textContent = titleText
  if (s && subText) s.textContent = subText
  authOverlay.classList.remove('hidden')
}

window.addEventListener('DOMContentLoaded', () => {
  if (learnMoreBtn) {
  learnMoreBtn.addEventListener('click', () => {
    const el = document.getElementById('landingHero')
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
  if (conversations.length === 0) {
    createNewConvo()
  } else {
    currentConvo = conversations[0]
    renderConvoList()
    renderMessages()
  }

  loadUser()

  if (sendBtn) sendBtn.addEventListener('click', sendMessage)
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendMessage()
    })
  }
  if (newChatBtn) newChatBtn.addEventListener('click', createNewConvo)

  if (plusBtn && fileInput) plusBtn.addEventListener('click', () => fileInput.click())
  if (imageBtn && fileInput) imageBtn.addEventListener('click', () => fileInput.click())

  setToggle(browseBtn)
  setToggle(researchBtn)
  setToggle(appsBtn)
  updatePlaceholder()

  if (browseBtn && researchBtn) {
    browseBtn.addEventListener('click', () => {
      if (browseBtn.classList.contains('active')) researchBtn.classList.remove('active')
      updatePlaceholder()
    })

    researchBtn.addEventListener('click', () => {
      if (researchBtn.classList.contains('active')) browseBtn.classList.remove('active')
      updatePlaceholder()
    })
  }

  if (layoutBtn) {
    layoutBtn.addEventListener('click', e => {
      e.stopPropagation()

      const old = document.querySelector('.layout-menu')
      if (old) {
        old.remove()
        return
      }

      const menu = document.createElement('div')
      menu.className = 'layout-menu'
      menu.innerHTML = `
        <div class="layout-option" data-layout="default">Default layout</div>
        <div class="layout-option" data-layout="compact">Compact layout</div>
      `
      document.body.appendChild(menu)

      const rect = layoutBtn.getBoundingClientRect()
      menu.style.top = rect.bottom + 6 + 'px'
      menu.style.left = rect.right - 180 + 'px'

      menu.addEventListener('click', ev => {
        ev.stopPropagation()
        const choice = ev.target.getAttribute('data-layout')
        if (choice === 'compact') {
          document.body.classList.add('compact-layout')
          addAssistantMessage('Switched to compact layout.')
        } else {
          document.body.classList.remove('compact-layout')
          addAssistantMessage('Switched to default layout.')
        }
        menu.remove()
      })

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
        addAssistantMessage('Renamed conversation.')
      }
    })
  }

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

  if (deleteChatBtn) {
    deleteChatBtn.addEventListener('click', () => {
      if (!currentConvo) return
      conversations = conversations.filter(c => c.id !== currentConvo.id)
      saveConvos()
      hideContextMenu()

      if (conversations.length === 0) createNewConvo()
      else {
        currentConvo = conversations[0]
        renderConvoList()
        renderMessages()
      }
    })
  }

  document.addEventListener('click', e => {
    if (contextMenu && !contextMenu.contains(e.target)) hideContextMenu()
  })

  if (startBtn && landing && appShell) {
    startBtn.addEventListener('click', () => {
      landing.style.display = 'none'
      appShell.classList.remove('hidden')
    })
  }

  if (openAuth && authOverlay) {
    openAuth.addEventListener('click', () => openAuthModal('Sign in to Aviya', 'Pick Google or Microsoft to continue.'))
  }

  if (authClose && authOverlay) {
    authClose.addEventListener('click', e => {
      e.stopPropagation()
      authOverlay.classList.add('hidden')
    })
  }

  if (authOverlay) {
    authOverlay.addEventListener('click', e => {
      if (e.target === authOverlay) authOverlay.classList.add('hidden')
    })
  }

  if (authGoogle) {
    authGoogle.addEventListener('click', e => {
      e.stopPropagation()
      window.location.href = '/auth/google'
    })
  }

  if (authMicrosoft) {
    authMicrosoft.addEventListener('click', e => {
      e.stopPropagation()
      window.location.href = '/auth/microsoft'
    })
  }

  document.addEventListener('click', e => {
    if (!e.target) return

    if (e.target.id === 'signInBtn') {
      openAuthModal('Sign in to Aviya', 'Use your existing account to continue.')
    }

    if (e.target.id === 'signUpBtn') {
      openAuthModal('Create your account', 'Pick Google or Microsoft to get started.')
    }
  })
})