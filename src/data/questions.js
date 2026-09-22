/* ════════════════════════════════
   questions.js — Banque de questions
   Toutes matières — Madior Insight
════════════════════════════════ */

export const BANQUE = {
  economie: [
    { q:"La loi de la demande exprime une relation :", opts:["Directe prix/demande","Inverse prix/demande","Nulle","Proportionnelle"], correct:1, exp:"Prix ↑ → Qd ↓. Relation INVERSE entre prix et quantité demandée." },
    { q:"À l'équilibre du marché :", opts:["Qd > Qo","Qo > Qd","Qd = Qo","Prix = 0"], correct:2, exp:"Équilibre : Qd = Qo. Ni surplus ni pénurie." },
    { q:"Si Qd = 100 − 2P et Qo = 3P − 25, P* = ?", opts:["20","25","30","15"], correct:1, exp:"100−2P = 3P−25 → 125 = 5P → P* = 25." },
    { q:"Un bien inélastique a |E| :", opts:["> 1","= 1","< 1","= 0"], correct:2, exp:"|E| < 1 : peu sensible au prix (riz, médicaments)." },
    { q:"La BCEAO est la banque centrale de combien de pays ?", opts:["5","6","8","12"], correct:2, exp:"BCEAO = banque centrale des 8 pays de l'UEMOA." },
    { q:"PIB = C + I + G + ?", opts:["T − S","X − M","M − X","X + M"], correct:1, exp:"PIB = C + I + G + (Exports − Imports)." },
    { q:"Politique monétaire expansive : la BCEAO :", opts:["Hausse le taux","Baisse le taux","Augmente impôts","Réduit dépenses"], correct:1, exp:"Baisse taux directeur → crédit moins cher → stimulation économique." },
    { q:"Le déficit budgétaire signifie :", opts:["Recettes > Dépenses","Recettes = Dépenses","Recettes < Dépenses","PIB négatif"], correct:2, exp:"Déficit : État dépense plus qu'il ne collecte." },
    { q:"L'IDH mesure :", opts:["Le PIB","La croissance","Le développement humain","Le déficit"], correct:2, exp:"IDH = vie + éducation + revenu par habitant." },
    { q:"Un choc d'offre positif entraîne :", opts:["Hausse de P*","Baisse de P*","P* stable","Q* nul"], correct:1, exp:"Offre augmente → courbe Qo se déplace → P* baisse, Q* monte." },
    { q:"Qd = 200 − 4P. À P = 30, Qd = ?", opts:["80","60","120","140"], correct:0, exp:"Qd = 200 − 4×30 = 80 unités." },
    { q:"Si P > P*, il se crée :", opts:["Pénurie","Équilibre","Surplus","Pas d'effet"], correct:2, exp:"P > P* → Qo > Qd → surplus." },
    { q:"La courbe de demande est :", opts:["Croissante","Décroissante","Horizontale","Verticale"], correct:1, exp:"Décroissante : plus le prix monte, moins on demande." },
    { q:"Le taux de chômage = ?", opts:["Chômeurs/Population totale","Chômeurs/Population active","Actifs/Population totale","Emplois/Chômeurs"], correct:1, exp:"Taux chômage = (Chômeurs / Population active) × 100." },
    { q:"L'inflation désigne :", opts:["Baisse des prix","Hausse générale des prix","Hausse du chômage","Baisse du PIB"], correct:1, exp:"Inflation = hausse générale et durable du niveau des prix." },
  ],

  comptabilite: [
    { q:"Partie double : Total Débits = ?", opts:["Total Actif","Total Passif","Total Crédits","Total Charges"], correct:2, exp:"Règle absolue : Total Débits = Total Crédits." },
    { q:"Achat à crédit → compte crédité ?", opts:["601","521","401","411"], correct:2, exp:"Achat crédit : 601 DÉBIT / 401 Fournisseurs CRÉDIT." },
    { q:"Le compte 411 correspond à :", opts:["Fournisseurs","Clients","Banque","Achats"], correct:1, exp:"411 = Clients. Créance sur les clients." },
    { q:"Vente à crédit → écriture correcte :", opts:["701D/411C","411D/701C","521D/701C","601D/411C"], correct:1, exp:"411 Clients DÉBIT / 701 Ventes CRÉDIT." },
    { q:"Classe 5 du plan SYSCOHADA :", opts:["Stocks","Immobilisations","Trésorerie","Charges"], correct:2, exp:"Classe 5 = Trésorerie : 521 Banque, 571 Caisse." },
    { q:"Annuité linéaire = ?", opts:["VO×Taux×Durée","VO/Durée","VO×(1/Durée)","VNC×Taux"], correct:2, exp:"Annuité = VO × (1/Durée). Constante chaque année." },
    { q:"VNC d'un bien = ?", opts:["Valeur origine","Prix revente","VO − Amort. cumulés","Prix + charges"], correct:2, exp:"VNC = Valeur Nette Comptable = VO − cumul amortissements." },
    { q:"Le bilan vérifie toujours :", opts:["Actif > Passif","Actif = Passif","Passif > Actif","Actif − Passif = Capital"], correct:1, exp:"Équilibre fondamental : Total Actif = Total Passif." },
    { q:"Résultat net = ?", opts:["Trésorerie","Actif − Passif","Produits − Charges","Capitaux propres"], correct:2, exp:"Résultat net = Produits − Charges." },
    { q:"Le compte 521 = ?", opts:["Caisse","Banque","Fournisseurs","Clients"], correct:1, exp:"521 = Banque. Compte de trésorerie." },
    { q:"Comptabilité analytique sert à :", opts:["Faire le bilan","Calculer les coûts de revient","Enregistrer les ventes","Gérer la trésorerie"], correct:1, exp:"Comptabilité analytique = calcul et analyse des coûts de revient par produit ou activité." },
    { q:"Le coût de revient = ?", opts:["Prix de vente − Marge","Coût d'achat + Charges","Charges directes seulement","Prix d'achat"], correct:1, exp:"Coût de revient = somme de toutes les charges (directes + indirectes) liées à la production." },
    { q:"En analyse financière, le fonds de roulement (FR) = ?", opts:["Actif − Passif","Ressources durables − Emplois stables","Actif circulant − Passif circulant","Trésorerie nette"], correct:1, exp:"FR = Ressources durables (Passif non courant) − Emplois stables (Actif non courant)." },
    { q:"Un écart favorable sur coûts préétablis signifie :", opts:["Coût réel > Coût prévu","Coût réel = Coût prévu","Coût réel < Coût prévu","Pas de différence"], correct:2, exp:"Écart favorable : coût réel inférieur au coût prévu → économie réalisée." },
    { q:"Le tableau de financement analyse :", opts:["Les ventes","Les emplois et ressources de l'exercice","Les achats","Le résultat"], correct:1, exp:"Tableau de financement = variation des emplois et des ressources sur un exercice." },
  ],

  maths: [
    { q:"Dérivée de f(x) = 5x³ ?", opts:["5x²","15x²","15x³","5x"], correct:1, exp:"(xⁿ)' = n·xⁿ⁻¹. Donc (5x³)' = 15x²." },
    { q:"f'(x) > 0 → f est :", opts:["Décroissante","Constante","Croissante","Nulle"], correct:2, exp:"f'(x) > 0 = pente positive = f CROISSANTE." },
    { q:"Dérivée de f(x) = 4x² − 3x + 7 ?", opts:["8x − 3","4x − 3","8x + 7","4x"], correct:0, exp:"(4x²)' = 8x, (−3x)' = −3, (7)' = 0. f'(x) = 8x − 3." },
    { q:"Pour les extrema de f, on résout :", opts:["f(x)=0","f'(x)=0","f''(x)=0","f=f'"], correct:1, exp:"Extrema aux valeurs x où f'(x) = 0." },
    { q:"Si Δ > 0, l'équation ax²+bx+c=0 a :", opts:["0 solution","1 solution","2 solutions distinctes","∞ solutions"], correct:2, exp:"Δ > 0 → deux racines réelles : x = (−b ± √Δ) / 2a." },
    { q:"Formule intérêts simples I = ?", opts:["C₀(1+t)ⁿ","C₀×t×n","Cₙ−C₀","C₀/tn"], correct:1, exp:"I = C₀ × t × n. Capital × taux × durée." },
    { q:"Formule intérêts composés Cₙ = ?", opts:["C₀+I","C₀×t×n","C₀×(1+t)ⁿ","C₀/(1+t)ⁿ"], correct:2, exp:"Cₙ = C₀ × (1+t)ⁿ. Intérêts capitalisés chaque période." },
    { q:"C₀ = 600 000, t = 5%, n = 2 ans. I (simples) = ?", opts:["30 000","60 000","90 000","120 000"], correct:1, exp:"I = 600 000 × 0,05 × 2 = 60 000 FCFA." },
    { q:"P(Ā) = ?", opts:["P(A)","1+P(A)","1−P(A)","0"], correct:2, exp:"P(Ā) = 1 − P(A). Événement contraire." },
    { q:"(eˣ)' = ?", opts:["eˣ⁻¹","xeˣ","eˣ","1/eˣ"], correct:2, exp:"(eˣ)' = eˣ." },
    { q:"(ln x)' = ?", opts:["1/x","ln(x)","x","1/x²"], correct:0, exp:"(ln x)' = 1/x pour x > 0." },
    { q:"Valeur actuelle annuités : V₀ = a × ?", opts:["(1+t)ⁿ","[(1+t)ⁿ−1]/t","[1−(1+t)⁻ⁿ]/t","t×n"], correct:2, exp:"V₀ = a × [1−(1+t)⁻ⁿ] / t." },
    { q:"[u×v]' = ?", opts:["u'×v'","u'v+uv'","u'v−uv'","u'v"], correct:1, exp:"Règle du produit : u'v + uv'." },
    { q:"f'(x₀)=0 et f' passe +→− en x₀ : c'est un :", opts:["Minimum","Maximum","Inflexion","Zéro"], correct:1, exp:"f' passe de + à − → MAXIMUM local en x₀." },
    { q:"Intérêts composés vs simples sur 5 ans :", opts:["Simples > Composés","Composés > Simples","Identiques","Dépend du capital"], correct:1, exp:"Composés toujours supérieurs : les intérêts produisent eux-mêmes des intérêts." },
  ],

  anglais: [
    { q:"Choose: Every morning, the accountant ___ the invoices.", opts:["check","checks","is checking","checked"], correct:1, exp:"Habitude régulière, 3e personne du singulier → Present Simple + S." },
    { q:"Choose: Look! They ___ right now.", opts:["work","works","are working","worked"], correct:2, exp:"'Right now' indique une action en cours → Present Continuous." },
    { q:"Choose: Does she ___ in this company?", opts:["works","work","working","worked"], correct:1, exp:"Après DOES, le verbe revient toujours à sa base, sans -S." },
    { q:"Choose: We ___ in this company since 2020.", opts:["work","worked","have worked","are working"], correct:2, exp:"SINCE + point de départ + situation qui continue → Present Perfect." },
    { q:"Choose: She ___ the report yesterday.", opts:["has finished","finishes","finished","finish"], correct:2, exp:"'Yesterday' = date précise et terminée → Past Simple, jamais Present Perfect." },
    { q:"Choose: He ___ (not/understand) the instructions.", opts:["don't understand","doesn't understands","doesn't understand","not understand"], correct:2, exp:"3e personne + DOESN'T + base verbale sans -S." },
    { q:"Choose: The manager ___ negotiating when the client called.", opts:["was","were","is","has been"], correct:0, exp:"Sujet singulier (manager) → WAS + V-ing pour le Past Continuous." },
    { q:"Choose: They ___ already ___ the report.", opts:["have / sent","has / sent","have / send","had / sending"], correct:0, exp:"Sujet pluriel → HAVE + participe passé (Present Perfect)." },
    { q:"Choose the correct tag: You work here, ___?", opts:["do you","don't you","aren't you","isn't it"], correct:1, exp:"Affirmation avec verbe simple → tag négatif avec DON'T." },
    { q:"Choose the correct tag: You are available, ___?", opts:["do you","are you","aren't you","don't you"], correct:2, exp:"Affirmation avec BE (are) → tag négatif AREN'T YOU." },
    { q:"Choose: ___ called you yesterday? (question sur le sujet)", opts:["Who did","Who","What did","Whom did"], correct:1, exp:"Question sur le SUJET → pas d'auxiliaire DID, juste WHO + verbe." },
    { q:"Reported speech: \"I am tired,\" she said. →", opts:["She said she is tired.","She said she was tired.","She says she was tired.","She said she has been tired."], correct:1, exp:"Verbe introducteur au passé → backshift : am → was." },
    { q:"Reported speech: \"Where do you work?\" he asked. →", opts:["He asked where did I work.","He asked where I worked.","He asked where I work.","He asked where do I work."], correct:1, exp:"Question rapportée : ordre sujet-verbe rétabli, pas de DO, backshift do→ø+worked." },
    { q:"Reported speech: \"Close the door,\" she said. →", opts:["She said close the door.","She told to close the door.","She told me to close the door.","She told me closing the door."], correct:2, exp:"Ordre rapporté : TELL + objet + TO + base verbale." },
    { q:"Passive voice: The government increased the tax. →", opts:["The tax increased by the government.","The tax was increased by the government.","The tax is increased by the government.","The tax has increase by the government."], correct:1, exp:"Voix active au Past Simple → passif : WAS + participe passé." },
    { q:"Passive voice: They are discussing new measures. →", opts:["New measures are discussed.","New measures were being discussed.","New measures are being discussed.","New measures being discussed."], correct:2, exp:"Present Continuous actif → passif : ARE BEING + participe passé." },
    { q:"Choose: Employees ___ never share their password. (interdiction)", opts:["should","must","can","may"], correct:1, exp:"Interdiction stricte → MUST NOT, pas seulement un conseil (SHOULD)." },
    { q:"Choose: You ___ back up your files regularly. (conseil)", opts:["must","should","can","have to"], correct:1, exp:"SHOULD exprime un conseil, pas une obligation stricte." },
    { q:"Choose the comparative: This offer is ___ than the previous one.", opts:["more cheap","cheaper","the cheapest","as cheap"], correct:1, exp:"Adjectif court (1 syllabe) → adjectif + ER + THAN." },
    { q:"Choose the superlative: Is this the ___ offer available?", opts:["cheaper","more cheap","cheapest","as cheap as"], correct:2, exp:"Superlatif d'un adjectif court → THE + adjectif + EST." },
    { q:"Choose: I look forward to ___ you.", opts:["meet","meeting","meets","met"], correct:1, exp:"TO est ici une préposition (look forward TO) → toujours suivi de V-ing." },
    { q:"Choose: She wants ___ her English before applying.", opts:["improving","improve","to improve","improved"], correct:2, exp:"WANT est toujours suivi de TO + verbe de base." },
    { q:"Choose: I'd rather ___ from home today.", opts:["to work","working","work","worked"], correct:2, exp:"WOULD RATHER est TOUJOURS suivi de la base verbale, jamais de TO." },
    { q:"Choose: I'd rather you ___ the manager yet.", opts:["don't tell","didn't tell","won't tell","not tell"], correct:1, exp:"WOULD RATHER + sujet différent + Past Simple, même pour une valeur présente/future." },
    { q:"Choose: ___ the crisis, the company increased its profits.", opts:["Although","Despite","Even though","Though"], correct:1, exp:"DESPITE est suivi d'un nom, jamais d'une proposition sujet+verbe." },
    { q:"Choose: ___ he was tired, he kept working.", opts:["Despite","In spite of","Although","Because of"], correct:2, exp:"ALTHOUGH est suivi d'une proposition complète (sujet + verbe)." },
    { q:"Word building: The ___ of both companies worked hard. (MANAGE)", opts:["manager","management","manageable","managed"], correct:1, exp:"Nom d'action → suffixe -MENT : management." },
    { q:"Word building: This clause was originally ___. (LEGAL)", opts:["unlegal","inlegal","illegal","dislegal"], correct:2, exp:"Préfixe négatif devant L → IL- : illegal." },
    { q:"Choose the conditional: If it ___ tomorrow, we will cancel the meeting.", opts:["will rain","rains","rained","would rain"], correct:1, exp:"Conditionnel type 1 : IF + Present Simple, jamais WILL après IF." },
    { q:"Choose the conditional: If more people used solar energy, pollution ___.", opts:["will decrease","decreases","would decrease","decreased"], correct:2, exp:"Conditionnel type 2 (hypothétique) : IF + Past Simple, ... WOULD + base verbale." },
  ],


  espagnol: [
    { q:"Elige: Ella ___ (querer) abrir una cuenta. (cambio vocálico)", opts:["quere","quiere","quería","quiso"], correct:1, exp:"Querer: cambio vocálico e→ie en el presente, excepto nosotros/vosotros." },
    { q:"Elige: Nosotros ___ (pedir) más información. (nosotros — ¿cambio o no?)", opts:["pidemos","pedimos","pidamos","pedíamos"], correct:1, exp:"El cambio e→i desaparece en nosotros/vosotros: pedimos, no pidemos." },
    { q:"Pretérito indefinido: Yo ___ (hacer) un pedido adicional.", opts:["hací","hice","hací","hizo"], correct:1, exp:"Hacer es irregular en el indefinido: radical hic- + -e, sin tilde." },
    { q:"Elige: El proveedor ___ (llegar) a tiempo. (3ª persona)", opts:["llegó","llegué","llegara","llega"], correct:0, exp:"El cambio ortográfico -gar→gué solo afecta a la 1ª persona; en 3ª persona, llegar es regular." },
    { q:"Elige el verbo irregular en el imperfecto: Nosotros ___ al banco cada viernes.", opts:["ibamos","íbamos","fuimos","vamos"], correct:1, exp:"Ir es irregular en el imperfecto: íbamos, con tilde." },
    { q:"Perfecto o indefinido: Este año, la empresa ___ (tener) resultados positivos.", opts:["tuvo","tenía","ha tenido","tiene"], correct:2, exp:"'Este año' = periodo no terminado → pretérito perfecto." },
    { q:"Perfecto o indefinido: El año pasado, nosotros ___ (tener) dificultades.", opts:["hemos tenido","tuvimos","teníamos","tengamos"], correct:1, exp:"'El año pasado' = periodo cerrado → pretérito indefinido, nunca perfecto." },
    { q:"Elige el participio correcto de 'hacer':", opts:["hacido","hecho","hacado","hiciendo"], correct:1, exp:"Hacer tiene un participio irregular: hecho." },
    { q:"Pluscuamperfecto: Cuando fundó su empresa, ya ___ (trabajar) veinte años.", opts:["trabajó","trabajaba","había trabajado","trabaja"], correct:2, exp:"Acción anterior a otra acción pasada → pretérito pluscuamperfecto." },
    { q:"Elige el comparativo correcto: Nuestra campaña es ___ que la de nuestro competidor.", opts:["más buena","mejor","más bien","buenísima"], correct:1, exp:"Bueno tiene una forma comparativa irregular: mejor, nunca 'más bueno'." },
    { q:"Superlativo absoluto: Su anuncio se hizo ___ (viral).", opts:["muy viral","viralísimo","más viral","tan viral"], correct:1, exp:"El superlativo absoluto se forma añadiendo -ísimo/a al adjetivo." },
    { q:"Elige: ___ modernizar nuestros procesos. (obligación general, impersonal)", opts:["Tenemos que","Hay que","Debemos","Tengo que"], correct:1, exp:"Hay que expresa una obligación impersonal, sin sujeto gramatical." },
    { q:"Elige: El sistema ___ tener varios problemas. (probabilidad, no obligación)", opts:["debe","tiene que","debe de","hay que"], correct:2, exp:"Deber DE + infinitivo expresa una probabilidad, no una obligación." },
    { q:"Futuro irregular: Yo ___ (tener) que trabajar mucho.", opts:["tendré","teneré","tendrá","tenré"], correct:0, exp:"Tener es irregular en el futuro: radical tendr- + terminaciones regulares." },
    { q:"Elige: Mañana ___ tener mi primera entrevista. (intención ya decidida)", opts:["tendré","voy a","iré a","tengo a"], correct:1, exp:"Ir a + infinitivo expresa una intención o plan ya decidido." },
    { q:"Futuro compuesto: Para 2028, nosotros ___ (duplicar) la producción.", opts:["duplicaremos","habremos duplicado","duplicábamos","hemos duplicado"], correct:1, exp:"Futuro compuesto: haber en futuro + participio, acción terminada antes de un momento futuro." },
    { q:"Elige la perífrasis correcta: Nosotros ___ invirtiendo en formación. (continuidad)", opts:["seguir","seguimos","seguido","seguiríamos"], correct:1, exp:"Seguir + gerundio (nunca infinitivo) expresa continuidad." },
    { q:"Voz pasiva: El tratado ___ (ser/firmar) por el gobierno.", opts:["fue firmado","fue firmando","es firmar","había firmado"], correct:0, exp:"Voz pasiva: ser (conjugado) + participio pasado." },
    { q:"Pasiva refleja: ___ muchos productos cada año. (importar, agente desconocido)", opts:["Es importado","Se importan","Son importados","Se importa"], correct:1, exp:"Pasiva refleja: se + verbo en 3ª persona, acordado con el sujeto plural 'productos'." },
    { q:"Condicional de cortesía: ¿___ usted enviarme el catálogo?", opts:["Puede","Podría","Pudo","Poder"], correct:1, exp:"El condicional (podría) suaviza una petición formal, más cortés que el presente." },
    { q:"Elige: Le agradecería que me ___ pronto. (subjuntivo imperfecto)", opts:["responde","respondería","respondiera","responder"], correct:2, exp:"'Agradecería que' exige siempre el subjuntivo imperfecto." },
    { q:"Condicional compuesto: Si hubiéramos invertido antes, ___ más éxito.", opts:["tendríamos","habríamos tenido","tuvimos","teníamos"], correct:1, exp:"Hipótesis irreal sobre el pasado: si + subj. pluscuamperfecto, ... habría + participio." },
    { q:"Ser o Estar: La reunión ___ en nuestra sede el viernes. (lugar de un evento)", opts:["está","es","estará","siendo"], correct:1, exp:"El lugar de un evento organizado se expresa siempre con ser, nunca con estar." },
    { q:"Ser o Estar: El catálogo ___ terminado. (resultado de una acción)", opts:["es","está","fue siendo","será"], correct:1, exp:"Estar + participio expresa el resultado de una acción." },
    { q:"Gerundio irregular: Estamos ___ (construir) un nuevo almacén.", opts:["construiendo","construyendo","construendo","construciendo"], correct:1, exp:"Los verbos con radical terminado en vocal forman el gerundio en -yendo: construyendo." },
    { q:"Por o Para: Cambiamos el método ___ los problemas recurrentes. (causa)", opts:["para","por","por a","para de"], correct:1, exp:"La causa se expresa siempre con 'por'." },
    { q:"Por o Para: Necesitamos el informe ___ el día quince. (plazo límite)", opts:["por","para","por a","desde"], correct:1, exp:"El plazo límite se expresa con 'para'." },
    { q:"Pronombres: Le comuniqué la decisión al candidato. → forma correcta con pronombres:", opts:["Le la comuniqué","Se la comuniqué","Lo le comuniqué","Se le comuniqué"], correct:1, exp:"Cuando CI (le) y CD (la) coinciden, le se transforma obligatoriamente en 'se': se la comuniqué." },
    { q:"Verbos tipo gustar: A los empleados ___ (interesar) el salario emocional.", opts:["interesa","interesan","les interesa","le interesan"], correct:2, exp:"El sujeto real (el salario emocional) es singular, con CI plural 'les': les interesa." },
    { q:"Subjuntivo de deseo: Espero que todos ___ (entender) la importancia.", opts:["entienden","entiendan","entendieron","entender"], correct:1, exp:"'Esperar que' con sujetos diferentes exige el subjuntivo presente." },
    { q:"Subjuntivo vs indicativo: No creo que la situación ___ (ser) tan simple.", opts:["es","sea","era","fue"], correct:1, exp:"'No creer que' (forma negativa) exige el subjuntivo, a diferencia de 'creer que' afirmativo." },
    { q:"Imperativo: ___ (escuchar, ustedes afirmativo) con atención.", opts:["Escuchan","Escuchen","Escuchad","Escucha"], correct:1, exp:"El imperativo de ustedes usa las formas del subjuntivo presente: escuchen." },
    { q:"Imperativo negativo: No ___ (interrumpir, tú) al cliente.", opts:["interrumpas","interrumpes","interrumpe","interrumpid"], correct:0, exp:"El imperativo negativo usa SIEMPRE el subjuntivo presente, incluso con tú: no interrumpas." },
    { q:"Elige el imperativo irregular de 'poner' (tú afirmativo):", opts:["pone","pon","ponga","poned"], correct:1, exp:"Poner tiene un imperativo irregular en tú: pon (como ten, ven, sal, haz, di, ve, sé)." },
    { q:"Conjunciones: Trabajamos para que la empresa ___ (crecer).", opts:["crece","crezca","creció","crecerá"], correct:1, exp:"'Para que' exige siempre el subjuntivo, sin excepción." },
    { q:"Conjunciones: Cuando ___ (llegar) el jefe, empezaremos. (acción futura)", opts:["llega","llegue","llegará","llegaba"], correct:1, exp:"'Cuando' + subjuntivo para una acción futura o hipotética." },
    { q:"Interrogativos: ¿___ es su mayor fortaleza? (elegir entre varias cualidades)", opts:["Qué","Cuál","Cómo","Quién"], correct:1, exp:"'Cuál' se usa para elegir entre varias opciones dentro de un conjunto." },
    { q:"Interrogativos: ¿___ es la contabilidad? (pedir una definición)", opts:["Cuál","Qué","Cómo","Cuánto"], correct:1, exp:"'Qué' se usa para pedir una definición." },
    { q:"Discurso indirecto: «Vendré mañana» → Dijo que ___ al día siguiente.", opts:["vendrá","vendría","viene","vino"], correct:1, exp:"Futuro simple → condicional simple en el discurso indirecto con verbo introductorio en pasado." },
    { q:"Discurso indirecto: La empresa desmintió que ___ (haber) problemas.", opts:["había","hubiera","habrá","hay"], correct:1, exp:"'Desmentir que' exige siempre el subjuntivo, porque niega." },
    { q:"Condicional tipo 2: Si ___ (tener) más presupuesto, contrataríamos a más personal.", opts:["tenemos","tuviéramos","tendríamos","tuvimos"], correct:1, exp:"Tipo 2 (irreal presente): Si + imperfecto de subjuntivo, condicional simple." },
    { q:"Condicional tipo 3: Si hubiéramos diversificado antes, no ___ (quebrar).", opts:["quebraríamos","habríamos quebrado","quebramos","quebraremos"], correct:1, exp:"Tipo 3 (irreal pasado): Si + pluscuamperfecto de subjuntivo, condicional compuesto." },
    { q:"Formación de palabras: 'renovar' → el nombre de acción es:", opts:["el renovamiento","la renovación","la renovidad","el renovable"], correct:1, exp:"Los verbos en -ar forman nombres de acción femeninos en -ción: la renovación." },
    { q:"Formación de palabras: 'vencer' → el nombre de acción es:", opts:["la vencición","el vencimiento","la vencidad","el vencible"], correct:1, exp:"El sufijo -miento forma nombres de acción masculinos: el vencimiento." },
    { q:"Corrige: 'Es inposible modificar esta cláusula.'", opts:["inposible","imposible","desposible","irposible"], correct:1, exp:"Delante de P, el prefijo IN- se convierte en IM-: imposible." },
    { q:"Se impersonal: ___ (necesitar) personal cualificado.", opts:["Se necesitan","Se necesita","Se necesitó","Necesitan"], correct:1, exp:"'Personal' es un complemento de persona, no un sujeto-cosa: el se impersonal va siempre en singular." },
    { q:"Pasiva refleja: ___ (publicar) los informes cada trimestre.", opts:["Se publica","Se publican","Se publicó","Publican"], correct:1, exp:"Pasiva refleja: el verbo concuerda con el sujeto-cosa plural 'los informes'." },
    { q:"Elige: No se cree que la fusión ___ (confirmarse) pronto.", opts:["se confirma","se confirme","se confirmará","se confirmó"], correct:1, exp:"La forma negativa de una expresión de opinión exige el subjuntivo." },
    { q:"Concesión: ___ el proyecto es caro, lo aprobaremos. (hecho cierto y conocido)", opts:["A pesar de","Aunque","Pese a","Sin embargo"], correct:1, exp:"Aunque + indicativo (es) para un hecho establecido y cierto." },
    { q:"Concesión: ___ del costo, aprobaremos el proyecto. (+ sustantivo)", opts:["Aunque","A pesar","Sin embargo","No obstante"], correct:1, exp:"'A pesar de' va seguido de un sustantivo o infinitivo, nunca de un verbo conjugado." },
    { q:"Duración: ___ dos años trabajando en esta empresa.", opts:["Hace","Llevo","Desde","Soy"], correct:1, exp:"Llevar (presente) + gerundio expresa la duración de una acción en curso." },
    { q:"Hábito: ___ (soler, 3ª pers.) empezar su jornada temprano.", opts:["Solé","Suele","Solería","Solerá"], correct:1, exp:"Soler tiene diptongación o→ue en presente: suele." },
    { q:"Pasado reciente: ___ (acabar de) recibir un ascenso.", opts:["Acabó de","Acaba de","Acabará de","Ha acabado de"], correct:1, exp:"Acabar de en presente expresa un pasado muy reciente." },
    { q:"Números: ¿Cómo se escribe correctamente dos millones en español?", opts:["2,000,000","2.000.000","2 000 000","2'000'000"], correct:1, exp:"En español, el punto separa los miles, al revés que en inglés." },
    { q:"Artículo neutro: ___ importante es cumplir el plazo.", opts:["El","La","Lo","Los"], correct:2, exp:"'Lo' + adjetivo masculino singular forma un sustantivo abstracto." },
    { q:"Elige: Tenemos ___ trabajo esta semana.", opts:["muy","mucho","muchos","muy mucho"], correct:1, exp:"Delante de un sustantivo se usa siempre mucho/a/os/as, nunca 'muy'." },
  ],



  /* Quiz culture générale / infini */
  culture: [
    { q:"Capitale du Sénégal ?", opts:["Saint-Louis","Thiès","Dakar","Ziguinchor"], correct:2, exp:"Dakar est la capitale du Sénégal depuis l'indépendance en 1960." },
    { q:"Le FMI signifie :", opts:["Fonds Monétaire International","Fédération Mondiale du Investissement","Fonds Mondial d'Intervention","Forum Multilatéral International"], correct:0, exp:"FMI = Fonds Monétaire International. Organisation internationale basée à Washington." },
    { q:"La BAD est :", opts:["Banque Africaine de Développement","Bureau Africain de Douane","Banque d'Aide au Développement","Bureau Afrique Dakar"], correct:0, exp:"BAD = Banque Africaine de Développement. Siège à Abidjan, Côte d'Ivoire." },
    { q:"L'UEMOA regroupe combien de pays ?", opts:["6","7","8","9"], correct:2, exp:"UEMOA = 8 pays : Sénégal, CI, Mali, Burkina Faso, Niger, Bénin, Togo, Guinée-Bissau." },
    { q:"Le FCFA est la monnaie de :", opts:["Afrique du Sud","Zone CFA","Maroc","Égypte"], correct:1, exp:"FCFA = Franc CFA. Monnaie de la zone franc en Afrique subsaharienne." },
    { q:"L'OMC signifie :", opts:["Organisation Mondiale du Commerce","Office Mondial de Comptabilité","Organisation Mondiale du Capital","Office du Marché Commun"], correct:0, exp:"OMC = Organisation Mondiale du Commerce. Régule le commerce international." },
    { q:"Le siège de la BCEAO est à :", opts:["Dakar","Abidjan","Bamako","Cotonou"], correct:0, exp:"Le siège de la BCEAO est à Dakar, Sénégal." },
    { q:"PIB du Sénégal en 2026 : environ ?", opts:["15 milliards $","30 milliards $","45 milliards $","60 milliards $"], correct:1, exp:"Le PIB du Sénégal est estimé à environ 30 milliards de dollars en 2026." },
    { q:"Le PSE signifie :", opts:["Plan Sénégal Émergent","Programme de Soutien Économique","Plan Social et Éducatif","Programme Sénégalais d'Exportation"], correct:0, exp:"PSE = Plan Sénégal Émergent. Cadre de référence de la politique économique du Sénégal." },
    { q:"L'indépendance du Sénégal date de :", opts:["1958","1960","1962","1965"], correct:1, exp:"Le Sénégal a accédé à l'indépendance le 4 avril 1960." },
  ],

  statistiques: [
    { q:"Le mode d'une série est :", opts:["La moyenne des valeurs","La valeur la plus fréquente","La valeur du milieu","L'écart-type"], correct:1, exp:"Le mode est la modalité qui revient le plus souvent — valable pour toute variable, qualitative ou quantitative." },
    { q:"Une variable est dite discrète quand :", opts:["Elle prend n'importe quelle valeur d'un intervalle","Elle avance par bonds, valeurs entières","Elle n'a pas de valeur numérique","Elle est toujours négative"], correct:1, exp:"Discrète = valeurs entières comptables (ex : nombre d'étudiants). Continue = infinité de valeurs possibles dans un intervalle." },
    { q:"Pour une variable qualitative nominale, on peut calculer :", opts:["Effectifs cumulés","Effectif et fréquence seulement","La médiane","L'écart-type"], correct:1, exp:"Sans ordre logique entre les modalités, cumuler n'a pas de sens — seuls effectif et fréquence sont pertinents." },
    { q:"Sur un histogramme à amplitudes de classes inégales, il faut utiliser :", opts:["Les effectifs bruts","La densité (fᵢ/aᵢ)","Le mode","La covariance"], correct:1, exp:"Sans densité, une classe plus large paraîtrait faussement plus 'peuplée' — seule l'aire des barres doit représenter fidèlement l'effectif." },
    { q:"Pour un taux d'évolution moyen (intérêts composés), on utilise :", opts:["La moyenne arithmétique","La moyenne géométrique","La moyenne harmonique","Le mode"], correct:1, exp:"Les taux se composent (se multiplient) d'année en année : c'est la moyenne géométrique qui donne le taux équivalent correct." },
    { q:"Pour une vitesse moyenne sur un trajet à allures variées, on utilise :", opts:["La moyenne arithmétique simple","La moyenne géométrique","La moyenne harmonique","La moyenne quadratique"], correct:2, exp:"La vitesse est un rapport (distance/temps) : il faut pondérer par le temps réellement passé à chaque allure, via la moyenne harmonique." },
    { q:"L'ordre toujours vérifié entre les quatre moyennes est :", opts:["Q ≤ Arithmétique ≤ G ≤ H","H ≤ G ≤ Arithmétique ≤ Q","G ≤ H ≤ Q ≤ Arithmétique","Arithmétique ≤ H ≤ G ≤ Q"], correct:1, exp:"La moyenne harmonique est toujours la plus basse, la quadratique toujours la plus haute." },
    { q:"Pour un effectif pair, le rang du quartile Q₂ (médiane) se calcule :", opts:["En faisant la moyenne des deux valeurs du milieu","En prenant le rang p+1 (jamais de moyenne)","Toujours au rang 1","Cela dépend du mode"], correct:1, exp:"Convention du cours : effectif pair (2p valeurs) → on prend directement la valeur au rang p+1, sans moyenne." },
    { q:"L'intervalle interquartile [Q₁;Q₃] contient :", opts:["25% des observations","50% des observations","75% des observations","100% des observations"], correct:1, exp:"Q₁ à Q₃ couvre exactement la moitié centrale de la série, sans être perturbé par des valeurs extrêmes." },
    { q:"La variance est :", opts:["Le moment centré d'ordre 1","Le moment centré d'ordre 2","Le moment non centré d'ordre 1","La racine de l'écart-type"], correct:1, exp:"σ² = μ₂ = moyenne des (xᵢ−x̄)² — le moment centré d'ordre 2 par définition." },
    { q:"Le coefficient de variation (CV) sert à :", opts:["Remplacer la moyenne","Comparer la dispersion de séries d'échelles différentes","Calculer le mode","Mesurer l'asymétrie"], correct:1, exp:"CV = σ/x̄, sans unité, donc comparable même entre deux séries totalement différentes en échelle." },
    { q:"Un coefficient de variation CV > 0,30 signifie que la série est :", opts:["Homogène","Hétérogène","Symétrique","Indépendante"], correct:1, exp:"Au-delà du seuil de 0,30, on considère la distribution comme dispersée (hétérogène)." },
    { q:"Un coefficient d'asymétrie de Fisher γ₁ > 0 signifie que la distribution est :", opts:["Étalée vers la gauche","Parfaitement symétrique","Étalée vers la droite","Impossible à interpréter"], correct:2, exp:"γ₁ positif = la 'traîne' s'allonge vers les grandes valeurs (cas typique des salaires)." },
    { q:"Un coefficient d'aplatissement de Pearson γ₂ < 0 signifie que la distribution est :", opts:["Plus pointue que la loi normale (leptokurtique)","Plus aplatie que la loi normale (platikurtique)","Identique à la loi normale","Toujours symétrique"], correct:1, exp:"γ₂ négatif = platikurtique, la distribution est plus 'plate' que la référence normale." },
    { q:"Si Y = a·X + b, la variance de Y vaut :", opts:["a·V(X) + b","a²·V(X)","V(X) + b²","a·V(X)"], correct:1, exp:"Le décalage b disparaît de la variance ; seul le facteur multiplicatif a, au carré, compte." },
    { q:"L'indice de Gini vaut 0 lorsque :", opts:["La répartition est parfaitement inégalitaire","La répartition est parfaitement égalitaire","La série est symétrique","La variance est maximale"], correct:1, exp:"G=0 correspond à la courbe de Lorenz confondue avec la diagonale : égalité parfaite." },
    { q:"Une hausse générale et proportionnelle des salaires (même % pour tous) :", opts:["Augmente toujours le Gini","Diminue toujours le Gini","Ne change jamais le Gini","Double le Gini"], correct:2, exp:"Le Gini mesure une inégalité relative : si tout le monde gagne x% de plus, les proportions entre individus restent identiques." },
    { q:"Dans un tableau de contingence, l'effectif théorique d'indépendance de la case (i,j) est :", opts:["nᵢ. + n.ⱼ", "nᵢ. × n.ⱼ / n", "nᵢⱼ / n", "n / nᵢⱼ"], correct:1, exp:"C'est l'effectif qu'on observerait si X et Y étaient parfaitement indépendants." },
    { q:"Le χ² de contingence vaut 0 lorsque :", opts:["X et Y sont fortement liées","Le tableau est parfaitement conforme à l'indépendance","L'échantillon est petit","La variance est nulle"], correct:1, exp:"χ²=0 signifie que chaque case observée coïncide exactement avec sa valeur théorique d'indépendance." },
    { q:"Dans la régression linéaire, la pente â se calcule par :", opts:["â = V(X) / Cov(X,Y)","â = Cov(X,Y) / V(X)","â = x̄ / ȳ","â = Cov(X,Y) × V(X)"], correct:1, exp:"â = Cov(X,Y)/V(X) — plus X et Y varient ensemble, plus la pente est marquée." },
    { q:"La droite de régression passe toujours par :", opts:["Le point (0,0)","Le point moyen (x̄,ȳ)","Le premier point du nuage","Le point (x̄,0)"], correct:1, exp:"C'est une conséquence directe de la formule b̂ = ȳ − â·x̄, qui garantit ȳ = â·x̄ + b̂." },
  ],

  microeconomie: [
    { q:"La microéconomie étudie principalement :", opts:["Le PIB national","Les décisions individuelles des agents","L'inflation globale","La balance commerciale"], correct:1, exp:"La microéconomie étudie les choix individuels des consommateurs et des entreprises." },
    { q:"L'utilité marginale mesure :", opts:["Le prix d'un bien","La satisfaction d'une unité supplémentaire","Le revenu total","Le coût de production"], correct:1, exp:"Um = variation de satisfaction pour une unité de bien consommée en plus." },
    { q:"La loi de l'utilité marginale décroissante signifie que :", opts:["Um augmente avec la quantité","Um diminue avec la quantité","Um est constante","Um est toujours négative"], correct:1, exp:"Plus on consomme d'un bien, moins chaque unité supplémentaire apporte de satisfaction." },
    { q:"À l'optimum du consommateur :", opts:["Umx = Umy","Umx/Px = Umy/Py","Px = Py","Umx × Px = Umy × Py"], correct:1, exp:"L'utilité marginale par franc dépensé doit être égale pour tous les biens." },
    { q:"La contrainte budgétaire d'un consommateur dépend de :", opts:["Ses goûts uniquement","Son revenu et les prix","La concurrence","L'État"], correct:1, exp:"R = Px·X + Py·Y — le revenu et les prix des biens déterminent les combinaisons accessibles." },
    { q:"Le coût marginal est :", opts:["Le coût total divisé par Q","Le coût de la dernière unité produite","Le coût fixe","Le prix de vente"], correct:1, exp:"Cm = variation du coût total pour une unité supplémentaire produite." },
    { q:"Le coût marginal coupe le coût moyen :", opts:["À son maximum","À son minimum","Au début de la courbe","Jamais"], correct:1, exp:"Relation classique : Cm croise CM exactement en son point minimum." },
    { q:"En concurrence pure et parfaite, à l'équilibre :", opts:["Prix > Coût marginal","Prix = Coût marginal","Prix < Coût marginal","Prix = Coût fixe"], correct:1, exp:"CPP : les entreprises produisent jusqu'à P = Cm." },
    { q:"Un monopole fixe son prix là où :", opts:["Rm = Cm","Prix = Cm","CM = Cm","Rm = 0"], correct:0, exp:"Le monopole maximise son profit où Recette Marginale = Coût Marginal." },
    { q:"Le prix pratiqué par un monopole est généralement :", opts:["Inférieur à la CPP","Égal à la CPP","Supérieur à la CPP","Nul"], correct:2, exp:"Un monopole exploite son pouvoir de marché : son prix est plus élevé qu'en concurrence pure." },
    { q:"Une courbe d'indifférence représente :", opts:["Un seul niveau de prix","Des paniers procurant la même utilité","Le revenu du consommateur","Le coût de production"], correct:1, exp:"Toutes les combinaisons de biens sur une même courbe donnent la même satisfaction totale." },
    { q:"L'oligopole se caractérise par :", opts:["Un seul offreur","Une infinité d'offreurs","Un petit nombre d'offreurs interdépendants","Aucun offreur"], correct:2, exp:"Oligopole : peu d'entreprises, chacune tient compte des réactions des autres." },
    { q:"La loi des rendements marginaux décroissants explique que :", opts:["Le coût marginal finit par augmenter","Le prix baisse toujours","Le profit est nul","La demande augmente"], correct:0, exp:"Au-delà d'un seuil, chaque unité supplémentaire produite coûte plus cher (Cm croissant)." },
    { q:"La productivité marginale du travail mesure :", opts:["Le salaire moyen","La production supplémentaire d'un travailleur de plus","Le coût du capital","Le taux de chômage"], correct:1, exp:"PmL = variation de production liée à l'embauche d'un travailleur supplémentaire." },
    { q:"À court terme, en microéconomie :", opts:["Tous les facteurs sont variables","Au moins un facteur est fixe","Il n'y a pas de production","Le capital est toujours variable"], correct:1, exp:"Court terme : au moins un facteur de production (souvent le capital) est fixe." },
  ],
};

/* Mélanger un tableau */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Obtenir N questions aléatoires d'une matière */
export function getQuestions(matiere, n = 5) {
  const pool = BANQUE[matiere] || BANQUE.economie;
  return shuffle(pool).slice(0, Math.min(n, pool.length));
}

/* Quiz infini : mélange toutes les matières */
export function getQuestionsInfinies(n = 10) {
  const all = Object.values(BANQUE).flat();
  return shuffle(all).slice(0, n);
}
