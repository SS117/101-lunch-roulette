const DEFAULT_SHOPS = [
  {id:"family", name:"全家", price:132, category:"超商", weight:15},
  {id:"xiaonanmen", name:"小南門", price:135, category:"台式", weight:15},
  {id:"mia", name:"Mia 超市", price:178, category:"超市", weight:15},
  {id:"five", name:"五星麵舖", price:196, category:"台式", weight:15},
  {id:"naan", name:"NaanStop", price:200, category:"印度", weight:10},
  {id:"seorak", name:"雪嶽山", price:218, category:"韓式", weight:10},
  {id:"palsaik", name:"八色烤肉", price:255, category:"韓式", weight:10},
  {id:"meili", name:"美利港式", price:288, category:"港式", weight:10},
];

const $ = id => document.getElementById(id);
const state = {
  shops: JSON.parse(localStorage.getItem("shops") || "null") || DEFAULT_SHOPS,
  history: JSON.parse(localStorage.getItem("history") || "[]"),
  current: null,
  redrawUsed: false,
};

function save(){
  localStorage.setItem("shops", JSON.stringify(state.shops));
  localStorage.setItem("history", JSON.stringify(state.history));
}
function mondayOf(date){
  const d = new Date(date); d.setHours(0,0,0,0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d;
}
function dateKey(d){ return new Date(d).toISOString().slice(0,10); }
function currentWeekHistory(){
  const start = mondayOf(new Date());
  const end = new Date(start); end.setDate(end.getDate()+3); end.setHours(23,59,59,999);
  return state.history.filter(x=>{
    const d = new Date(x.date+"T12:00:00");
    return d>=start && d<=end;
  });
}
function usedExpensive(){
  return currentWeekHistory().some(x => Number(x.actualPrice ?? x.price) > 200);
}
function weekdayTW(date = new Date()){
  return ["日","一","二","三","四","五","六"][date.getDay()];
}
function weightedPick(items){
  const sum = items.reduce((s,x)=>s+x.effectiveWeight,0);
  let r = Math.random()*sum;
  for(const x of items){ r -= x.effectiveWeight; if(r<=0) return x; }
  return items.at(-1);
}
function candidates(){
  const mode = $("modeSelect").value;
  const week = currentWeekHistory();
  const eatenIds = new Set(week.map(x=>x.shopId));
  const expensiveLocked = usedExpensive();
  let list = state.shops.filter(s=>s.enabled !== false);

  if($("excludeKorean").checked) list = list.filter(s=>s.category!=="韓式");
  if($("excludeConvenience").checked) list = list.filter(s=>s.category!=="超商");

  if(mode==="save") list = list.filter(s=>s.price<=180);
  if(mode!=="random" && expensiveLocked) list = list.filter(s=>s.price<=200);

  return list.map(s=>({
    ...s,
    effectiveWeight: Math.max(.2, s.weight * (eatenIds.has(s.id) ? .2 : 1))
  }));
}
function draw(){
  const list = candidates();
  if(!list.length){ toast("目前條件下沒有可抽店家"); return; }
  state.current = weightedPick(list);
  renderResult();
  $("redrawBtn").disabled = state.redrawUsed;
  $("confirmPanel").classList.remove("hidden");
  $("actualPrice").value = state.current.price;
}
function renderResult(){
  const s = state.current;
  const eaten = currentWeekHistory().some(x=>x.shopId===s.id);
  const expensive = s.price>200;
  $("resultBox").innerHTML = `
    <div>
      <div class="result-meta">${s.category} · 預估 NT$${s.price}</div>
      <div class="result-name">${s.name}</div>
      <div class="result-note">
        ${eaten ? "本週已吃過：抽中權重已降低" : "本週尚未吃過"}
        ${expensive ? "<br>⚠️ 選擇後將使用本週唯一 >NT$200 額度" : ""}
      </div>
    </div>`;
}
function accept(){
  if(!state.current) return;
  const actual = Number($("actualPrice").value || state.current.price);
  const today = dateKey(new Date());
  const existing = state.history.findIndex(x=>x.date===today);
  const rec = {
    date:today, shopId:state.current.id, name:state.current.name,
    price:state.current.price, actualPrice:actual, category:state.current.category
  };
  if(existing>=0) state.history[existing]=rec; else state.history.push(rec);
  save();
  state.current=null; state.redrawUsed=false;
  $("confirmPanel").classList.add("hidden");
  $("redrawBtn").disabled=true;
  $("resultBox").innerHTML=`<div><div class="result-meta">今天就決定是</div><div class="result-name">${rec.name}</div><div class="result-note">實際 NT$${actual} · 已記錄</div></div>`;
  renderAll(); toast("已記錄今天午餐");
}
function renderAll(){
  const now = new Date();
  $("todayText").textContent = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,"0")}/${String(now.getDate()).padStart(2,"0")} 星期${weekdayTW(now)} · 每週一～四一輪`;
  const wh = currentWeekHistory();
  $("weekCount").textContent = `${wh.length} / 4`;
  $("expensiveUsed").textContent = usedExpensive() ? "已使用" : "尚未使用";
  if(wh.length){
    const avg = Math.round(wh.reduce((s,x)=>s+Number(x.actualPrice ?? x.price),0)/wh.length);
    $("weekAvg").textContent = `NT$${avg}`;
  } else $("weekAvg").textContent = "—";

  $("weekHistory").innerHTML = wh.length ? wh.sort((a,b)=>a.date.localeCompare(b.date)).map(x=>`
    <div class="history-row">
      <div class="row-main"><strong>${x.name}</strong><span>${x.date} · ${x.category}</span></div>
      <div class="price">NT$${x.actualPrice ?? x.price}</div>
    </div>`).join("") : `<p class="hint">本週還沒有紀錄。</p>`;

  $("shopList").innerHTML = state.shops.map(s=>`
    <div class="shop-row">
      <div class="row-main">
        <strong>${s.name}<span class="badge">${s.category}</span></strong>
        <span>預估 NT$${s.price} · 權重 ${s.weight}</span>
      </div>
      <div class="shop-controls">
        <button class="tiny-btn" data-toggle="${s.id}">${s.enabled===false?"啟用":"停用"}</button>
        <button class="tiny-btn" data-delete="${s.id}">刪除</button>
      </div>
    </div>`).join("");

  document.querySelectorAll("[data-toggle]").forEach(btn=>btn.onclick=()=>{
    const s=state.shops.find(x=>x.id===btn.dataset.toggle); s.enabled = s.enabled===false ? true : false; save(); renderAll();
  });
  document.querySelectorAll("[data-delete]").forEach(btn=>btn.onclick=()=>{
    state.shops=state.shops.filter(x=>x.id!==btn.dataset.delete); save(); renderAll();
  });
}
function toast(msg){
  const t=$("toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1800);
}
function exportCSV(){
  const rows=[["日期","店家","分類","預估價格","實際價格"]];
  state.history.sort((a,b)=>a.date.localeCompare(b.date)).forEach(x=>rows.push([x.date,x.name,x.category,x.price,x.actualPrice ?? x.price]));
  const csv="\uFEFF"+rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="101_lunch_history.csv"; a.click(); URL.revokeObjectURL(a.href);
}
$("drawBtn").onclick=()=>{ state.redrawUsed=false; draw(); $("redrawBtn").disabled=false; };
$("redrawBtn").onclick=()=>{ if(state.redrawUsed) return; state.redrawUsed=true; draw(); $("redrawBtn").disabled=true; };
$("acceptBtn").onclick=accept;
$("exportBtn").onclick=exportCSV;
$("resetWeekBtn").onclick=()=>{
  if(!confirm("確定刪除本週一～四紀錄？")) return;
  const wh=new Set(currentWeekHistory().map(x=>x.date+"|"+x.shopId));
  state.history=state.history.filter(x=>!wh.has(x.date+"|"+x.shopId)); save(); renderAll(); toast("本週已重置");
};
$("clearAllBtn").onclick=()=>{
  if(!confirm("確定清除全部午餐紀錄？")) return;
  state.history=[]; save(); renderAll(); toast("全部紀錄已清除");
};
$("addShopBtn").onclick=()=>{
  const name=$("newName").value.trim(), price=Number($("newPrice").value), category=$("newCategory").value;
  if(!name || !price){ toast("請填店名與價格"); return; }
  state.shops.push({id:"custom_"+Date.now(),name,price,category,weight:10,enabled:true});
  $("newName").value=""; $("newPrice").value=""; save(); renderAll(); toast("店家已加入");
};
$("themeBtn").onclick=()=>{
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("dark",document.documentElement.classList.contains("dark")?"1":"0");
};
if(localStorage.getItem("dark")==="1") document.documentElement.classList.add("dark");

if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));
renderAll();
