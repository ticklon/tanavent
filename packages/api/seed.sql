INSERT INTO organization (id, name, created_at) VALUES ('org-1', 'Test Organization', 1700000000000) ON CONFLICT DO NOTHING;
INSERT INTO section (id, organization_id, name) VALUES ('sec-1', 'org-1', 'Test Section') ON CONFLICT DO NOTHING;
INSERT INTO user (id, email, created_at) VALUES ('test-user-id', 'test@example.com', 1700000000000) ON CONFLICT DO NOTHING;



DELETE FROM item;
INSERT INTO item (id, organization_id, section_id, name, vintage, quantity, unit, updated_at) VALUES 
('item-1', 'org-1', 'sec-1', 'Cabernet Sauvignon', 2018, 12.0, 'bottle', 1700000000000),
('item-2', 'org-1', 'sec-1', 'Chardonnay', 2020, 5.0, 'bottle', 1700000000000),
('item-3', 'org-1', 'sec-1', 'Tomato', NULL, 3.5, 'kg', 1700000000000);
