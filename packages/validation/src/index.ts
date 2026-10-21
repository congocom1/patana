import {z} from 'zod';
export const searchQuerySchema=z.object({city:z.string().trim().max(120).optional()});
export const bookingRequestSchema=z.object({unitId:z.string().uuid(),checkIn:z.string().date(),checkOut:z.string().date(),guests:z.number().int().positive().max(100)}).refine(x=>x.checkOut>x.checkIn,{message:'Checkout must follow check-in'});
