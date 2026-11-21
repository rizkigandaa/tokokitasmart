/* TokoKita – data disimpan di localStorage (demo tanpa server) */
const $=s=>document.querySelector(s);
let DB=load();function load(){return JSON.parse(localStorage.getItem('tk')||'{"users":[],"shops":[],"products":[],"orders":[],"chats":[]}')}
const save=()=>localStorage.setItem('tk',JSON.stringify(DB));
let me=DB.users.find(u=>u.id===localStorage.getItem('tk_me')),view='',P={},role='penjual';
const rp=n=>'Rp '+Math.round(+n||0).toLocaleString('id-ID'),uid=()=>Math.random().toString(36).slice(2,9);
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2200)};
const shop=()=>DB.shops.find(s=>s.owner===me.id),shopOf=id=>DB.shops.find(s=>s.id===id);
const img=(f,cb,max=500)=>{if(!f)return;const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.8))};i.src=r.result};r.readAsDataURL(f)};
const modal=h=>{const m=$('#modal');m.innerHTML=`<div class="card">${h}</div>`;m.hidden=false};const close=()=>$('#modal').hidden=true;
const fd=ev=>{ev.preventDefault();return Object.fromEntries(new FormData(ev.target))};
const COUR=['SPX Express','SPX Cargo','JNE','J&T','SiCepat','AnterAja','Kurir Toko'],STAT=['Menunggu Pembayaran','Dibayar','Dikemas','Dikirim','Selesai'];
addEventListener('storage',()=>{DB=load();if(me&&['chat','live'].includes(view)&&!$('#modal').hidden===false)render()});

/* ---------- AUTH ---------- */
function auth(tab='masuk',msg=''){
$('#root').innerHTML=`<div class="auth"><section class="hero"><h1>Toko<br>Kita</h1><p>Buka toko, pajang produk, jualan live, dan lacak pesanan dalam satu web.</p></section>
<section class="card"><div class="role">${['penjual','pembeli'].map(r=>`<button class="${role==r?'on':''}" onclick="role='${r}';auth('${tab}')">Saya ${r}</button>`).join('')}</div>
<div class="tabs">${[['masuk','Masuk'],['daftar','Buat akun'],['lupa','Lupa sandi']].map(t=>`<button class="${tab==t[0]?'on':''}" onclick="auth('${t[0]}')">${t[1]}</button>`).join('')}</div>
<form onsubmit="doAuth(event,'${tab}')">
${tab=='daftar'?'<label>Nama lengkap</label><input name="name" required>':''}
<label>Email</label><input name="email" type="email" required>
<label>${tab=='lupa'?'Kata sandi baru':'Kata sandi'}</label><input name="pass" type="password" minlength="6" required>
<p class="err">${msg}</p><button style="width:100%">${{masuk:'Masuk',daftar:'Buat akun',lupa:'Atur ulang sandi'}[tab]}</button></form>
<hr style="border:0;border-top:1px solid var(--line);margin:1rem 0"><button class="ghost" style="width:100%" onclick="gmail()">Masuk dengan Gmail</button></section></div>`}
function setMe(u){me=u;localStorage.setItem('tk_me',u.id);view=u.role=='penjual'?'ringkasan':'belanja';render()}
function mkUser(name,email,pass){const u={id:uid(),name,email:email.toLowerCase(),pass:btoa(pass),role,phone:'',addr:''};DB.users.push(u);
if(role=='penjual')DB.shops.push({id:uid(),owner:u.id,name:name+' Store',desc:'',logo:'',qris:'',banks:[],ship:{},live:{on:false,title:'',feat:'',msgs:[]}});save();return u}
function doAuth(ev,tab){const d=fd(ev),em=d.email.toLowerCase(),u=DB.users.find(x=>x.email==em&&x.role==role);
if(tab=='masuk'){if(!u||u.pass!=btoa(d.pass))return auth(tab,`Email atau sandi salah untuk akun ${role}.`);setMe(u)}
if(tab=='daftar'){if(u)return auth(tab,`Email sudah terdaftar sebagai ${role}. Silakan masuk.`);setMe(mkUser(d.name,em,d.pass))}
if(tab=='lupa'){if(!u)return auth(tab,'Email tidak ditemukan.');u.pass=btoa(d.pass);save();auth('masuk');toast('Sandi diperbarui. Silakan masuk.')}}
function gmail(){const m=prompt('Masukkan alamat Gmail kamu (simulasi login Google):');if(!m||!/@gmail\.com$/i.test(m))return toast('Gunakan alamat @gmail.com');
setMe(DB.users.find(x=>x.email==m.toLowerCase()&&x.role==role)||mkUser(m.split('@')[0],m,uid()))}
const logout=()=>{localStorage.removeItem('tk_me');me=null;auth()};

/* ---------- SHELL ---------- */
const NAV={penjual:[['ringkasan','Analisis'],['toko','Toko & logo'],['produk','Produk'],['bayar','Pembayaran'],['kirim','Pengiriman'],['pesanan','Pesanan'],['live','Live'],['chat','Chat'],['setelan','Pengaturan']],
pembeli:[['belanja','Belanja'],['pesanan','Pesanan saya'],['chat','Chat'],['setelan','Pengaturan']]};
const go=(v,p={})=>{view=v;P=p;render()};
function render(){if(!me)return auth();const V={ringkasan,toko,produk,bayar,kirim,pesanan,live,chat,setelan,belanja}[view];
$('#root').innerHTML=`<div class="app"><nav><b>TokoKita</b>${NAV[me.role].map(n=>`<button class="${view==n[0]?'on':''}" onclick="go('${n[0]}')">${n[1]}</button>`).join('')}<span class="sp"></span><small>${e(me.name)} · ${me.role}</small><button onclick="logout()">Keluar</button></nav><main>${V()}</main></div>`}

/* ---------- PENJUAL ---------- */
function stats(){const s=shop(),os=DB.orders.filter(o=>o.shop==s.id&&o.status!=STAT[0]);let om=0,hp=0,per={};
os.forEach(o=>o.items.forEach(i=>{om+=i.qty*i.price;hp+=i.qty*i.hpp;const p=per[i.name]=per[i.name]||{q:0,om:0,hp:0};p.q+=i.qty;p.om+=i.qty*i.price;p.hp+=i.qty*i.hpp}));
const days=[...Array(7)].map((_,k)=>{const d=new Date(Date.now()-(6-k)*864e5).toDateString();return{l:new Date(d).toLocaleDateString('id-ID',{weekday:'short'}),v:os.filter(o=>new Date(o.t).toDateString()==d).reduce((a,o)=>a+o.items.reduce((b,i)=>b+i.qty*i.price,0),0)}});
return{om,hp,lb:om-hp,n:os.length,per,days}}
function ringkasan(){const t=stats(),mx=Math.max(...t.days.map(d=>d.v),1);
return`<h2>Analisis penjualan</h2><div class="grid">${[['Omzet',rp(t.om)],['HPP terjual',rp(t.hp)],['Keuntungan',rp(t.lb)],['Margin',t.om?(t.lb/t.om*100).toFixed(1)+'%':'0%'],['Pesanan dibayar',t.n]].map(s=>`<div class="card stat"><small>${s[0]}</small><b>${s[1]}</b></div>`).join('')}</div>
<div class="card" style="margin:1rem 0 2rem"><b>Omzet 7 hari terakhir</b><div class="bars" style="margin-top:1rem">${t.days.map(d=>`<div style="height:${d.v/mx*100}%" title="${rp(d.v)}"><span>${d.l}</span></div>`).join('')}</div></div>
<div class="card"><b>Laba per produk (dihitung otomatis)</b><table><tr><th>Produk<th>Terjual<th>Omzet<th>HPP<th>Laba</tr>${Object.entries(t.per).map(([n,p])=>`<tr><td>${e(n)}<td>${p.q}<td>${rp(p.om)}<td>${rp(p.hp)}<td>${rp(p.om-p.hp)}</tr>`).join('')||'<tr><td colspan=5>Belum ada penjualan. Data muncul setelah pembeli membayar.</tr>'}</table></div>`}
function toko(){const s=shop();return`<h2>Toko & logo</h2><div class="card"><form onsubmit="saveShop(event)"><label>Nama toko</label><input name="name" value="${e(s.name)}" required><label>Deskripsi toko</label><textarea name="desc">${e(s.desc)}</textarea><button>Simpan toko</button></form></div>
<div class="card" style="margin-top:1rem"><b>Logo toko</b><div class="row" style="margin:.8rem 0">${s.logo?`<img src="${s.logo}" width="96" height="96" alt="Logo">`:'<small>Belum ada logo</small>'}</div>
<div class="row"><div><label>Inisial</label><input id="lt" maxlength="3" value="${e(s.name.slice(0,2).toUpperCase())}"></div><div><label>Warna</label><input id="lc" type="color" value="#0e7c7b"></div><div><label>Bentuk</label><select id="ls"><option>Lingkaran<option>Persegi</select></div></div>
<div class="row"><button onclick="mkLogo()">Buat logo</button><label class="ghost" style="border:1px solid var(--line);padding:.6rem 1rem;border-radius:8px;cursor:pointer">Unggah logo<input type="file" accept="image/*" hidden onchange="img(this.files[0],d=>{shop().logo=d;save();render()},300)"></label></div></div>`}
function saveShop(ev){Object.assign(shop(),fd(ev));save();toast('Toko disimpan');render()}
function mkLogo(){const c=document.createElement('canvas');c.width=c.height=300;const x=c.getContext('2d');x.fillStyle=$('#lc').value;
if($('#ls').value=='Lingkaran'){x.beginPath();x.arc(150,150,150,0,7);x.fill()}else x.fillRect(0,0,300,300);
x.fillStyle='#fff';x.font='bold 130px Trebuchet MS';x.textAlign='center';x.textBaseline='middle';x.fillText($('#lt').value||'T',150,160);shop().logo=c.toDataURL();save();render()}
function produk(){const ps=DB.products.filter(p=>p.shop==shop().id);return`<div class="row sb"><h2>Produk</h2><button onclick="prodForm()">Tambah produk</button></div><div class="grid">${ps.map(p=>`<div class="card prod">${p.img?`<img src="${p.img}" alt="">`:'<div class="thumb"></div>'}<b>${e(p.name)}</b><div>${rp(p.price)} <small>HPP ${rp(p.hpp)}</small></div><small>Stok ${p.stock}</small><div class="row" style="margin-top:.5rem"><button class="ghost" onclick="prodForm('${p.id}')">Ubah</button><button class="bad" onclick="delProd('${p.id}')">Hapus</button></div></div>`).join('')||'<p>Belum ada produk. Tambahkan produk pertama kamu.</p>'}</div>`}
function prodForm(id){const p=DB.products.find(x=>x.id==id)||{name:'',price:'',stock:1,desc:'',bahan:'',kemasan:'',tenaga:'',hpp:0};
modal(`<h3>${id?'Ubah':'Tambah'} produk</h3><form oninput="calcHpp(this)" onsubmit="saveProd(event,'${id||''}')"><label>Nama produk</label><input name="name" value="${e(p.name)}" required>
<label>Deskripsi</label><textarea name="desc">${e(p.desc)}</textarea><label>Foto produk</label><input type="file" accept="image/*" onchange="img(this.files[0],d=>window._pi=d)">
<div class="row"><div><label>Biaya bahan</label><input name="bahan" type="number" min="0" value="${p.bahan}"></div><div><label>Kemasan</label><input name="kemasan" type="number" min="0" value="${p.kemasan}"></div><div><label>Tenaga kerja</label><input name="tenaga" type="number" min="0" value="${p.tenaga}"></div></div>
<p class="card stat">HPP otomatis: <b id="hp">${rp(p.hpp)}</b><br><small id="sg">Saran harga (margin 30%): ${rp(p.hpp/.7)}</small></p>
<div class="row"><div><label>Harga jual</label><input name="price" type="number" min="0" value="${p.price}" required></div><div><label>Stok</label><input name="stock" type="number" min="0" value="${p.stock}" required></div></div>
<div class="row"><button>Simpan</button><button type="button" class="ghost" onclick="close()">Batal</button></div></form>`);window._pi=p.img}
function calcHpp(f){const h=(+f.bahan.value||0)+(+f.kemasan.value||0)+(+f.tenaga.value||0);$('#hp').textContent=rp(h);$('#sg').textContent='Saran harga (margin 30%): '+rp(h/.7)}
function saveProd(ev,id){const d=fd(ev);d.hpp=(+d.bahan||0)+(+d.kemasan||0)+(+d.tenaga||0);d.price=+d.price;d.stock=+d.stock;d.img=window._pi||'';
let p=DB.products.find(x=>x.id==id);if(p)Object.assign(p,d);else DB.products.push({id:uid(),shop:shop().id,...d});save();close();render()}
const delProd=id=>{if(confirm('Hapus produk ini?')){DB.products=DB.products.filter(p=>p.id!=id);save();render()}};
function bayar(){const s=shop();return`<h2>Metode pembayaran</h2><div class="card"><b>QRIS</b><div style="margin:.8rem 0">${s.qris?`<img src="${s.qris}" width="200" alt="QRIS">`:'<small>Belum ada QRIS</small>'}</div><input type="file" accept="image/*" onchange="img(this.files[0],d=>{shop().qris=d;save();render()},700)"></div>
<div class="card" style="margin-top:1rem"><b>Rekening bank</b><table>${s.banks.map((b,i)=>`<tr><td>${e(b.bank)}<td>${e(b.no)}<td>${e(b.an)}<td><button class="bad" onclick="shop().banks.splice(${i},1);save();render()">Hapus</button></tr>`).join('')}</table>
<form class="row" style="margin-top:.8rem" onsubmit="addBank(event)"><input name="bank" placeholder="Bank (BCA, BRI…)" required style="flex:1"><input name="no" placeholder="No. rekening" required style="flex:1"><input name="an" placeholder="Atas nama" required style="flex:1"><button>Tambah</button></form></div>`}
function addBank(ev){shop().banks.push(fd(ev));save();render()}
function kirim(){const s=shop();return`<h2>Metode pengiriman</h2><div class="card"><p>Pilih kurir yang tersedia untuk pembeli dan isi ongkirnya.</p><form onsubmit="saveShip(event)">${COUR.map(c=>`<div class="row"><label style="flex:1"><input type="checkbox" name="on_${c}" ${c in s.ship?'checked':''} style="width:auto"> ${c}</label><input name="fee_${c}" type="number" min="0" placeholder="Ongkir" value="${s.ship[c]??''}" style="width:140px"></div>`).join('')}<button>Simpan</button></form></div>`}
function saveShip(ev){const d=fd(ev),s=shop();s.ship={};COUR.forEach(c=>{if(d['on_'+c]!==undefined)s.ship[c]=+d['fee_'+c]||0});save();toast('Pengiriman disimpan')}
function pesanan(){const L=me.role=='penjual'?DB.orders.filter(o=>o.shop==shop().id):DB.orders.filter(o=>o.buyer==me.id);
return`<h2>Pesanan</h2>${L.slice().reverse().map(o=>{const i=STAT.indexOf(o.status),tot=o.items.reduce((a,x)=>a+x.qty*x.price,0)+o.fee;return`<div class="card" style="margin-bottom:1rem"><div class="row sb"><b>#${o.id}</b><span class="badge">${o.status}</span></div>
<div>${o.items.map(x=>`${e(x.name)} ×${x.qty}`).join(', ')}</div><small>${o.courier} · ${o.pay} · ${e(o.addr)}</small><div><b>${rp(tot)}</b></div>
<ul class="tl">${STAT.map((s,k)=>`<li class="${k<=i?'done':''}">${s}</li>`).join('')}</ul>
${o.proof?`<a href="${o.proof}" target="_blank">Lihat bukti bayar</a>`:''}
${me.role=='penjual'&&i<4?`<div><button onclick="nextStat('${o.id}')">Ubah ke “${STAT[i+1]}”</button></div>`:''}
${me.role=='pembeli'&&i==0?`<label>Unggah bukti bayar</label><input type="file" accept="image/*" onchange="img(this.files[0],d=>{DB.orders.find(x=>x.id=='${o.id}').proof=d;save();render()})">`:''}</div>`}).join('')||'<p>Belum ada pesanan.</p>'}`}
function nextStat(id){const o=DB.orders.find(x=>x.id==id);o.status=STAT[STAT.indexOf(o.status)+1];save();render()}

/* ---------- LIVE & CHAT ---------- */
function live(){const s=shop(),L=s.live,ps=DB.products.filter(p=>p.shop==s.id);
return`<h2>Promosi live</h2><div class="card"><video id="vid" autoplay muted playsinline></video><div class="row" style="margin:.8rem 0"><input id="lt2" placeholder="Judul live" value="${e(L.title)}" style="flex:1;margin:0"><select id="lf" style="flex:1;margin:0"><option value="">Produk yang disorot${ps.map(p=>`<option value="${p.id}" ${L.feat==p.id?'selected':''}>${e(p.name)}`).join('')}</select></div>
<button class="${L.on?'bad':''}" onclick="toggleLive()">${L.on?'Akhiri live':'Mulai live'}</button> ${L.on?'<span class="badge live">LIVE</span>':''}<p><small>Kamera tampil di perangkat penjual. Pembeli melihat judul, produk sorotan, dan chat langsung.</small></p></div>
<div class="card" style="margin-top:1rem"><b>Chat live</b>${box(L.msgs,'me','sendLive')}</div>`}
async function toggleLive(){const L=shop().live;L.on=!L.on;L.title=$('#lt2').value;L.feat=$('#lf').value;if(L.on)L.msgs=[];save();render();
if(L.on)try{$('#vid').srcObject=await navigator.mediaDevices.getUserMedia({video:true,audio:true})}catch{toast('Kamera tidak diizinkan')}}
const box=(m,who,fn)=>`<div class="chat">${m.map(x=>`<div class="msg ${x.f==who?'me':''}"><small>${e(x.n||'')}</small><br>${e(x.t)}</div>`).join('')||'<small>Belum ada pesan</small>'}</div><form class="row" onsubmit="${fn}(event)"><input name="t" placeholder="Tulis pesan" required style="flex:1;margin:0"><button>Kirim</button></form>`;
function sendLive(ev){const t=fd(ev).t,s=me.role=='penjual'?shop():shopOf(P.live);s.live.msgs.push({f:me.role=='penjual'?'me':me.id,n:me.name,t});save();me.role=='penjual'?render():liveRoom(s.id)}
function liveRoom(sid){const s=shopOf(sid),L=s.live;P.live=sid;if(!L.on)return toast('Live sudah berakhir');const p=DB.products.find(x=>x.id==L.feat);
modal(`<div class="row sb"><h3>${e(L.title||s.name)}</h3><span class="badge live">LIVE</span></div>${p?`<div class="card stat"><b>${e(p.name)}</b> ${rp(p.price)} <button onclick="beli('${p.id}')">Beli</button></div>`:''}${box(L.msgs,me.id,'sendLive')}<button class="ghost" onclick="close()">Tutup</button>`)}
function threads(){return me.role=='penjual'?DB.chats.filter(c=>c.shop==shop().id):DB.chats.filter(c=>c.buyer==me.id)}
function chat(){const L=threads(),c=L.find(x=>x.id==P.c)||L[0];
return`<h2>Chat</h2><div class="row" style="align-items:start"><div class="card" style="flex:1;min-width:160px">${L.map(x=>`<button class="ghost" style="width:100%;margin-bottom:.3rem" onclick="go('chat',{c:'${x.id}'})">${e(me.role=='penjual'?DB.users.find(u=>u.id==x.buyer)?.name:shopOf(x.shop).name)}</button>`).join('')||'<small>Belum ada percakapan</small>'}</div>
<div class="card" style="flex:3;min-width:260px">${c?box(c.msgs,me.role,'sendChat'):'Pilih percakapan.'}</div></div>`}
function sendChat(ev){const c=threads().find(x=>x.id==P.c)||threads()[0];c.msgs.push({f:me.role,n:me.name,t:fd(ev).t});save();render()}
function openChat(sid){let c=DB.chats.find(x=>x.shop==sid&&x.buyer==me.id);if(!c){c={id:uid(),shop:sid,buyer:me.id,msgs:[]};DB.chats.push(c);save()}close();go('chat',{c:c.id})}

/* ---------- PEMBELI ---------- */
function belanja(){const lv=DB.shops.filter(s=>s.live.on);
return`<h2>Belanja</h2>${lv.map(s=>`<div class="card stat row sb" style="margin-bottom:1rem"><span><span class="badge live">LIVE</span> ${e(s.name)}: ${e(s.live.title)}</span><button onclick="liveRoom('${s.id}')">Tonton</button></div>`).join('')}
<div class="grid">${DB.products.map(p=>{const s=shopOf(p.shop);return`<div class="card prod">${p.img?`<img src="${p.img}" alt="">`:'<div class="thumb"></div>'}<b>${e(p.name)}</b><div>${rp(p.price)}</div><small>${e(s.name)} · stok ${p.stock}</small><p><small>${e(p.desc).slice(0,80)}</small></p><div class="row"><button onclick="beli('${p.id}')">Beli</button><button class="ghost" onclick="openChat('${s.id}')">Chat</button><button class="alt" onclick="wa('${p.id}')">WA</button></div></div>`}).join('')||'<p>Belum ada produk dari penjual.</p>'}</div>`}
function wa(id){const p=DB.products.find(x=>x.id==id);open('https://wa.me/?text='+encodeURIComponent(`${p.name} – ${rp(p.price)}\n${location.href.split('#')[0]}#p=${id}`))}
function beli(id){const p=DB.products.find(x=>x.id==id),s=shopOf(p.shop),k=Object.keys(s.ship);if(!k.length)return toast('Penjual belum mengatur pengiriman');
const pays=[...(s.qris?['QRIS']:[]),...s.banks.map(b=>`${b.bank} ${b.no} a.n. ${b.an}`)];if(!pays.length)return toast('Penjual belum mengatur pembayaran');
modal(`<h3>${e(p.name)}</h3><p>${rp(p.price)} · stok ${p.stock}</p><form oninput="tot(this,${p.price})" onsubmit="order(event,'${id}')"><label>Jumlah</label><input name="qty" type="number" min="1" max="${p.stock}" value="1">
<label>Alamat pengiriman</label><textarea name="addr" required>${e(me.addr)}</textarea><label>Pengantaran</label><select name="courier">${k.map(c=>`<option value="${c}">${c} (${rp(s.ship[c])})`).join('')}</select>
<label>Pembayaran</label><select name="pay">${pays.map(x=>`<option>${e(x)}`).join('')}</select><p>Total: <b id="tt">${rp(p.price+s.ship[k[0]])}</b></p><div class="row"><button>Pesan</button><button type="button" class="ghost" onclick="close()">Batal</button></div></form>`);window._s=s}
function tot(f,pr){$('#tt').textContent=rp(pr*(+f.qty.value||1)+window._s.ship[f.courier.value])}
function order(ev,id){const d=fd(ev),p=DB.products.find(x=>x.id==id),s=shopOf(p.shop);if(+d.qty>p.stock)return toast('Stok tidak cukup');p.stock-=+d.qty;me.addr=d.addr;
DB.orders.push({id:uid().toUpperCase(),buyer:me.id,shop:s.id,t:Date.now(),items:[{name:p.name,qty:+d.qty,price:p.price,hpp:p.hpp}],courier:d.courier,fee:s.ship[d.courier],pay:d.pay,addr:d.addr,status:STAT[0]});save();close();toast('Pesanan dibuat. Unggah bukti bayar.');go('pesanan')}

/* ---------- PENGATURAN ---------- */
function setelan(){return`<h2>Pengaturan</h2><div class="card"><b>Info profil</b><form onsubmit="saveProf(event)"><label>Nama</label><input name="name" value="${e(me.name)}" required><label>No. WhatsApp</label><input name="phone" value="${e(me.phone)}">
${me.role=='pembeli'?`<label>Alamat pengiriman utama</label><textarea name="addr">${e(me.addr)}</textarea>`:''}<button>Simpan profil</button></form></div>
<div class="card" style="margin:1rem 0"><b>Keamanan · ubah kata sandi</b><form onsubmit="chPass(event)"><label>Sandi lama</label><input name="old" type="password" required><label>Sandi baru</label><input name="nw" type="password" minlength="6" required><button>Ubah sandi</button></form></div><button class="bad" onclick="logout()">Keluar</button>`}
function saveProf(ev){Object.assign(me,fd(ev));save();toast('Profil disimpan');render()}
function chPass(ev){const d=fd(ev);if(btoa(d.old)!=me.pass)return toast('Sandi lama salah');me.pass=btoa(d.nw);save();ev.target.reset();toast('Sandi diubah')}
render();
