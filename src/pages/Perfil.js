// src/pages/Perfil.js
import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const S = {
  wrap:    { fontFamily: 'system-ui, sans-serif', maxWidth: 400, margin: '0 auto', background: '#f5f5f5', minHeight: '100vh', paddingBottom: 80 },
  header:  { background: 'white', padding: '20px 16px 16px', borderBottom: '0.5px solid #eee' },
  title:   { fontSize: 22, fontWeight: 600, color: '#111' },
  body:    { padding: '16px 16px 0' },
  avatar:  { width: 64, height: 64, borderRadius: '50%', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'white', margin: '0 auto 12px', fontWeight: 600 },
  nameRow: { textAlign: 'center', marginBottom: 20 },
  name:    { fontSize: 18, fontWeight: 600, color: '#111' },
  email:   { fontSize: 13, color: '#aaa' },
  card:    { background: 'white', borderRadius: 16, border: '0.5px solid #eee', padding: 16, marginBottom: 12 },
  cardLbl: { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 10 },
  infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '0.5px solid #f5f5f5', alignItems: 'center' },
  infoLbl: { color: '#888' },
  infoVal: { color: '#111', fontWeight: 500 },
  field:   { marginBottom: 12 },
  fLabel:  { display: 'block', fontSize: 12, color: '#888', marginBottom: 4 },
  input:   { width: '100%', fontSize: 14, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontFamily: 'inherit', boxSizing: 'border-box' },
  btnSave: { width: '100%', padding: 12, borderRadius: 10, background: '#1D9E75', border: 'none', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
  btnEdit: { width: '100%', padding: 10, borderRadius: 10, background: 'transparent', border: '0.5px solid #1D9E75', color: '#1D9E75', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 },
  saving:  { textAlign: 'center', fontSize: 13, color: '#1D9E75', padding: 8 },
  navbar:  { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 400, background: 'white', borderTop: '0.5px solid #eee', display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px' },
  navItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, color: '#aaa', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' },
  navOn:   { color: '#1D9E75' },
}

export default function Perfil() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser]     = useState(location.state?.user || null)
  const [plan, setPlan]     = useState(location.state?.plan || null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [form, setForm] = useState({ peso: '', altura: '', gordura: '', peso_meta: '', preferred_days: [] })

  useEffect(() => {
    if (!user && id) {
      supabase.from('users').select('*').eq('id', id).single()
        .then(({ data }) => {
          if (data) {
            setUser(data)
            setPlan(data.plan)
            setForm({ peso: data.peso || '', altura: data.altura || '', gordura: data.gordura || '', peso_meta: data.peso_meta || '', preferred_days: data.preferred_days || [] })
          }
        })
    } else if (user) {
      setForm({ peso: user.peso || '', altura: user.altura || '', gordura: user.gordura || '', peso_meta: user.peso_meta || '', preferred_days: user.preferred_days || [] })
    }
  }, [id])

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  function getLevelName(level) {
    return { beginner: 'Iniciante', basic: 'Básico', intermediate: 'Intermediário', advanced: 'Avançado' }[level] || 'Iniciante'
  }

  function getProtocolName(p) {
    return { hypertrophy: 'Hipertrofia', fat_loss: 'Emagrecimento', hybrid: 'Híbrido', health: 'Saúde' }[p] || 'Condicionamento'
  }

  function calcIMC() {
    const p = parseFloat(form.peso || user?.peso)
    const a = parseFloat(form.altura || user?.altura)
    if (!p || !a) return '—'
    return (p / Math.pow(a / 100, 2)).toFixed(1)
  }

  async function saveChanges() {
    setSaving(true)
    const { error } = await supabase.from('users').update({
      peso:           parseFloat(form.peso) || null,
      altura:         parseFloat(form.altura) || null,
      gordura:        parseFloat(form.gordura) || null,
      peso_meta:      parseFloat(form.peso_meta) || null,
      preferred_days: form.preferred_days || [],
    }).eq('id', id)
    setSaving(false)
    if (!error) {
      setUser(u => ({ ...u, ...form }))
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } else {
      alert('Erro ao salvar: ' + error.message)
    }
  }

  if (!user) return <div style={{ padding: 32, textAlign: 'center', color: '#888', fontFamily: 'system-ui' }}>Carregando...</div>

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.title}>Meu perfil</div>
      </div>

      <div style={S.body}>
        <div style={S.card}>
          <div style={S.avatar}>{getInitials(user.nome)}</div>
          <div style={S.nameRow}>
            <div style={S.name}>{user.nome}</div>
            <div style={S.email}>{user.email}</div>
          </div>
          <div style={S.infoRow}><span style={S.infoLbl}>Objetivo</span><span style={S.infoVal}>{user.primary_goal || '—'}</span></div>
          <div style={S.infoRow}><span style={S.infoLbl}>Protocolo</span><span style={S.infoVal}>{getProtocolName(plan?.protocol)}</span></div>
          <div style={S.infoRow}><span style={S.infoLbl}>Nível</span><span style={S.infoVal}>{getLevelName(plan?.level)}</span></div>
          <div style={{ ...S.infoRow, borderBottom: 'none' }}><span style={S.infoLbl}>Dias/semana</span><span style={S.infoVal}>{user.days_per_week} dias</span></div>
        </div>

        <div style={S.card}>
          <div style={S.cardLbl}>Biometria</div>
          {!editing ? (
            <>
              <div style={S.infoRow}><span style={S.infoLbl}>Peso atual</span><span style={S.infoVal}>{user.peso ? `${user.peso} kg` : '—'}</span></div>
              <div style={S.infoRow}><span style={S.infoLbl}>Altura</span><span style={S.infoVal}>{user.altura ? `${user.altura} cm` : '—'}</span></div>
              <div style={S.infoRow}><span style={S.infoLbl}>IMC</span><span style={S.infoVal}>{calcIMC()}</span></div>
              <div style={S.infoRow}><span style={S.infoLbl}>% Gordura</span><span style={S.infoVal}>{user.gordura ? `${user.gordura}%` : '—'}</span></div>
              <div style={{ ...S.infoRow, borderBottom: 'none' }}><span style={S.infoLbl}>Peso meta</span><span style={S.infoVal}>{user.peso_meta ? `${user.peso_meta} kg` : '—'}</span></div>
              <div style={{ ...S.infoRow, borderBottom: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <span style={S.infoLbl}>Dias de treino</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(user.preferred_days || []).length > 0
                    ? (user.preferred_days || []).map(d => (
                        <span key={d} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: '#E1F5EE', color: '#085041', border: '0.5px solid #9FE1CB' }}>{d}</span>
                      ))
                    : <span style={{ fontSize: 12, color: '#aaa' }}>Não definido — edite para configurar</span>
                  }
                </div>
              </div>
              <button style={S.btnEdit} onClick={() => setEditing(true)}>✏️ Atualizar biometria</button>
              {saved && <div style={S.saving}>✓ Salvo com sucesso!</div>}
            </>
          ) : (
            <>
              <div style={S.field}><label style={S.fLabel}>Peso atual (kg)</label><input style={S.input} type="number" value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} placeholder="Ex: 70" /></div>
              <div style={S.field}><label style={S.fLabel}>Altura (cm)</label><input style={S.input} type="number" value={form.altura} onChange={e => setForm(f => ({ ...f, altura: e.target.value }))} placeholder="Ex: 170" /></div>
              <div style={S.field}><label style={S.fLabel}>% Gordura (opcional)</label><input style={S.input} type="number" value={form.gordura} onChange={e => setForm(f => ({ ...f, gordura: e.target.value }))} placeholder="Ex: 22" /></div>
              <div style={S.field}><label style={S.fLabel}>Peso meta (kg)</label><input style={S.input} type="number" value={form.peso_meta} onChange={e => setForm(f => ({ ...f, peso_meta: e.target.value }))} placeholder="Ex: 65" /></div>
              <div style={S.field}>
                <label style={S.fLabel}>Dias de treino preferidos</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'].map(d => (
                    <div key={d}
                      onClick={() => setForm(f => ({
                        ...f,
                        preferred_days: f.preferred_days.includes(d)
                          ? f.preferred_days.filter(x => x !== d)
                          : [...f.preferred_days, d]
                      }))}
                      style={{
                        padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', userSelect: 'none', border: '0.5px solid',
                        background: form.preferred_days.includes(d) ? '#E1F5EE' : '#f7f7f7',
                        borderColor: form.preferred_days.includes(d) ? '#1D9E75' : '#eee',
                        color: form.preferred_days.includes(d) ? '#085041' : '#888',
                      }}
                    >{d}</div>
                  ))}
                </div>
              </div>
              <button style={S.btnSave} onClick={saveChanges} disabled={saving}>{saving ? 'Salvando...' : '✓ Salvar alterações'}</button>
              <button style={{ ...S.btnEdit, marginTop: 6 }} onClick={() => setEditing(false)}>Cancelar</button>
            </>
          )}
        </div>

        <div style={S.card}>
          <div style={S.cardLbl}>Restrições de saúde</div>
          {(user.injuries || []).filter(i => i !== 'Nenhuma').length > 0 ? (
            (user.injuries || []).filter(i => i !== 'Nenhuma').map((injury, i) => (
              <div key={i} style={{ ...S.infoRow, borderBottom: i === user.injuries.length - 2 ? 'none' : undefined }}>
                <span style={{ ...S.infoLbl, color: '#BA7517' }}>⚠️ {injury}</span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: '#aaa' }}>Nenhuma restrição cadastrada ✓</div>
          )}
        </div>
      </div>

      <div style={S.navbar}>
        <button style={S.navItem} onClick={() => navigate(`/home/${id}`, { state: { plan, user } })}>🏠<span>Início</span></button>
        <button style={S.navItem} onClick={() => navigate(`/progresso/${id}`, { state: { plan, user } })}>📊<span>Progresso</span></button>
        <button style={S.navItem} onClick={() => navigate(`/plano/${id}`, { state: { plan, user } })}>📅<span>Plano</span></button>
        <button style={{ ...S.navItem, ...S.navOn }}>👤<span>Perfil</span></button>
      </div>
    </div>
  )
}
