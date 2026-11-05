import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const store = () => getStore("cineverse-data");
const defaults = {
  movies: [
    {id:"neon-horizon",title:"Neon Horizon",year:2025,genre:["Sci-Fi","Action"],rating:"PG-13",duration:"2h 8m",language:"English",description:"In a city that never sleeps, a rogue courier uncovers a conspiracy written into the skyline itself.",poster:"",backdrop:"",featured:true,status:"published",videoUrl:"",trailerUrl:""},
    {id:"dust-runners",title:"Dust Runners",year:2024,genre:["Action","Adventure"],rating:"PG-13",duration:"1h 54m",language:"English",description:"A desert convoy races against time to deliver the last working power cell.",poster:"",backdrop:"",featured:false,status:"published",videoUrl:"",trailerUrl:""},
    {id:"skyward",title:"Skyward",year:2025,genre:["Adventure","Fantasy"],rating:"PG",duration:"1h 48m",language:"English",description:"A young cartographer discovers a hidden world above the clouds.",poster:"",backdrop:"",featured:false,status:"published",videoUrl:"",trailerUrl:""},
    {id:"saltwater-hearts",title:"Saltwater Hearts",year:2023,genre:["Romance","Drama"],rating:"PG",duration:"1h 42m",language:"English",description:"Two strangers rebuild a seaside cinema and find an unexpected connection.",poster:"",backdrop:"",featured:false,status:"published",videoUrl:"",trailerUrl:""},
    {id:"quiet-room",title:"Quiet Room",year:2022,genre:["Thriller"],rating:"PG-13",duration:"1h 39m",language:"English",description:"A sound engineer hears a message hidden inside a recording that should be silent.",poster:"",backdrop:"",featured:false,status:"published",videoUrl:"",trailerUrl:""},
    {id:"iron-tide",title:"Iron Tide",year:2023,genre:["Action"],rating:"PG-13",duration:"2h 1m",language:"English",description:"A coastal rescue team faces a storm and a mystery beneath the waves.",poster:"",backdrop:"",featured:false,status:"published",videoUrl:"",trailerUrl:""}
  ],
  categories:["Action","Adventure","Animation","Comedy","Documentary","Drama","Fantasy","Hollywood","Bollywood","Korean","Anime","Romance","Sci-Fi","Thriller"],
  settings:{siteName:"CineVerse",tagline:"Discover stories worth staying up for.",logoText:"CINEVERSE",accent:"#e50914",announcement:"",footerText:"Discover and stream authorized movies, series and documentaries."},
  ads:[]
};

async function read(key) {
  const s=store(); const value=await s.get(key,{type:"json"});
  if(value!==null) return value;
  const initial=defaults[key]; await s.setJSON(key,initial); return initial;
}
async function write(key,value){ await store().setJSON(key,value); }
function json(statusCode,body,extra={}){return {statusCode,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...extra},body:JSON.stringify(body)};}
function b64(v){return Buffer.from(v).toString("base64url");}
function sign(payload,secret){const data=b64(JSON.stringify(payload));const sig=crypto.createHmac("sha256",secret).update(data).digest("base64url");return `${data}.${sig}`;}
function validToken(event){
  const token=(event.headers.authorization||"").replace(/^Bearer\s+/i,"");
  const secret=process.env.JWT_SECRET||"";
  if(!token||!secret)return false;
  const [data,sig]=token.split("."); if(!data||!sig)return false;
  const expected=crypto.createHmac("sha256",secret).update(data).digest();
  let got; try{got=Buffer.from(sig,"base64url");}catch{return false;}
  if(got.length!==expected.length||!crypto.timingSafeEqual(got,expected))return false;
  try{const p=JSON.parse(Buffer.from(data,"base64url").toString());return p.role==="admin"&&p.exp>Date.now();}catch{return false;}
}
export default async (event) => {
  const requestPath = event.path || new URL(event.rawUrl || event.url || "https://localhost/").pathname;
const path = requestPath.replace("/.netlify/functions/api","").replace(/^\/api/,"") || "/";
  const method=event.httpMethod;
  if(method==="OPTIONS") return {statusCode:204,headers:{"access-control-allow-origin":"*","access-control-allow-headers":"content-type,authorization","access-control-allow-methods":"GET,POST,PUT,DELETE,OPTIONS"}};
  try{
    if(path==="/login"&&method==="POST"){
      const {email,password}=JSON.parse(event.body||"{}");
      if(!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD||!process.env.JWT_SECRET) return json(503,{error:"Admin environment variables are not configured."});
      const ok=String(email||"").toLowerCase()===process.env.ADMIN_EMAIL.toLowerCase() && String(password||"")===process.env.ADMIN_PASSWORD;
      if(!ok)return json(401,{error:"Invalid admin credentials."});
      return json(200,{token:sign({role:"admin",exp:Date.now()+8*60*60*1000},process.env.JWT_SECRET)});
    }
    if(path==="/movies"&&method==="GET"){
      const movies=await read("movies"); return json(200,movies.filter(m=>m.status==="published"));
    }
    if(path==="/categories"&&method==="GET")return json(200,await read("categories"));
    if(path==="/settings"&&method==="GET")return json(200,await read("settings"));
    if(path==="/ads"&&method==="GET")return json(200,(await read("ads")).filter(a=>a.active));
    if(!validToken(event))return json(401,{error:"Admin authentication required."});
    if(path==="/admin/data"&&method==="GET"){
      const [movies,categories,settings,ads]=await Promise.all(["movies","categories","settings","ads"].map(read));
      return json(200,{movies,categories,settings,ads});
    }
    if(path==="/admin/movies"&&method==="PUT"){const v=JSON.parse(event.body||"{}");if(!Array.isArray(v))return json(400,{error:"Expected an array"});await write("movies",v);return json(200,{ok:true});}
    if(path==="/admin/categories"&&method==="PUT"){const v=JSON.parse(event.body||"{}");if(!Array.isArray(v))return json(400,{error:"Expected an array"});await write("categories",v);return json(200,{ok:true});}
    if(path==="/admin/settings"&&method==="PUT"){const v=JSON.parse(event.body||"{}");await write("settings",v);return json(200,{ok:true});}
    if(path==="/admin/ads"&&method==="PUT"){const v=JSON.parse(event.body||"{}");if(!Array.isArray(v))return json(400,{error:"Expected an array"});await write("ads",v);return json(200,{ok:true});}
    return json(404,{error:"Not found"});
  }catch(e){return json(500,{error:"Server error",detail:process.env.NODE_ENV==="development"?String(e):undefined});}
};
