-- Inserir o usuário atual como admin usando seu ID específico
INSERT INTO public.user_roles (user_id, role)
VALUES ('5684a036-a7b1-4508-b2eb-c0a59168192f', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;