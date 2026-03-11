import React from 'react';

export const IAUseCasesSection: React.FC = () => {
  const useCases = [
    {
      emoji: '🦷',
      title: 'Dentistas',
      description: 'Campanhas para clareamento, implantes, consultas.',
    },
    {
      emoji: '🏡',
      title: 'Corretores',
      description: 'Anúncios de imóveis específicos ou captação de interessados.',
    },
    {
      emoji: '💇‍♀️',
      title: 'Esteticistas e salões',
      description: 'Agendamento de procedimentos e tratamentos.',
    },
    {
      emoji: '📚',
      title: 'Infoprodutores',
      description: 'Captação de leads para lançamentos e perpétuos.',
    },
    {
      emoji: '👨‍⚕️',
      title: 'Profissionais liberais',
      description: 'Psicólogos, nutricionistas, advogados, coaches.',
    },
    {
      emoji: '🏪',
      title: 'Negócios locais',
      description: 'Academias, restaurantes, clínicas, lojas físicas.',
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-camply-dark mb-4">
            Funciona para o seu tipo de negócio?
          </h2>
          <p className="text-camply-dark/70 text-base sm:text-lg max-w-2xl mx-auto">
            A Camply foi pensada para qualquer pessoa que precisa de clientes chegando todos os dias.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <div 
                key={index}
                className="bg-camply-light rounded-2xl p-6 hover:shadow-lg transition-shadow hover:-translate-y-1 duration-300"
              >
                <div className="text-4xl mb-4">{useCase.emoji}</div>
                <h3 className="text-lg font-bold text-camply-dark mb-2">{useCase.title}</h3>
                <p className="text-camply-dark/70 text-sm">{useCase.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-camply-dark/80 text-base sm:text-lg bg-camply-yellow/20 rounded-2xl p-6 inline-block">
              Se o seu negócio precisa de gente chegando no WhatsApp, <strong>a Camply pode te ajudar</strong>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
