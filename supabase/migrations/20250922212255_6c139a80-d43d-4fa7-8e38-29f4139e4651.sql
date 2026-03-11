-- FASE 3: Resetar flag must_change_password para o usuário específico
-- Identificar e corrigir usuários com flag persistente incorreto
UPDATE profiles 
SET must_change_password = false 
WHERE id = 'bae7c866-e21d-40f8-acb3-53111675a613' 
AND must_change_password = true;