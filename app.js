

const qs = sel => document.querySelector(sel);
const qsa = sel => document.querySelectorAll(sel);

// ---------- storage util ----------
const store = {
  get(key){ return JSON.parse(localStorage.getItem(key) || "[]"); },
  set(key, arr){ localStorage.setItem(key, JSON.stringify(arr)); }
};

// ---------- seed inicial (usuarios, pacientes, atendimentos, auxiliares) ----------
if(!localStorage.getItem('usuarios')){
  store.set('usuarios', [{id:1, nome:"Admin", email:"admin@example.com", senha:"admin"}]);
}
if(!localStorage.getItem('pacientes')){
  store.set('pacientes', [
    {id:1,nome:"João Silva", cpf:"11122233344", telefone:"(63)99999-0001", obs:"Diabético"},
    {id:2,nome:"Maria Costa", cpf:"22233344455", telefone:"(63)99999-0002", obs:"Pressão alta"}
  ]);
}
if(!localStorage.getItem('riscos')){
  store.set('riscos', [
    {id:1,nivel:1,descricao:"Crítico"},
    {id:2,nivel:2,descricao:"Alto"},
    {id:3,nivel:3,descricao:"Médio"},
    {id:4,nivel:4,descricao:"Baixo"},
    {id:5,nivel:5,descricao:"Não Urgente"}
  ]);
}
if(!localStorage.getItem('medicos')){
  store.set('medicos', [
    {id:1,nome:"Dr. Pedro"},
    {id:2,nome:"Dra. Ana"}
  ]);
}
if(!localStorage.getItem('salas')){
  store.set('salas', [
    {id:1,ident:"A-1"},
    {id:2,ident:"A-2"},
    {id:3,ident:"Triagem"}
  ]);
}
if(!localStorage.getItem('atendimentos')){
  store.set('atendimentos', [
    {id:1,paciente:"João Silva", cpf:"11122233344", risco:2, sala:"A-1", medico:"Dr. Pedro", data: new Date().toISOString(), status:"concluido"}
  ]);
}

// ---------- views ----------
const views = {
  login: qs('#view-login'),
  dashboard: qs('#view-dashboard'),
  pacientes: qs('#view-pacientes'),
  atendimentos: qs('#view-atendimentos'),
  usuarios: qs('#view-usuarios'),
  auxiliares: qs('#view-auxiliares'),
  integrantes: qs('#view-integrantes')
};

const topbar = qs('#topbar');

function show(viewEl){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  viewEl.classList.add('active');
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  topbar.style.display = 'none';
  bindNavButtons();
  // populadores
  renderPacientes();
  renderAtendimentos();
  renderUsuarios();
  renderMedicos();
  renderRiscos();
  renderSalas();
  populateAtendimentoSelects();
  populateFiltroSelects();
  updateDashboard();
  startCarousel();
});

// -------------- NAV / LOGIN --------------
function bindNavButtons(){
  qs('#btn-dashboard').onclick = ()=> show(views.dashboard);
  qs('#btn-pacientes').onclick = ()=> show(views.pacientes);
  qs('#btn-atendimentos').onclick = ()=> show(views.atendimentos);
  qs('#btn-usuarios').onclick = ()=> show(views.usuarios);
  qs('#btn-auxiliares').onclick = ()=> show(views.auxiliares);
  qs('#btn-integrantes').onclick = ()=> show(views.integrantes);
  qs('#btn-logout').onclick = logout;
}

// login
qs('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = qs('#loginEmail').value.trim();
  const senha = qs('#loginSenha').value.trim();
  const users = store.get('usuarios');
  const user = users.find(u => u.email === email && u.senha === senha);
  if(!user){
    alert('Login inválido. Verifique email/senha.');
    return;
  }
  topbar.style.display = 'flex';
  show(views.dashboard);
  qs('#loginForm').reset();
});

// register toggle
qs('#btnShowRegister').addEventListener('click', () => {
  qs('#registerForm').classList.remove('hidden');
  qs('#loginForm').classList.add('hidden');
});
qs('#btnCancelRegister').addEventListener('click', () => {
  qs('#registerForm').classList.add('hidden');
  qs('#loginForm').classList.remove('hidden');
});

// register handler
qs('#registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const nome = qs('#regName').value.trim();
  const email = qs('#regEmail').value.trim();
  const pass = qs('#regPass').value.trim();
  let users = store.get('usuarios');
  if(users.find(u => u.email === email)){
    alert('Já existe usuário com esse email.');
    return;
  }
  const nid = (users.length ? Math.max(...users.map(u=>u.id)) : 0) + 1;
  users.push({id:nid, nome, email, senha:pass});
  store.set('usuarios', users);
  alert('Conta criada. Faça login com o novo usuário.');
  qs('#registerForm').reset();
  qs('#registerForm').classList.add('hidden');
  qs('#loginForm').classList.remove('hidden');
});

// logout
function logout(){
  topbar.style.display = 'none';
  show(views.login);
}

// -------------- PACIENTES CRUD + FILTRO --------------
function renderPacientes(filtered){
  const tbody = qs('#tabelaPacientes tbody'); tbody.innerHTML='';
  const arr = filtered || store.get('pacientes');
  arr.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${p.nome}</td><td>${p.cpf}</td>
    <td>
      <button onclick="editarPaciente(${p.id})">Editar</button>
      <button onclick="excluirPaciente(${p.id})">Excluir</button>
    </td>`;
    tbody.appendChild(tr);
  });
}
window.editarPaciente = function(id){
  const arr = store.get('pacientes'); const p = arr.find(x=>x.id===id);
  qs('#pacienteId').value = p.id; qs('#pacienteNome').value=p.nome; qs('#pacienteCPF').value=p.cpf; qs('#pacienteTelefone').value=p.telefone; qs('#pacienteObs').value=p.obs;
};
window.excluirPaciente = function(id){
  if(!confirm('Confirmar exclusão?')) return;
  let arr = store.get('pacientes'); arr = arr.filter(x=>x.id!==id); store.set('pacientes',arr); renderPacientes(); updateDashboard();
};

qs('#pacienteForm').addEventListener('submit', e=>{
  e.preventDefault();
  const id = parseInt(qs('#pacienteId').value || 0);
  const nome = qs('#pacienteNome').value.trim(), cpf=qs('#pacienteCPF').value.trim();
  if(!nome || !cpf){ alert('Nome e CPF são obrigatórios'); return; }
  let arr = store.get('pacientes');
  if(id){
    arr = arr.map(x=> x.id===id ? {...x,nome,cpf,telefone:qs('#pacienteTelefone').value,obs:qs('#pacienteObs').value} : x);
  } else {
    const nid = (arr.length? Math.max(...arr.map(x=>x.id)):0)+1;
    arr.push({id:nid,nome,cpf,telefone:qs('#pacienteTelefone').value,obs:qs('#pacienteObs').value});
  }
  store.set('pacientes',arr); renderPacientes(); qs('#pacienteForm').reset(); qs('#pacienteId').value='';
  updateDashboard();
});

// filtros pacientes
qs('#btnFiltrarPacientes').addEventListener('click', () => {
  const nome = qs('#filtroPacientesNome').value.trim().toLowerCase();
  const cpf = qs('#filtroPacientesCPF').value.trim();
  let arr = store.get('pacientes');
  if(nome) arr = arr.filter(p => p.nome.toLowerCase().includes(nome));
  if(cpf) arr = arr.filter(p => p.cpf.includes(cpf));
  renderPacientes(arr);
});
qs('#btnLimparFiltroPacientes').addEventListener('click', () => {
  qs('#filtroPacientesNome').value=''; qs('#filtroPacientesCPF').value=''; renderPacientes();
});

// -------------- ATENDIMENTOS CRUD + FILTROS --------------
function renderAtendimentos(filtered){
  const tbody = qs('#tabelaAtendimentos tbody'); tbody.innerHTML='';
  const arr = filtered || store.get('atendimentos');
  const riscos = store.get('riscos');
  arr.forEach(a=>{
    const riscoObj = riscos.find(r=> r.nivel == a.risco);
    const riscoLabel = riscoObj ? `${riscoObj.nivel} - ${riscoObj.descricao}` : a.risco;
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${a.paciente}</td><td>${riscoLabel}</td><td>${a.sala}</td><td>${a.medico}</td><td>${new Date(a.data).toLocaleString()}</td>
    <td>
      <button onclick="editarAt(${a.id})">Editar</button>
      <button onclick="excluirAt(${a.id})">Excluir</button>
    </td>`;
    tbody.appendChild(tr);
  });
}
window.editarAt = function(id){
  const arr = store.get('atendimentos'); const a = arr.find(x=>x.id===id);
  qs('#atId').value=a.id; qs('#atPaciente').value=a.paciente; qs('#atRisco').value=a.risco; qs('#atSala').value=a.sala; qs('#atMedico').value=a.medico;
};
window.excluirAt = function(id){
  if(!confirm('Confirmar exclusão do atendimento?')) return;
  let arr = store.get('atendimentos'); arr = arr.filter(x=>x.id!==id); store.set('atendimentos',arr); renderAtendimentos(); updateDashboard();
};

qs('#atendimentoForm').addEventListener('submit', e=>{
  e.preventDefault();
  const id = parseInt(qs('#atId').value || 0);
  const paciente = qs('#atPaciente').value.trim();
  if(!paciente){ alert('Paciente é obrigatório'); return; }
  let arr = store.get('atendimentos');
  if(id){
    arr = arr.map(x => x.id===id ? {...x, paciente, risco:qs('#atRisco').value, sala:qs('#atSala').value, medico:qs('#atMedico').value} : x);
  } else {
    const nid = (arr.length? Math.max(...arr.map(x=>x.id)):0)+1;
    arr.push({id:nid,paciente,cpf:'',risco:qs('#atRisco').value,sala:qs('#atSala').value,medico:qs('#atMedico').value,data:new Date().toISOString(),status:'aguardando'});
  }
  store.set('atendimentos',arr); renderAtendimentos(); qs('#atendimentoForm').reset(); populateAtendimentoSelects(); updateDashboard();
});
qs('#btnNovoAtendimento').addEventListener('click', () => { qs('#atendimentoForm').reset(); qs('#atId').value=''; });

// filtros atendimentos
qs('#btnFiltrarAt').addEventListener('click', () => {
  const nome = qs('#filtroAtPaciente').value.trim().toLowerCase();
  const data = qs('#filtroAtData').value;
  const risco = qs('#filtroAtRisco').value;
  const medico = qs('#filtroAtMedico').value;
  let arr = store.get('atendimentos');
  if(nome) arr = arr.filter(a => a.paciente.toLowerCase().includes(nome));
  if(data) arr = arr.filter(a => new Date(a.data).toISOString().slice(0,10) === data);
  if(risco) arr = arr.filter(a => String(a.risco) === String(risco));
  if(medico) arr = arr.filter(a => a.medico === medico);
  renderAtendimentos(arr);
});
qs('#btnLimparFiltroAt').addEventListener('click', () => {
  qs('#filtroAtPaciente').value=''; qs('#filtroAtData').value=''; qs('#filtroAtRisco').value=''; qs('#filtroAtMedico').value='';
  renderAtendimentos();
});

// marcar atendimento (passa status para em_atendimento)
window.marcarAtendimento = function(id){
  let arr = store.get('atendimentos');
  arr = arr.map(x => x.id===id ? {...x, status:'em_atendimento'} : x);
  store.set('atendimentos', arr); renderAtendimentos(); updateDashboard();
};

// -------------- USUÁRIOS CRUD --------------
function renderUsuarios(){
  const tbody = qs('#tabelaUsuarios tbody'); tbody.innerHTML='';
  const arr = store.get('usuarios'); arr.forEach(u=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${u.nome}</td><td>${u.email}</td>
    <td>
      <button onclick="editarUser(${u.id})">Editar</button>
      <button onclick="excluirUser(${u.id})">Excluir</button>
    </td>`;
    tbody.appendChild(tr);
  });
}
window.editarUser = function(id){
  const arr = store.get('usuarios'); const u = arr.find(x=>x.id===id);
  qs('#userId').value=u.id; qs('#userName').value=u.nome; qs('#userEmail').value=u.email; qs('#userPass').value=u.senha;
};
window.excluirUser = function(id){
  if(!confirm('Confirmar exclusão do usuário?')) return;
  let arr = store.get('usuarios'); arr = arr.filter(x=>x.id!==id); store.set('usuarios',arr); renderUsuarios();
};
qs('#userForm').addEventListener('submit', e=>{
  e.preventDefault();
  const id = parseInt(qs('#userId').value || 0), nome=qs('#userName').value.trim(), email=qs('#userEmail').value.trim();
  if(!nome || !email){ alert('Nome e email são obrigatórios'); return; }
  let arr = store.get('usuarios');
  if(id){
    arr = arr.map(x=> x.id===id ? {...x, nome, email, senha:qs('#userPass').value} : x);
  } else {
    const nid = (arr.length? Math.max(...arr.map(x=>x.id)):0)+1;
    arr.push({id:nid, nome, email, senha:qs('#userPass').value});
  }
  store.set('usuarios',arr); renderUsuarios(); qs('#userForm').reset();
});

// -------------- CADASTROS AUXILIARES: MEDICOS, RISCOS, SALAS --------------
/* Médicos */
function renderMedicos(){
  const tbody = qs('#tabelaMedicos tbody'); tbody.innerHTML='';
  const arr = store.get('medicos');
  arr.forEach(m=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${m.nome}</td><td><button onclick="editarMed(${m.id})">Editar</button><button onclick="excluirMed(${m.id})">Excluir</button></td>`;
    tbody.appendChild(tr);
  });
}
window.editarMed = function(id){
  const arr = store.get('medicos'); const m = arr.find(x=>x.id===id);
  qs('#medId').value=m.id; qs('#medNome').value=m.nome;
};
window.excluirMed = function(id){
  if(!confirm('Excluir médico?')) return;
  let arr = store.get('medicos'); arr = arr.filter(x=>x.id!==id); store.set('medicos',arr); renderMedicos(); populateAtendimentoSelects(); populateFiltroSelects();
};
qs('#formMedico').addEventListener('submit', e=>{
  e.preventDefault();
  const id = parseInt(qs('#medId').value || 0), nome = qs('#medNome').value.trim();
  if(!nome) { alert('Nome é obrigatório'); return; }
  let arr = store.get('medicos');
  if(id) arr = arr.map(x=> x.id===id ? {...x,nome} : x);
  else { const nid=(arr.length?Math.max(...arr.map(x=>x.id)):0)+1; arr.push({id:nid,nome}); }
  store.set('medicos',arr); renderMedicos(); qs('#formMedico').reset(); qs('#medId').value=''; populateAtendimentoSelects(); populateFiltroSelects();
});

/* Riscos */
function renderRiscos(){
  const tbody = qs('#tabelaRiscos tbody'); tbody.innerHTML='';
  const arr = store.get('riscos').sort((a,b)=>a.nivel-b.nivel);
  arr.forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${r.nivel}</td><td>${r.descricao}</td><td><button onclick="editarRisco(${r.id})">Editar</button><button onclick="excluirRisco(${r.id})">Excluir</button></td>`;
    tbody.appendChild(tr);
  });
}
window.editarRisco = function(id){
  const arr = store.get('riscos'); const r = arr.find(x=>x.id===id);
  qs('#risId').value=r.id; qs('#risNivel').value=r.nivel; qs('#risDesc').value=r.descricao;
};
window.excluirRisco = function(id){
  if(!confirm('Excluir risco?')) return;
  let arr = store.get('riscos'); arr = arr.filter(x=>x.id!==id); store.set('riscos',arr); renderRiscos(); populateAtendimentoSelects(); populateFiltroSelects();
};
qs('#formRisco').addEventListener('submit', e=>{
  e.preventDefault();
  const id = parseInt(qs('#risId').value || 0), nivel = parseInt(qs('#risNivel').value), desc = qs('#risDesc').value.trim();
  if(!nivel || !desc){ alert('Nível e descrição são obrigatórios'); return; }
  let arr = store.get('riscos');
  if(id) arr = arr.map(x=> x.id===id ? {...x,nivel,descricao:desc} : x);
  else { const nid=(arr.length?Math.max(...arr.map(x=>x.id)):0)+1; arr.push({id:nid,nivel,descricao:desc}); }
  store.set('riscos',arr); renderRiscos(); qs('#formRisco').reset(); qs('#risId').value=''; populateAtendimentoSelects(); populateFiltroSelects();
});

/* Salas */
function renderSalas(){
  const tbody = qs('#tabelaSalas tbody'); tbody.innerHTML='';
  const arr = store.get('salas');
  arr.forEach(s=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${s.ident}</td><td><button onclick="editarSala(${s.id})">Editar</button><button onclick="excluirSala(${s.id})">Excluir</button></td>`;
    tbody.appendChild(tr);
  });
}
window.editarSala = function(id){
  const arr = store.get('salas'); const s = arr.find(x=>x.id===id);
  qs('#salId').value=s.id; qs('#salNome').value=s.ident;
};
window.excluirSala = function(id){
  if(!confirm('Excluir sala?')) return;
  let arr = store.get('salas'); arr = arr.filter(x=>x.id!==id); store.set('salas',arr); renderSalas(); populateAtendimentoSelects();
};
qs('#formSala').addEventListener('submit', e=>{
  e.preventDefault();
  const id = parseInt(qs('#salId').value || 0), ident = qs('#salNome').value.trim();
  if(!ident){ alert('Identificação é obrigatória'); return; }
  let arr = store.get('salas');
  if(id) arr = arr.map(x=> x.id===id ? {...x,ident} : x);
  else { const nid=(arr.length?Math.max(...arr.map(x=>x.id)):0)+1; arr.push({id:nid,ident}); }
  store.set('salas',arr); renderSalas(); qs('#formSala').reset(); qs('#salId').value=''; populateAtendimentoSelects();
});

// popula selects do formulário de atendimento
function populateAtendimentoSelects(){
  // riscos
  const riscos = store.get('riscos').sort((a,b)=>a.nivel-b.nivel);
  const selR = qs('#atRisco'); selR.innerHTML='';
  riscos.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.nivel;
    opt.textContent = `${r.nivel} - ${r.descricao}`;
    selR.appendChild(opt);
  });
  // salas
  const salas = store.get('salas');
  const selS = qs('#atSala'); selS.innerHTML='';
  salas.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.ident;
    opt.textContent = s.ident;
    selS.appendChild(opt);
  });
  // medicos
  const medicos = store.get('medicos');
  const selM = qs('#atMedico'); selM.innerHTML='';
  medicos.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.nome;
    opt.textContent = m.nome;
    selM.appendChild(opt);
  });
}

// popula selects de filtro
function populateFiltroSelects(){
  const selR = qs('#filtroAtRisco'); selR.innerHTML = '<option value="">Todos os riscos</option>';
  store.get('riscos').sort((a,b)=>a.nivel-b.nivel).forEach(r=>{
    const o=document.createElement('option'); o.value = r.nivel; o.textContent = `${r.nivel} - ${r.descricao}`; selR.appendChild(o);
  });
  const selM = qs('#filtroAtMedico'); selM.innerHTML = '<option value="">Todos os médicos</option>';
  store.get('medicos').forEach(m=>{
    const o = document.createElement('option'); o.value = m.nome; o.textContent = m.nome; selM.appendChild(o);
  });
}

// -------------- DASHBOARD --------------
function updateDashboard(){
  const at = store.get('atendimentos');
  qs('#totalAtendimentos').textContent = at.length;
  const emAtendimento = at.find(a=> a.status === 'em_atendimento') || null;
  qs('#pacienteEmAtendimento').textContent = emAtendimento ? emAtendimento.paciente : '—';
  qs('#tempoMedio').textContent = at.length ? Math.floor(at.length * 3) + ' min' : '—';
  // fila
  const fila = at.filter(x=> x.status !== 'concluido').sort((a,b)=> a.risco - b.risco);
  const tbody = qs('#filaTable tbody'); tbody.innerHTML='';
  const riscos = store.get('riscos');
  fila.forEach((p, i)=>{
    const riscoObj = riscos.find(r=> r.nivel == p.risco); const riscoLabel = riscoObj ? `${riscoObj.nivel} - ${riscoObj.descricao}` : p.risco;
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${i+1}</td><td>${p.paciente}</td><td>${riscoLabel}</td><td>${Math.floor((Date.now() - new Date(p.data).getTime())/60000)} min</td>
      <td><button onclick="marcarAtendimento(${p.id})">Atender</button></td>`;
    tbody.appendChild(tr);
  });
}

// small carousel (loop)
function startCarousel(){
  let cIdx = 0;
  const slides = document.querySelectorAll('.carousel-slide');
  if(!slides.length) return;
  function showSlide(){
    slides.forEach(s=>s.style.display='none');
    slides[cIdx].style.display='block';
    cIdx = (cIdx+1) % slides.length;
  }
  showSlide();
  setInterval(showSlide, 4000);
}

// expose some functions for inline onclick usage
window.renderPacientes = renderPacientes;
window.renderAtendimentos = renderAtendimentos;
window.renderUsuarios = renderUsuarios;
window.renderMedicos = renderMedicos;
window.renderRiscos = renderRiscos;
window.renderSalas = renderSalas;
window.populateAtendimentoSelects = populateAtendimentoSelects;
window.populateFiltroSelects = populateFiltroSelects;
window.updateDashboard = updateDashboard;
