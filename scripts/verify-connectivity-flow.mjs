import assert from 'node:assert/strict';
export async function verifyConnectivityFlow(page,dir){
 await page.locator('[data-group="C"]').click();
 await page.locator('[data-choice="exists"][data-value="Não"]').click();
 await page.locator('[data-action="next"]').click();
 await page.locator('[data-choice="uncovered"][data-value="Sim"]').click();
 await page.locator('[data-action="next"]').click();
 await page.locator('[data-field="affectedDescription"]').fill('Salas dos fundos — descrição no teste isolado');
 assert.equal(await page.getByText('Cadastre os ambientes no grupo B para selecionar aqui.',{exact:false}).count(),0);
 await page.screenshot({path:dir+'/03-conectividade-sem-ambientes.png',fullPage:true});
 await page.locator('[data-action="next"]').click();
 await page.locator('[data-action="next"]').click();
 await page.locator('[data-action="add-row"]').click();
 await page.locator('[data-field="occurrences.0.description"]').fill('Salas dos fundos sem conectividade');
 await page.locator('[data-sheet="occurrences.0.visible"]').click();
 await page.locator('.bottom-sheet [data-option="Não"]').click();
 await page.locator('[data-action="complete-section"]').click();
 await page.locator('.category-card').first().waitFor();
 assert.match(await page.locator('[data-group="C"]').textContent(),/Concluído/);
 assert.match(await page.locator('[data-group="B"]').textContent(),/Pendente/);
 await page.screenshot({path:dir+'/04-conectividade-concluida-b-pendente.png',fullPage:true});
}
