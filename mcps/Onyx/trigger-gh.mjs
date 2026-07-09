import axios from "axios"
const base=(process.env.ONYX_BASE_URL||"http://localhost:3210").replace(/\/$/,"")
const http=axios.create({baseURL:`${base}/api`,validateStatus:()=>true,timeout:60000,headers:{Accept:"application/json"}})
const lb=new URLSearchParams({username:process.env.ONYX_EMAIL,password:process.env.ONYX_PASSWORD})
const lg=await http.post("/auth/login",lb.toString(),{headers:{"Content-Type":"application/x-www-form-urlencoded"}})
const cookie=(lg.headers["set-cookie"]||[]).map(c=>c.split(";")[0]).join("; ")
const r=await http.post("/manage/admin/connector/run-once",{connector_id:10,credential_ids:[3],from_beginning:true},{headers:{Cookie:cookie,"Content-Type":"application/json"}})
console.log("github run-once ->",r.status,JSON.stringify(r.data))
