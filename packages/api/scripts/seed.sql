import { item } from '@tanavent/shared';
// We cannot easily run D1 actions from a standalone script without binding.
// Instead we will expose a backdoor route or use wrangler d1 execute.
// For now, let's just make a SQL file that can be executed via wrangler.

export const seedSql = `
INSERT INTO item (id, organization_id, section_id, name, vintage, quantity, unit, updated_at) VALUES 
('item-1', 'org-1', 'sec-1', 'Cabernet Sauvignon', 2018, 12.0, 'bottle', 1700000000),
('item-2', 'org-1', 'sec-1', 'Chardonnay', 2020, 5.0, 'bottle', 1700000000),
('item-3', 'org-1', 'sec-1', 'Tomato', NULL, 3.5, 'kg', 1700000000);
`;
