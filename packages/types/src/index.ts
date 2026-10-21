export type PropertyType='hotel'|'apartment';
export type BookingStatus='pending'|'confirmed'|'cancelled';
export interface Unit{id:string;propertyId:string;name:string;capacity:number;pricePerNight:number;status:string}
export interface Stay{id:string;name:string;city:string;address:string;type:PropertyType;description?:string;imageUrl?:string;units:Unit[]}
