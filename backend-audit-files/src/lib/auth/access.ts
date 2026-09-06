export type Action="view"|"create"|"edit"|"delete"|"export";
export function hasPermission(perms:string[], module:string, action:Action="view", role=""){
  if(role.toLowerCase()==="super admin") return true;
  return perms.includes(module) || perms.includes(`${module}.${action}`) || perms.includes(`${module}.*`);
}
export function actionForMethod(method:string):Action { if(method==="GET"||method==="HEAD") return "view"; if(method==="POST") return "create"; if(method==="DELETE") return "delete"; return "edit"; }
