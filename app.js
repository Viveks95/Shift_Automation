let agents = ["Vivek","Nandini","Aishya","Akshay","John","Melvin","Anabel"];
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
    loadLast();
  } else {
    alert("Invalid login");
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
        <select class="${val.toLowerCase()}" onchange="update('${a}',${i},this.value)">
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
    }
  });

  updateSummary();
  drawChart();
}

/* UPDATE */
function update(a,i,val){
  roster[a][i]=val;
  render();
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

/* ✅ FIXED NEXT 2 WEEKS */
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
  <div class="card">Night ${n}</div>
  <div class="card">Morning ${m}</div>
  <div class="card">Core ${c}</div>`;
}

/* CHART */
function drawChart(){

  let n=0,m=0,c=0;

  agents.forEach(a=>{
    roster[a].forEach(v=>{
      if(v=="N") n++;
      if(v=="M") m++;
      if(v=="C") c++;
    });
  });

  new Chart(document.getElementById("chart"), {
    type:"bar",
    data:{
      labels:["Night","Morning","Core"],
      datasets:[{data:[n,m,c]}]
    }
  });
}

/* ✅ FIXED EXCEL EXPORT WITH COLORS */
function exportExcel(){

  let table = "<table border='1'>";

  const mNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  table += "<tr><th>Agent</th>";

  for(let i=0;i<days;i++){
    let d=new Date(startDate);
    d.setDate(d.getDate()+i);

    table += `<th>${dNames[d.getDay()]} ${d.getDate()} ${mNames[d.getMonth()]}</th>`;
  }

  table += "</tr>";

  agents.forEach(a=>{
    table += `<tr><td><b>${a}</b></td>`;

    roster[a].forEach((val,i)=>{

      let d=new Date(startDate);
      d.setDate(d.getDate()+i);

      let color="";

      if(d.getDay()==0 || d.getDay()==6){
        val="WO";
        color="background:#ff8c00;";
      }
      else if(val==="N") color="background:#f4b183;";
      else if(val==="M") color="background:#c6e0b4;";
      else if(val==="C") color="background:#bdd7ee;";

      table += `<td style="${color}">${val}</td>`;
    });

    table += "</tr>";
  });

  table += "</table>";

  let blob = new Blob([table], {type:"application/vnd.ms-excel"});
  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");
  a.href = url;
  a.download = "roster.xls";
  a.click();
}
