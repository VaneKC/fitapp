// src/pages/Login.js
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const S = {
  wrap:     { fontFamily: 'system-ui, sans-serif', maxWidth: 400, margin: '0 auto', minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 16px' },
  logo:     { textAlign: 'center', marginBottom: 32 },
  logoIcon: { width: 64, height: 64, borderRadius: 20, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28 },
  logoName: { fontSize: 24, fontWeight: 700, color: '#111' },
  logoSub:  { fontSize: 14, color: '#888', marginTop: 4 },
  card:     { background: 'white', borderRadius: 20, border: '0.5px solid #eee', padding: '24px 20px' },
  tabs:     { display: 'flex', background: '#f5f5f5', borderRadius: 10, padding: 3, marginBottom: 20 },
  tab:      { flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 500, border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', color: '#aaa', fontFamily: 'inherit' },
  tabOn:    { background: 'white', color: '#111', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  field:    { marginBottom: 14 },
  fLabel:   { display: 'block', fontSize: 12, fontWeight: 500, color: '#666', marginBottom: 5 },
  input:    { width: '100%', fontSize: 14, padding: '10px 12px', borderRadius: 10, border: '0.5px solid #ddd', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' },
  btnMain:  { width: '100%', padding: 13, borderRadius: 10, background: '#1D9E75', border: 'none', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
  btnDis:   { opacity: 0.6, cursor: 'default' },
  errBox:   { background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#791F1F', marginBottom: 14 },
  sucBox:   { background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#085041', marginBottom: 14 },
  divider:  { display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' },
  divLine:  { flex: 1, height: '0.5px', background: '#eee' },
  divTxt:   { fontSize: 12, color: '#aaa' },
  hint:     { fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 16, lineHeight: 1.6 },
}

export default function Login() {
  const navigate = useNavigate()
  const [tab, setTab]         = useState('login')
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [nome, setNome]       = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')
  const [sucesso, setSucesso] = useState('')

  function resetForm() {
    setErro('')
    setSucesso('')
  }

  async function handleLogin() {
    if (!email || !senha) { setErro('Preencha email e senha.'); return }
    setLoading(true)
    setErro('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) throw error

      // busca perfil do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single()

      if (userData) {
        navigate(`/home/${userData.id}`, { state: { user: userData, plan: userData.plan } })
      } else {
        // tem conta mas não tem perfil — vai para anamnese
        navigate('/anamnese', { state: { authUser: data.user } })
      }
    } catch (e) {
      if (e.message?.includes('Invalid login')) setErro('Email ou senha incorretos.')
      else setErro('Erro ao entrar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCadastro() {
    if (!nome || !email || !senha) { setErro('Preencha todos os campos.'); return }
    if (senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    setErro('')
    try {
      const { data, error } = await supabase.auth.signUp({ email, password: senha })
      if (error) throw error

      // navega para anamnese passando o auth user
      navigate('/anamnese', { state: { authUser: data.user, nome } })
    } catch (e) {
      if (e.message?.includes('already registered')) setErro('Este email já está cadastrado. Faça login.')
      else setErro('Erro ao cadastrar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.wrap}>
      <div style={S.logo}>
        <div style={S.logoIcon}>💪</div>
        <div style={S.logoName}>Meu App de Treino</div>
        <div style={S.logoSub}>Seu plano personalizado, gerado para você</div>
      </div>

      <div style={S.card}>
        <div style={S.tabs}>
          <button style={{ ...S.tab, ...(tab === 'login' ? S.tabOn : {}) }}
            onClick={() => { setTab('login'); resetForm() }}>Entrar</button>
          <button style={{ ...S.tab, ...(tab === 'cadastro' ? S.tabOn : {}) }}
            onClick={() => { setTab('cadastro'); resetForm() }}>Criar conta</button>
        </div>

        {erro && <div style={S.errBox}>⚠️ {erro}</div>}
        {sucesso && <div style={S.sucBox}>✓ {sucesso}</div>}

        {tab === 'cadastro' && (
          <div style={S.field}>
            <label style={S.fLabel}>Nome completo</label>
            <input style={S.input} type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Como quer ser chamado(a)?" />
          </div>
        )}

        <div style={S.field}>
          <label style={S.fLabel}>Email</label>
          <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
        </div>

        <div style={S.field}>
          <label style={S.fLabel}>Senha</label>
          <input style={S.input} type="password" value={senha} onChange={e => setSenha(e.target.value)}
            placeholder={tab === 'cadastro' ? 'Mínimo 6 caracteres' : 'Sua senha'}
            onKeyDown={e => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleCadastro())} />
        </div>

        <button
          style={{ ...S.btnMain, ...(loading ? S.btnDis : {}) }}
          onClick={tab === 'login' ? handleLogin : handleCadastro}
          disabled={loading}
        >
          {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar conta e continuar →'}
        </button>

        <div style={S.hint}>
          {tab === 'login'
            ? 'Não tem conta ainda? Clique em "Criar conta" acima.'
            : 'Ao criar sua conta você vai preencher uma anamnese rápida para personalizarmos seu plano.'}
        </div>
      </div>
    </div>
  )
}
