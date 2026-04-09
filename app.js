let agents = [];
let roster = {};
let startDate;
const days = 14;

/* LOGIN */
function login(){
  let u = document.getElementById("user").value;
  let p = document.getElementById("pass").value;

  if(u==="admin" && p==="admin"){
    document.getElementById("loginPage").style.display="none";
    document.getElementById("app").style.display="block";

    loadAgents();
    loadLast();
  } else {
    alert("Invalid login");
  }
}

/* LOAD AGENTS */
function loadAgents(){
  let saved = localStorage.getItem("agents");

  if(saved){
    agents = JSON.parse(saved);
  } else {
    let input = prompt("Enter agent names (comma separated)");
    if(!input) return;

    agents = input.split(",").map(a=>a.trim());
    localStorage.setItem("agents", JSON.stringify(agents));
  }
}

/* INIT */
function initRoster(){
  startDate = new Date(document.getElementById("startDate").value);

  roster = {};
  agents.forEach((a,i)=>{
    if(i<2) roster[a]=Array(days).fill("N");
    else if(i<4) roster[a]=Array(days).fill("M");
    else roster[a]=Array(days).fill("C");
  });

  render();
}

/* SORT */
function sortAgents(){
  agents.sort((a,b)=>{
    let order = {N:1,M:2,C:3};
    return order[roster[a][0]] - order[roster[b][0]];
  });
}

/* RENDER */
function render(){

  sortAgents();

  let html="<thead><tr><th>Agent</th>";
  let dates=[];

  const mNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  for(let i=0;i<days;i++){
    let d=new Date(startDate);
    d.setDate(d.getDate()+i);
    dates.push(d);

    html+=`<th>${dNames[d.getDay()]}<br>${d.getDate()} ${mNames[d.getMonth()]}</th>`;
  }

  html+="<th>Fill</th></tr></thead><tbody id='sortable'>";

  agents.forEach(a=>{
    html+=`<tr><td class="agent">${a}</td>`;

    roster[a].forEach((val,i)=>{
      let d=dates[i];

      if(d.getDay()==0||d.getDay()==6){
        html+=`<td class="wo">WO</td>`;
      } else {
        html+=`<td>
        <select onchange="update('${a}',${i},this.value)">
        <option ${val=="N"?"selected":""}>N</option>
        <option ${val=="M"?"selected":""}>M</option>
        <option ${val=="C"?"selected":""}>C</option>
        </select></td>`;
      }
    });

    html+=`<td>
      <select id="fill_${a}">
        <option>N</option><option>M</option><option>C</option>
      </select>
      <button onclick="fill('${a}')">Apply</button>
    </td></tr>`;
  });

  html+="</tbody>";

  document.getElementById("table").innerHTML=html;

  new Sortable(document.getElementById("sortable"), {
    animation:150,
    onEnd: e=>{
      let item=agents.splice(e.oldIndex,1)[0];
      agents.splice(e.newIndex,0,item);
      localStorage.setItem("agents", JSON.stringify(agents));
    }
  });

  updateSummary();
}

/* UPDATE */
function update(a,i,val){
  roster[a][i]=val;
}

/* FILL */
function fill(agent){
  let shift=document.getElementById("fill_"+agent).value;

  for(let i=0;i<days;i++){
    let d=new Date(startDate);
    d.setDate(d.getDate()+i);
    if(d.getDay()!=0 && d.getDay()!=6){
      roster[agent][i]=shift;
    }
  }
  render();
}

/* NEXT */
function nextCycle(){

  startDate.setDate(startDate.getDate()+14);

  let night = agents.filter(a => roster[a][0] === "N");
  let morning = agents.filter(a => roster[a][0] === "M");
  let core = agents.filter(a => roster[a][0] === "C");

  let rotatedCore = [...core.slice(1), core[0]];

  let stayCore = rotatedCore[0];
  let moveToNight = rotatedCore.slice(1);

  let newNight = moveToNight;
  let newMorning = night;
  let newCore = [stayCore, ...morning];

  agents = [...newNight, ...newMorning, ...newCore];

  let newRoster = {};

  agents.forEach(a=>{
    let shift="C";
    if(newNight.includes(a)) shift="N";
    else if(newMorning.includes(a)) shift="M";

    newRoster[a]=Array(days).fill(shift);
  });

  roster=newRoster;
  render();
}

/* SAVE */
function saveRoster(){
  localStorage.setItem("roster", JSON.stringify({roster,startDate,agents}));
  alert("Saved");
}

/* LOAD */
function loadLast(){
  let data = localStorage.getItem("roster");
  if(!data) return;

  let parsed = JSON.parse(data);
  roster = parsed.roster;
  startDate = new Date(parsed.startDate);
  agents = parsed.agents;

  render();
}

/* SUMMARY */
function updateSummary(){
  let n=0,m=0,c=0;

  agents.forEach(a=>{
    roster[a].forEach(v=>{
      if(v=="N") n++;
      if(v=="M") m++;
      if(v=="C") c++;
    });
  });

  document.getElementById("summary").innerHTML=`
  <div class="card">N ${n}</div>
  <div class="card">M ${m}</div>
  <div class="card">C ${c}</div>`;
}

/* ✅ FINAL EXPORT (WORKING) */
function exportExcel(){

  try {

    if(!startDate){
      alert("Please click Start first");
      return;
    }

    let html = "<table border='1'><tr><th>Agent</th>";

    const mNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    for(let i=0;i<days;i++){
      let d=new Date(startDate);
      d.setDate(d.getDate()+i);

      html += `<th>${dNames[d.getDay()]} ${d.getDate()} ${mNames[d.getMonth()]}</th>`;
    }

    html += "</tr>";

    agents.forEach(a=>{
      html += `<tr><td>${a}</td>`;

      for(let i=0;i<days;i++){
        let d=new Date(startDate);
        d.setDate(d.getDate()+i);

        let val = roster[a][i];

        if(d.getDay()==0||d.getDay()==6){
          val="WO";
        }

        html += `<td>${val}</td>`;
      }

      html += "</tr>";
    });

    html += "</table>";

    let file = new Blob([html], {type: "application/vnd.ms-excel"});

    let url = URL.createObjectURL(file);

    let link = document.createElement("a");
    link.href = url;
    link.download = "Roster.xls";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch(e){
    alert("Export failed: " + e);
    console.log(e);
  }
}
