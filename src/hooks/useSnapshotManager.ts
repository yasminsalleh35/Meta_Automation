
import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

interface Snapshot {
  id: string;
  sector: string;
  snapshot_name: string;
  description?: string;
  file_paths: string[];
  dependencies: string[];
  created_at: string;
  metadata: any;
}

export const useSnapshotManager = () => {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  const executeCommand = async (command: string) => {
    console.log('🎯 Executing snapshot command:', command);
    
    try {
      setIsLoading(true);

      // Parse do comando
      const parseResponse = await supabase.functions.invoke('manage-snapshots', {
        body: { action: 'parse_command', command }
      });

      if (parseResponse.error) {
        throw new Error(parseResponse.error.message);
      }

      const parsedCommand = parseResponse.data;
      console.log('📝 Parsed command:', parsedCommand);

      // Executar ação baseada no comando parseado
      let response;
      switch (parsedCommand.action) {
        case 'create':
          response = await createSnapshot(parsedCommand.sector, parsedCommand.description);
          break;
        
        case 'restore':
          response = await restoreSnapshot(parsedCommand.sector, parsedCommand.snapshotName);
          break;
        
        case 'list':
          response = await listSnapshots(parsedCommand.sector);
          break;
        
        case 'preview':
          response = await previewRestore(parsedCommand.sector, parsedCommand.snapshotName);
          break;
        
        case 'check_dependencies':
          response = await checkDependencies(parsedCommand.sector);
          break;
        
        default:
          throw new Error('Ação não reconhecida');
      }

      return response;

    } catch (error) {
      console.error('❌ Error executing command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro no Comando",
        description: errorMessage,
        variant: "destructive"
      });

      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const createSnapshot = async (sector: string, description: string) => {
    const snapshotName = `snapshot_${Date.now()}`;
    
    const { data, error } = await supabase.functions.invoke('manage-snapshots', {
      body: {
        action: 'create',
        sector,
        snapshotName,
        description
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    toast({
      title: "Snapshot Criado",
      description: data.message,
      variant: "default"
    });

    return data;
  };

  const restoreSnapshot = async (sector: string, snapshotName: string) => {
    const { data, error } = await supabase.functions.invoke('manage-snapshots', {
      body: {
        action: 'restore',
        sector,
        snapshotName
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    toast({
      title: "Snapshot Restaurado",
      description: data.message,
      variant: "default"
    });

    return data;
  };

  const listSnapshots = async (sector?: string) => {
    const { data, error } = await supabase.functions.invoke('manage-snapshots', {
      body: {
        action: 'list',
        sector: sector || 'all'
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    setSnapshots(data.snapshots);
    
    // Formatar resposta para display
    const response = {
      snapshots: data.snapshots,
      total: data.total,
      formatted: formatSnapshotsList(data.snapshots, sector)
    };

    return response;
  };

  const previewRestore = async (sector: string, snapshotName: string) => {
    const { data, error } = await supabase.functions.invoke('manage-snapshots', {
      body: {
        action: 'preview',
        sector,
        snapshotName
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const checkDependencies = async (sector: string) => {
    const { data, error } = await supabase.functions.invoke('manage-snapshots', {
      body: {
        action: 'check_dependencies',
        sector
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const formatSnapshotsList = (snapshots: Snapshot[], sector?: string) => {
    if (snapshots.length === 0) {
      return `📦 Nenhum snapshot encontrado${sector ? ` para o setor '${sector}'` : ''}`;
    }

    let formatted = `📦 **Snapshots Disponíveis**${sector ? ` - Setor: ${sector}` : ' - Todos os Setores'}:\n\n`;
    
    const groupedBySector = snapshots.reduce((acc, snapshot) => {
      if (!acc[snapshot.sector]) {
        acc[snapshot.sector] = [];
      }
      acc[snapshot.sector].push(snapshot);
      return acc;
    }, {} as Record<string, Snapshot[]>);

    Object.entries(groupedBySector).forEach(([sectorName, sectorSnapshots]) => {
      formatted += `**${sectorName.toUpperCase()}:**\n`;
      sectorSnapshots.forEach((snapshot, index) => {
        const date = new Date(snapshot.created_at).toLocaleDateString('pt-BR');
        formatted += `  ${index + 1}. "${snapshot.snapshot_name}" - ${snapshot.description || 'Sem descrição'} (${date})\n`;
      });
      formatted += '\n';
    });

    return formatted.trim();
  };

  return {
    executeCommand,
    createSnapshot,
    restoreSnapshot,
    listSnapshots,
    previewRestore,
    checkDependencies,
    snapshots,
    isLoading
  };
};
