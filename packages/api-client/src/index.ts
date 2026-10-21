import type {Stay} from '@patana/types';
export type Session={accessToken:string;tokenType:string};
export type Booking={id:string;checkIn:string;checkOut:string;guests:number;totalPrice:string;status:string;unit?:{name:string;property:{name:string;city:string}}};
export class PatanaApi{
 constructor(private readonly baseUrl:string=(import.meta.env?.VITE_API_URL||'http://localhost:4000/api')){}
 private async request<T>(path:string,init:RequestInit={},token?:string):Promise<T>{
 const response=await fetch(this.baseUrl+path,{...init,headers:{...(init.body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...init.headers}});
 if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(typeof error.message==='string'?error.message:'Request failed ('+response.status+')')}
 return response.json() as Promise<T>}
 stays(city?:string){return this.request<Stay[]>('/catalog/properties'+(city?'?city='+encodeURIComponent(city):''))}
 login(email:string,password:string){return this.request<Session>('/auth/login',{method:'POST',body:JSON.stringify({email,password})})}
 register(fullName:string,email:string,password:string){return this.request<Session>('/auth/register',{method:'POST',body:JSON.stringify({fullName,email,password})})}
 me(token:string){return this.request<{id:string;fullName:string;email:string;role:string}>('/auth/me',{},token)}
 book(token:string,form:{unitId:string;checkIn:string;checkOut:string;guests:number}){return this.request<Booking>('/bookings',{method:'POST',body:JSON.stringify(form)},token)}
 myBookings(token:string){return this.request<Booking[]>('/bookings/mine',{},token)}
 myProperties(token:string){return this.request<Stay[]>('/catalog/mine',{},token)}
 registerOwner(token:string,businessName:string){return this.request('/owner/register',{method:'POST',body:JSON.stringify({businessName})},token)}
 owner(token:string){return this.request<{id:string;businessName:string;verificationStatus:string}|null>('/owner/me',{},token)}
 createProperty(token:string,data:Record<string,unknown>){return this.request('/catalog/properties',{method:'POST',body:JSON.stringify(data)},token)}
 createUnit(token:string,data:Record<string,unknown>){return this.request('/catalog/units',{method:'POST',body:JSON.stringify(data)},token)}
 ownerBookings(token:string){return this.request<Booking[]>('/owner/bookings',{},token)}
}
