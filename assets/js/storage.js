const prefix='ssh:';
function saveData(key,value){localStorage.setItem(prefix+key,JSON.stringify(value));}
function loadData(key,fallback){try{const raw=localStorage.getItem(prefix+key);return raw===null?structuredClone(fallback):JSON.parse(raw);}catch{return structuredClone(fallback);}}
const defaults={deployments:startDeployments,incidents:startIncidents,requests:startRequests,releases:startReleases};
for(const [key,val] of Object.entries(defaults)){if(localStorage.getItem(prefix+key)===null)saveData(key,val);}
let deployments=loadData('deployments',startDeployments),incidents=loadData('incidents',startIncidents),requests=loadData('requests',startRequests),releases=loadData('releases',startReleases);
for(const release of startReleases){if(!releases.some(x=>x.version===release.version))releases.push(release);}saveData('releases',releases);
const app=document.querySelector('#app');
const names={planning:'Планирование',setup:'Настройка',training:'Обучение',production:'В эксплуатации',critical:'Критический',high:'Высокий',medium:'Средний',low:'Низкий',new:'Новый',in_progress:'В работе',resolved:'Решён',corrective:'Корректирующее',adaptive:'Адаптивное',perfective:'Совершенствующее',preventive:'Профилактическое',planned:'Запланирована',done:'Выполнена',on_track:'В срок',breached:'Нарушен',met:'Решён вовремя'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options=(values,selected)=>values.map(v=>`<option value="${esc(v)}" ${v===selected?'selected':''}>${esc(names[v]||v)}</option>`).join('');
const badge=(value,style='')=>`<span class="pill ${style}">${esc(names[value]||value)}</span>`;
const nextId=(list,pre,width=3)=>pre+'-'+String(Math.max(0,...list.map(x=>Number(x.id.split('-').pop())||0))+1).padStart(width,'0');
const table=(headers,rows)=>`<div class="tablewrap"><table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join(''):`<tr><td class="empty" colspan="${headers.length}">Нет записей</td></tr>`}</tbody></table></div>`;
function message(form,text,error=false){const el=form.querySelector('.message');el.textContent=text;el.classList.toggle('error',error);}
const version=()=>releases.at(-1).version;
document.querySelector('#version').textContent=version();
const themeButton=document.querySelector('#themeButton');document.body.classList.toggle('light',loadData('theme','dark')==='light');themeButton.onclick=()=>{document.body.classList.toggle('light');saveData('theme',document.body.classList.contains('light')?'light':'dark');window.dispatchEvent(new Event('themechange'));};
const settings={slaHours:{critical:4,high:8,medium:24,low:72}};
function getSlaState(incident,settings,now=Date.now()){const deadline=new Date(incident.createdAt).getTime()+settings.slaHours[incident.priority]*hour;return incident.status==='resolved'?(new Date(incident.resolvedAt).getTime()<=deadline?'met':'breached'):(now>deadline?'breached':'on_track');}
function getSlaPercent(list,settings){const resolved=list.filter(x=>x.status==='resolved');return resolved.length?Math.round(100*resolved.filter(x=>getSlaState(x,settings)==='met').length/resolved.length):100;}
function getNextVersion(current,level){let [a,b,c]=current.replace(/^v/,'').split('.').map(Number);return level==='major'?`v${a+1}.0.0`:level==='minor'?`v${a}.${b+1}.0`:`v${a}.${b}.${c+1}`;}
