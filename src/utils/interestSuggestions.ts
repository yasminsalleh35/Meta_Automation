
import { metaAdsInterests } from '@/constants/metaAdsInterests';

// Função para obter categorias complementares
export const getComplementaryCategories = (selectedCategories: string[]) => {
  const complementaryMap: { [key: string]: string[] } = {
    'Marketing Digital': ['E-commerce', 'Empreendedorismo', 'Tecnologia'],
    'E-commerce': ['Marketing Digital', 'Moda', 'Tecnologia'],
    'Fitness': ['Alimentação Saudável', 'Saúde', 'Esportes'],
    'Moda': ['Beleza', 'E-commerce', 'Entretenimento'],
    'Tecnologia': ['Marketing Digital', 'Educação', 'Empreendedorismo'],
    'Alimentação Saudável': ['Fitness', 'Saúde', 'Beleza'],
    'Empreendedorismo': ['Marketing Digital', 'Finanças', 'Educação'],
    'Viagens': ['Entretenimento', 'Fotografia', 'Cultura'],
    'Educação': ['Tecnologia', 'Empreendedorismo', 'Desenvolvimento Pessoal'],
    'Beleza': ['Moda', 'Saúde', 'Alimentação Saudável'],
    'Casa e Decoração': ['Arte e Cultura', 'DIY', 'Sustentabilidade'],
    'Automóveis': ['Tecnologia', 'Finanças', 'Esportes'],
    'Esportes': ['Fitness', 'Saúde', 'Entretenimento'],
    'Música': ['Entretenimento', 'Arte e Cultura', 'Tecnologia']
  };

  const complementary = new Set<string>();
  selectedCategories.forEach(category => {
    complementaryMap[category]?.forEach(comp => complementary.add(comp));
  });

  return Array.from(complementary);
};

// Função para obter sugestões baseadas nos interesses já selecionados
export const getDynamicSuggestions = (selectedInterests: string[]) => {
  if (selectedInterests.length === 0) {
    // Se nenhum interesse foi selecionado, mostra categorias principais
    return Object.keys(metaAdsInterests).slice(0, 12);
  }

  // Encontra as categorias dos interesses selecionados
  const selectedCategories = new Set<string>();
  selectedInterests.forEach(interest => {
    Object.entries(metaAdsInterests).forEach(([category, interests]) => {
      if (interests.includes(interest)) {
        selectedCategories.add(category);
      }
    });
  });

  // Gera sugestões relacionadas
  const relatedSuggestions = new Set<string>();
  
  // Adiciona interesses das mesmas categorias
  selectedCategories.forEach(category => {
    metaAdsInterests[category].forEach(interest => {
      if (!selectedInterests.includes(interest)) {
        relatedSuggestions.add(interest);
      }
    });
  });

  // Se temos poucas sugestões, adiciona de categorias relacionadas
  if (relatedSuggestions.size < 8) {
    const complementaryCategories = getComplementaryCategories(Array.from(selectedCategories));
    complementaryCategories.forEach(category => {
      metaAdsInterests[category]?.slice(0, 3).forEach(interest => {
        if (!selectedInterests.includes(interest)) {
          relatedSuggestions.add(interest);
        }
      });
    });
  }

  return Array.from(relatedSuggestions).slice(0, 12);
};
