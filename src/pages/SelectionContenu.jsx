import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { peutVoirCours, MATIERES, COUT_PACK_COURS, getBudgetPacks, PLAN_LABELS } from '../data/constants';
import { COURS_CATALOGUE } from '../data/coursCatalogue';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function SelectionContenu() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [selection, setSelection] = useState(new Set());
  const [selectionLibre, setSelectionLibre] = useState(new Set());

  if (!user) return null;

  const userNiveau = user.niveau?.startsWith('universite') ? 'universite' : (user.niveau || 'seconde');
  const isUniv = userNiveau === 'universite';
  const isStandard = user.plan === 'standard';

  /* Cours disponibles pour ce niveau (règle d'accès classique 2nde→Terminale→Univ) */
  const coursDisponibles = COURS_CATALOGUE.filter(c => peutVoirCours(userNiveau, c.niveau));

  /* Aucune matière n'est offerte : l'anglais et l'espagnol se choisissent
     exactement comme les autres matières, en dépensant des Insights Normaux. */
  const coursAChoisir = coursDisponibles;

  /* Matières déjà débloquées précédemment (réabonnement / achat antérieur) —
     pour un lycéen, une matière déjà débloquée ne peut pas être re-choisie ici. */
  const matieresDejaDebloquees = new Set(
    (user.contenuDebloque || [])
      .map(id => coursAChoisir.find(c => c.id === id)?.mat)
      .filter(Boolean)
  );

  const budgetPacks = getBudgetPacks(user.IN);

  /* Règle anti-abus (lycée uniquement) : 1 seul cours/TD par matière lors de la
     sélection gratuite liée au plan. Les étudiants d'université ont libre cours
     et peuvent choisir plusieurs leçons dans une même matière. */
  const matieresDisponiblesPourLycee = [...new Set(coursAChoisir.map(c => c.mat))]
    .filter(mat => !matieresDejaDebloquees.has(mat));

  const maxSelectable = isUniv
    ? Math.min(budgetPacks, coursAChoisir.length)
    : Math.min(budgetPacks, matieresDisponiblesPourLycee.length);

  const coutTotal = selection.size * COUT_PACK_COURS;
  const resteIN = (user.IN || 0) - coutTotal;
  const complet = maxSelectable === 0 || selection.size === maxSelectable;

  /* Matières déjà prises dans la sélection en cours (lycée uniquement) */
  const matieresChoisiesMaintenant = new Set(
    [...selection].map(id => coursAChoisir.find(c => c.id === id)?.mat).filter(Boolean)
  );

  const estSelectionnable = (c) => {
    if (selection.has(c.id)) return true;
    if (selection.size >= maxSelectable) return false;
    if (!isUniv) {
      if (matieresDejaDebloquees.has(c.mat)) return false;      // déjà débloqué avant (réabonnement)
      if (matieresChoisiesMaintenant.has(c.mat)) return false;  // 1 seul par matière dans cette session
    }
    return true;
  };

  /* ── Section libre (financée par les jetons achetés en Boutique) ──
     Aucune restriction "1 par matière" : ce sont des jetons payés en argent réel,
     donc libre choix, y compris une 2ᵉ leçon dans une matière déjà prise. */
  const dejaDebloqueIds = new Set(user.contenuDebloque || []);
  const coursPourLibre = coursAChoisir.filter(c => !dejaDebloqueIds.has(c.id) && !selection.has(c.id));
  const budgetPacksLibre = getBudgetPacks(user.INBoutique);
  const maxSelectableLibre = Math.min(budgetPacksLibre, coursPourLibre.length);
  const coutTotalLibre = selectionLibre.size * COUT_PACK_COURS;
  const resteINBoutique = (user.INBoutique || 0) - coutTotalLibre;

  const toggleLibre = (c) => {
    setSelectionLibre(prev => {
      const next = new Set(prev);
      if (next.has(c.id)) { next.delete(c.id); return next; }
      if (next.size >= maxSelectableLibre) {
        toast(`Il te faut plus de jetons boutique pour débloquer une leçon de plus (${COUT_PACK_COURS} IN).`, 'error');
        return prev;
      }
      next.add(c.id);
      return next;
    });
  };

  const toggle = (c) => {
    setSelection(prev => {
      const next = new Set(prev);
      if (next.has(c.id)) { next.delete(c.id); return next; }
      if (!estSelectionnable(c)) {
        if (!isUniv && (matieresDejaDebloquees.has(c.mat) || matieresChoisiesMaintenant.has(c.mat))) {
          toast('Une seule leçon par matière à la fois. Passe à une autre matière, ou débloque celle-ci plus tard depuis la Boutique.', 'error');
        } else {
          toast(`Tu as atteint ta limite : ${maxSelectable} cours + TD (${maxSelectable * COUT_PACK_COURS} IN).`, 'error');
        }
        return prev;
      }
      next.add(c.id);
      return next;
    });
  };

  const confirmer = () => {
    if (maxSelectable > 0 && selection.size === 0 && selectionLibre.size === 0) { toast('Choisis au moins un cours + TD avant de continuer.', 'error'); return; }
    const contenuDebloque = [...new Set([...(user.contenuDebloque || []), ...selection, ...selectionLibre])];
    updateUser({
      contenuDebloque,
      contenuChoisiConfirme: true,
      IN: resteIN,
      INBoutique: resteINBoutique,
    });
    toast('Tes cours sont débloqués !', 'success');
    navigate('/dashboard');
  };

  /* Regroupement par matière pour l'affichage */
  const parMatiere = {};
  coursAChoisir.forEach(c => {
    if (!parMatiere[c.mat]) parMatiere[c.mat] = [];
    parMatiere[c.mat].push(c);
  });

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:"'Inter',sans-serif" }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:20, background:'var(--nav-bg)', backdropFilter:'blur(14px)', borderBottom:'1px solid var(--border-lt)', padding:'16px 6%' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1.05rem', fontWeight:700, color:'var(--text)' }}>
              Choisis tes cours <span style={{ color:'var(--copper)' }}>et TD</span>
            </div>
            <div style={{ fontSize:'0.78rem', color:'var(--text-3)', marginTop:2 }}>
              {isUniv ? 'Facultatif — tu peux aussi y revenir plus tard depuis le tableau de bord.' : "Cette étape est obligatoire avant d'accéder à ton tableau de bord."}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <ThemeToggle size={34} />
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px', background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:100 }}>
              <span style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--copper)' }}>{selection.size}/{maxSelectable}</span>
              <span style={{ fontSize:'0.75rem', color:'var(--muted)' }}>cours+TD choisis</span>
              <span style={{ width:1, height:14, background:'var(--border)' }}/>
              <span style={{ fontSize:'0.82rem', fontWeight:700, color:resteIN < 0 ? 'var(--danger)' : 'var(--text)' }}>{resteIN} IN</span>
              <span style={{ fontSize:'0.75rem', color:'var(--muted)' }}>restants</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 6% 100px' }}>

        {/* Explication du fonctionnement — volontairement très explicite */}
        <div style={{ background:'var(--copper-bg)', border:'1.5px solid var(--copper)', borderRadius:12, padding:'18px 20px', marginBottom:20 }}>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:'1rem', fontWeight:700, color:'var(--text)', marginBottom:12 }}>
            Comment ça marche, concrètement
          </div>
          <div style={{ fontSize:'0.86rem', color:'var(--text-2)', lineHeight:1.85 }}>
            <div style={{ display:'flex', gap:9, marginBottom:7 }}>
              <span style={{ color:'var(--copper)', fontWeight:700, flexShrink:0 }}>1.</span>
              <span>Tu disposes de <strong>{user.IN} Insights Normaux (IN)</strong> avec ton plan <strong>{PLAN_LABELS[user.plan] || user.plan}</strong>.</span>
            </div>
            <div style={{ display:'flex', gap:9, marginBottom:7 }}>
              <span style={{ color:'var(--copper)', fontWeight:700, flexShrink:0 }}>2.</span>
              <span>Chaque leçon coûte <strong>{COUT_PACK_COURS} IN</strong>. <strong>Son TD est compris dans ce prix</strong> — tu ne paies pas le TD séparément.</span>
            </div>
            <div style={{ display:'flex', gap:9, marginBottom:7 }}>
              <span style={{ color:'var(--copper)', fontWeight:700, flexShrink:0 }}>3.</span>
              <span>Tu peux donc débloquer <strong>{maxSelectable} leçon{maxSelectable > 1 ? 's' : ''}</strong> au total, {maxSelectable > 1 ? 'chacune' : ''} accompagnée{maxSelectable > 1 ? 's' : ''} de son TD.</span>
            </div>
            <div style={{ display:'flex', gap:9, marginBottom:7 }}>
              <span style={{ color:'var(--copper)', fontWeight:700, flexShrink:0 }}>4.</span>
              <span>Dès que tu confirmes, les leçons choisies apparaissent dans <strong>Mes cours</strong>, et leurs TD apparaissent automatiquement dans <strong>Exercices &amp; TD</strong>.</span>
            </div>
            {!isUniv ? (
              <div style={{ display:'flex', gap:9 }}>
                <span style={{ color:'var(--copper)', fontWeight:700, flexShrink:0 }}>5.</span>
                <span><strong>Une seule leçon par matière</strong> dans cette sélection. Pour une 2ᵉ leçon dans la même matière, il faudra acheter des IN supplémentaires dans la Boutique.</span>
              </div>
            ) : (
              <div style={{ display:'flex', gap:9 }}>
                <span style={{ color:'var(--copper)', fontWeight:700, flexShrink:0 }}>5.</span>
                <span>En tant qu'étudiant, tu choisis <strong>librement</strong> : plusieurs leçons dans une même matière sont autorisées.</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ background:'var(--bg2)', border:'1px solid var(--border-lt)', borderRadius:10, padding:'11px 16px', marginBottom:26, fontSize:'0.82rem', color:'var(--text-3)', lineHeight:1.6 }}>
          Toutes les matières se choisissent de la même façon, <strong style={{ color:'var(--text-2)' }}>y compris l'Anglais et l'Espagnol</strong> — aucune matière n'est offerte.
        </div>

        {/* Sélection par matière */}
        {Object.entries(parMatiere).map(([mat, liste]) => {
          const matInfo = MATIERES[mat] || { label:mat, color:'var(--copper)', bg:'var(--copper-bg)' };
          return (
            <div key={mat} style={{ marginBottom:28 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <span style={{ fontSize:'0.7rem', fontWeight:700, background:matInfo.bg, color:matInfo.color, padding:'3px 10px', borderRadius:100 }}>{matInfo.label}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
                {liste.map(c => {
                  const checked = selection.has(c.id);
                  const dejaAvant = matieresDejaDebloquees.has(c.mat) && !checked;
                  const disabled = !checked && !estSelectionnable(c);
                  return (
                    <div key={c.id} onClick={() => toggle(c)} className="card"
                      style={{
                        display:'flex', gap:12, alignItems:'flex-start', cursor: disabled ? 'not-allowed' : 'pointer',
                        borderColor: checked ? matInfo.color : 'var(--border-lt)',
                        background: checked ? matInfo.bg : 'var(--card-bg)',
                        opacity: disabled ? 0.45 : 1, transition:'all .15s',
                      }}
                    >
                      <div style={{
                        width:22, height:22, borderRadius:6, flexShrink:0, marginTop:2,
                        border:`2px solid ${checked ? matInfo.color : 'var(--border)'}`,
                        background: checked ? matInfo.color : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        {checked && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div style={{ flex:1 }}>
                        {c.rubrique && (
                          <span style={{ fontSize:'0.66rem', fontWeight:600, border:`1px solid ${matInfo.color}40`, color:matInfo.color, padding:'0 7px', borderRadius:100, display:'inline-block', marginBottom:4 }}>{c.rubrique}</span>
                        )}
                        <div style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text)', marginBottom:3 }}>{c.titre}</div>
                        <div style={{ fontSize:'0.76rem', color:'var(--muted)' }}>
                          {dejaAvant ? 'Matière déjà débloquée' : `Cours + TD · ⏱ ${c.duree} · ${COUT_PACK_COURS} IN`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {coursAChoisir.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--muted)' }}>Aucun cours disponible pour ton niveau pour le moment.</div>
        )}

        {/* ── Section libre : jetons achetés en boutique, sans restriction de matière ── */}
        {(user.INBoutique || 0) > 0 && coursPourLibre.length > 0 && (
          <div style={{ marginTop:36, paddingTop:28, borderTop:'2px dashed var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <span style={{ fontSize:'0.68rem', fontWeight:700, background:'rgba(22,163,74,0.1)', color:'var(--success)', padding:'3px 10px', borderRadius:100 }}>Jetons boutique</span>
              <span style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text)' }}>Débloquer librement — {selectionLibre.size}/{maxSelectableLibre} · {resteINBoutique} IN boutique restants</span>
            </div>
            <div style={{ fontSize:'0.8rem', color:'var(--text-3)', marginBottom:16 }}>
              Ces jetons sont payés — aucune restriction de matière : tu peux prendre une 2ᵉ leçon dans une matière que tu as déjà.
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
              {coursPourLibre.map(c => {
                const matInfo = MATIERES[c.mat] || { label:c.mat, color:'var(--copper)', bg:'var(--copper-bg)' };
                const checked = selectionLibre.has(c.id);
                const disabled = !checked && selectionLibre.size >= maxSelectableLibre;
                return (
                  <div key={c.id} onClick={() => !disabled && toggleLibre(c)} className="card"
                    style={{
                      display:'flex', gap:12, alignItems:'flex-start', cursor: disabled ? 'not-allowed' : 'pointer',
                      borderColor: checked ? 'var(--success)' : 'var(--border-lt)',
                      background: checked ? 'rgba(22,163,74,0.06)' : 'var(--card-bg)',
                      opacity: disabled ? 0.45 : 1, transition:'all .15s',
                    }}
                  >
                    <div style={{
                      width:22, height:22, borderRadius:6, flexShrink:0, marginTop:2,
                      border:`2px solid ${checked ? 'var(--success)' : 'var(--border)'}`,
                      background: checked ? 'var(--success)' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {checked && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:4 }}>
                        <span style={{ fontSize:'0.68rem', fontWeight:700, background:matInfo.bg, color:matInfo.color, padding:'1px 8px', borderRadius:100, display:'inline-block' }}>{matInfo.label}</span>
                        {c.rubrique && (
                          <span style={{ fontSize:'0.68rem', fontWeight:600, border:`1px solid ${matInfo.color}40`, color:matInfo.color, padding:'0 7px', borderRadius:100, display:'inline-block' }}>{c.rubrique}</span>
                        )}
                      </div>
                      <div style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text)', marginBottom:3 }}>{c.titre}</div>
                      <div style={{ fontSize:'0.76rem', color:'var(--muted)' }}>Cours + TD · ⏱ {c.duree} · {COUT_PACK_COURS} IN</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Barre de confirmation fixe */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'var(--card-bg)', borderTop:'1px solid var(--border-lt)', padding:'16px 6%', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, boxShadow:'0 -4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize:'0.84rem', color:'var(--text-3)' }}>
          {complet
            ? 'Sélection complète — tu peux continuer.'
            : `Choisis encore ${maxSelectable - selection.size} cours + TD pour continuer.`}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {isUniv && (
            <button onClick={() => navigate('/dashboard')} className="btn btn-ghost">Plus tard</button>
          )}
          <button onClick={confirmer} disabled={!complet} className="btn btn-primary" style={{ opacity: complet ? 1 : 0.5, cursor: complet ? 'pointer' : 'not-allowed' }}>
            Confirmer et accéder au tableau de bord →
          </button>
        </div>
      </div>
    </div>
  );
}
