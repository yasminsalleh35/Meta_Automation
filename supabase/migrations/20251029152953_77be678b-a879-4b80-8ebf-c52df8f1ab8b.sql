-- Adicionar novo valor 'pending_review' ao tipo de status de campanha
-- Isso permite que campanhas tenham um estado intermediário quando estão sendo analisadas pela Meta

COMMENT ON TABLE campaigns IS 'Campanhas publicitárias gerenciadas pela plataforma. O status pending_review indica que a campanha foi ativada mas está aguardando aprovação da Meta.';

-- Verificar se status é uma coluna TEXT (não enum) e adicionar comentário
COMMENT ON COLUMN campaigns.status IS 'Status da campanha: draft, active, paused, finished, pending_review (em análise pela Meta)';

-- Se houver constraint de check no status, ela precisa ser atualizada
-- Como não temos enum definido, apenas documentamos o novo valor aceito