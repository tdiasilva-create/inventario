// Internal SQL expressions only; never interpolate a request parameter here.
export const linkFilterValues=['','linked','manual','pending','ended','unknown','unlinked'];
export function equipmentLinkStateSql({json,linked,history}){
 return `CASE WHEN COALESCE(json_extract(${json},'$.category'),'') NOT IN ('','computer','desktop','notebook') THEN 'not_applicable'
 WHEN ${linked} THEN 'linked' WHEN ${history} THEN 'ended'
 WHEN json_extract(${json},'$.registration')='Manual' THEN 'manual'
 WHEN json_extract(${json},'$.registration')='Agente' THEN 'pending' ELSE 'unknown' END`;
}
