import type {Stay} from '@patana/types';
export class PatanaApi {constructor(private readonly baseUrl:string='http://localhost:4000/api'){}async stays(city?:string):Promise<Stay[]>{const url=new URL(this.baseUrl+'/catalog/properties');if(city)url.searchParams.set('city',city);const response=await fetch(url);if(!response.ok)throw new Error('Could not load stays');return response.json()}}
