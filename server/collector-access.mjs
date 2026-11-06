// D-046: participation records authorship, never ownership of a unit.
// The caller still checks active=1; every authenticated operator may resume it.
export function operatorUnitAccess(alias='u'){
 if(!['u'].includes(alias))throw Error('Invalid SQL alias');
 return '1=1';
}
export const operatorUnitParams=()=>[];
