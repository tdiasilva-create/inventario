import {isOutOfScope,collectorHiddenTypes,legacyUnitTypes} from '../web/unit-schema.js';
// SQL is built only from application-owned type labels, never request input.
const sqlTypes=types=>types.map(type=>"'"+type.replaceAll("'","''")+"'").join(',');
export const inventoryScopeSql=(alias='u')=>`COALESCE(${alias}.unit_type,'') NOT IN (${sqlTypes(legacyUnitTypes)})`;
export const collectionScopeSql=(alias='u')=>`${inventoryScopeSql(alias)} AND COALESCE(${alias}.unit_type,'') NOT IN (${sqlTypes(collectorHiddenTypes)})`;
export class UnitScopeError extends Error {
 constructor(type){super(isOutOfScope(type)?'Escolas comunitárias/conveniadas estão fora do escopo deste inventário.':'Obras em andamento não estão disponíveis para coleta.');this.code='UNIT_OUT_OF_SCOPE';}
}
export function assertUnitScope(unit,{collection=false}={}){if(unit&&(isOutOfScope(unit.unit_type)||(collection&&collectorHiddenTypes.includes(unit.unit_type))))throw new UnitScopeError(unit.unit_type);return unit;}
