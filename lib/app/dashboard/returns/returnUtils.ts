import type { ReturnStatus } from "./returnTypes";
export const money=(n:number)=>`Rs. ${Number(n||0).toLocaleString("en-PK")}`;
export function statusClass(s:ReturnStatus){return s==="Completed"?"bg-emerald-50 text-emerald-700":s==="Approved"?"bg-blue-50 text-blue-700":s==="Pending"?"bg-amber-50 text-amber-700":"bg-red-50 text-red-700"}
