// ADAPTADOR DE CATÁLOGO do módulo de agentes para D1.
//
// É o ÚNICO ponto que conhece as tabelas do SEU sistema de inventário (unidades/escolas, ambientes/salas,
// vistorias e fichas de equipamento). A versão abaixo aponta para as tabelas de REFERÊNCIA
// (migrations/0101_catalogo_REFERENCIA_somente_homologacao.sql), usadas só para homologar o módulo.
//
// PARA INTEGRAR: copie este arquivo, troque nomes de tabelas/colunas pelos reais e mantenha os mesmos
// nomes de função e o mesmo FORMATO de objeto devolvido (ver "Formatos" abaixo). Nada mais no módulo
// precisa mudar. Teste com `npm run test:d1` apontando para o seu esquema (ver LEIA-ME).
//
// Formatos (o que o módulo espera):
//   unidade     { unit_id, name, active: boolean }
//   ambiente    { environment_id, unit_id, name }
//   vistoria    { inspection_id, unit_id, state }              state 'open' = aberta
//   equipamento { id, unit_id, environment_id, category, asset, serial, status, version: inteiro,
//                 position_label, position_description, location_state, location_confirmed_by, location_confirmed_at }
//   category: 'desktop' | 'notebook' são tratados como computador.
//   version: inteiro que AUMENTA a cada alteração da ficha (controle otimista de concorrência).
//            Se a sua tabela não tem versão, crie a coluna (ALTER TABLE ... ADD COLUMN version INTEGER NOT NULL DEFAULT 1)
//            e faça as telas do sistema também incrementá-la ao editar a ficha.
//
// Escritas: devolvem D1PreparedStatement para entrarem no MESMO db.batch() do vínculo (tudo ou nada).

const COMPUTADORES = "('desktop','notebook')";
const EQ_COLS = `id, unit_id, environment_id, category, asset, serial, status, version, position_label,
  position_description, location_state, location_confirmed_by, location_confirmed_at`;

const eq = (r) => r && ({
  id: r.id, unit_id: r.unit_id, environment_id: r.environment_id ?? null, category: r.category, asset: r.asset ?? null,
  serial: r.serial ?? null, status: r.status, version: Number(r.version), position_label: r.position_label ?? null,
  position_description: r.position_description ?? null, location_state: r.location_state ?? 'declarada',
  location_confirmed_by: r.location_confirmed_by ?? null, location_confirmed_at: r.location_confirmed_at ?? null,
});
const unit = (r) => r && ({ unit_id: r.unit_id, name: r.name, active: !!r.active });
const env = (r) => r && ({ environment_id: r.environment_id, unit_id: r.unit_id, name: r.name });
const insp = (r) => r && ({ inspection_id: r.inspection_id, unit_id: r.unit_id, state: r.state });

export const catalogoReferencia = {
  nome: 'referencia (tabelas ref_*) — SOMENTE homologação',

  async getUnit(db, id) { return unit(await db.prepare('SELECT unit_id, name, active FROM ref_unidades WHERE unit_id = ?1').bind(id).first()); },
  async listUnits(db) { return (await db.prepare('SELECT unit_id, name, active FROM ref_unidades ORDER BY name').all()).results.map(unit); },
  async getEnvironment(db, id) { return env(await db.prepare('SELECT environment_id, unit_id, name FROM ref_ambientes WHERE environment_id = ?1').bind(id).first()); },
  async listEnvironments(db, unitId) { return (await db.prepare('SELECT environment_id, unit_id, name FROM ref_ambientes WHERE unit_id = ?1 ORDER BY name').bind(unitId).all()).results.map(env); },
  async getInspection(db, id) { return insp(await db.prepare('SELECT inspection_id, unit_id, state FROM ref_vistorias WHERE inspection_id = ?1').bind(id).first()); },
  async listOpenInspections(db, unitId) {
    return (await db.prepare("SELECT inspection_id, unit_id, state FROM ref_vistorias WHERE unit_id = ?1 AND state = 'open' ORDER BY inspection_id").bind(unitId).all()).results.map(insp);
  },
  async getEquipment(db, id) { return eq(await db.prepare(`SELECT ${EQ_COLS} FROM ref_equipamentos WHERE id = ?1`).bind(id).first()); },
  async listComputersInUnit(db, unitId) {
    return (await db.prepare(`SELECT ${EQ_COLS} FROM ref_equipamentos WHERE unit_id = ?1 AND category IN ${COMPUTADORES} ORDER BY asset LIMIT 2000`).bind(unitId).all()).results.map(eq);
  },
  async findEquipmentByAsset(db, asset) { return eq(await db.prepare(`SELECT ${EQ_COLS} FROM ref_equipamentos WHERE asset = ?1 LIMIT 1`).bind(asset).first()); },

  /** Asserção para o batch: desfaz tudo se a ficha não estiver na versão esperada. */
  assertEquipmentVersion(db, id, version) {
    return db.prepare('INSERT INTO agent_tx_guard(ok) SELECT 0 WHERE NOT EXISTS (SELECT 1 FROM ref_equipamentos WHERE id = ?1 AND version = ?2)').bind(id, version);
  },
  /** Atualiza a localização DA FICHA (fonte de verdade) e incrementa a versão. */
  updateEquipmentLocation(db, id, expectedVersion, l) {
    return db.prepare(`UPDATE ref_equipamentos SET environment_id = ?1, position_label = ?2, position_description = ?3, location_state = ?4,
        location_confirmed_by = ?5, location_confirmed_at = ?6, version = version + 1 WHERE id = ?7 AND version = ?8`)
      .bind(l.environment_id, l.position_label, l.position_description, l.location_state, l.location_confirmed_by, l.location_confirmed_at, id, expectedVersion);
  },
  /** Ficha nova criada pelo vínculo (rascunho). No sistema real, respeite o fluxo de criação de fichas. */
  insertEquipment(db, e) {
    return db.prepare(`INSERT INTO ref_equipamentos (id, unit_id, environment_id, category, asset, serial, status, version, position_label,
        position_description, location_state, location_confirmed_by, location_confirmed_at, created_by, inspection_id)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`)
      .bind(e.id, e.unit_id, e.environment_id, e.category, e.asset, e.serial, e.status, e.version, e.position_label,
        e.position_description, e.location_state, e.location_confirmed_by, e.location_confirmed_at, e.created_by ?? null, e.inspection_id ?? null);
  },

  async countEquipment(db) { return (await db.prepare('SELECT COUNT(*) AS n FROM ref_equipamentos').first()).n; },

  /** Somente testes/homologação: carrega um catálogo fictício nas tabelas ref_*. */
  async seed(db, s) {
    const st = [];
    for (const u of s.units) st.push(db.prepare('INSERT INTO ref_unidades VALUES (?1, ?2, ?3)').bind(u.unit_id, u.name, u.active ? 1 : 0));
    for (const e of s.environments) st.push(db.prepare('INSERT INTO ref_ambientes VALUES (?1, ?2, ?3)').bind(e.environment_id, e.unit_id, e.name));
    for (const i of s.inspections) st.push(db.prepare('INSERT INTO ref_vistorias VALUES (?1, ?2, ?3)').bind(i.inspection_id, i.unit_id, i.state));
    for (const e of s.equipment) st.push(this.insertEquipment(db, e));
    if (st.length) await db.batch(st);
  },
};
