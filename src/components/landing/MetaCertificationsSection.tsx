import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Sparkles } from 'lucide-react';

// Import the new images
import metaCert1 from '@/assets/meta-cert-1.png';
import metaCert2 from '@/assets/meta-cert-2.png';
import metaCert3 from '@/assets/meta-cert-3.png';
import metaCert4 from '@/assets/meta-cert-4.png';

const certifications = [
  {
    title: 'Meta Certified Media Buying Professional',
    description: 'Especialista em compra de mídia com alto desempenho',
    image: metaCert1,
  },
  {
    title: 'Meta Certified Media Planning Professional', 
    description: 'Especialista em planejamento de campanhas de impacto',
    image: metaCert2,
  },
  {
    title: 'Meta Certified Creative Strategy Professional',
    description: 'Foco na criação de anúncios que geram conversões',
    image: metaCert3,
  },
  {
    title: 'Meta Certified Marketing Science Professional',
    description: 'Análise e otimização baseada em dados reais',
    image: metaCert4,
  },
];

export const MetaCertificationsSection: React.FC = () => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  const handleImageError = (index: number, url: string) => {
    console.error(`Failed to load image at index ${index}:`, url);
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => ({ ...prev, [index]: true }));
  };

  return (
    <section className="py-20 sm:py-24 lg:py-28 px-4 bg-white relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20"></div>
      
      <div className="container mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6 lg:space-y-8">
            <div className="space-y-4">
              <Badge className="bg-camply-blue text-white hover:bg-camply-blue/90 text-sm px-4 py-2 shadow-lg">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                Meta Certified
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-camply-dark">
                Certificação oficial que garante resultados
              </h2>
            </div>
            
            <div className="space-y-5 text-camply-dark/80 leading-relaxed text-lg">
              <p>
                A Camply não é apenas simples de usar — ela é construída sobre conhecimento certificado.
              </p>
              
              <p>
                Nossa equipe possui as principais certificações de Especialista em Anúncios do Meta, 
                reconhecimento oficial que comprova domínio das ferramentas e estratégias para gerar 
                os melhores resultados no Facebook e Instagram.
              </p>
              
              <p>
                Com essas certificações, você tem a segurança de que cada campanha criada pela Camply 
                segue as melhores práticas e padrões exigidos pela própria Meta.
              </p>
            </div>

            <div className="pt-4 bg-camply-blue-light p-6 rounded-xl border-l-4 border-camply-blue">
              <p className="text-base text-camply-dark/80 italic leading-relaxed">
                <strong className="text-camply-blue not-italic">Tradução prática:</strong> seu anúncio é planejado, criado e otimizado de acordo com o mesmo 
                nível de excelência exigido dos melhores profissionais de marketing digital no mundo.
              </p>
            </div>
          </div>

          {/* Right Column - Certifications Grid */}
          <div className="space-y-6 lg:space-y-8">
            <h3 className="text-xl lg:text-2xl font-semibold text-camply-dark text-center lg:text-left">
              Principais certificações que sustentam nossa tecnologia:
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
              {certifications.map((cert, index) => {
                return (
                  <Card key={index} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-camply-blue/30 bg-white">
                    <CardContent className="p-6 lg:p-7 text-center space-y-4">
                      <div className="flex justify-center">
                        <div className="w-36 h-36 rounded-xl overflow-hidden group-hover:scale-110 transition-transform duration-300 shadow-xl bg-camply-blue-light p-3 relative">
                          {!imageLoaded[index] && !imageErrors[index] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white">
                              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-camply-blue"></div>
                            </div>
                          )}
                          
                          {imageErrors[index] ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-camply-blue-light text-camply-blue">
                              <Award className="w-10 h-10 mb-2" />
                              <span className="text-xs text-center font-semibold">Meta Certified</span>
                            </div>
                          ) : (
                            <img 
                              src={cert.image} 
                              alt={`Meta Certification: ${cert.title}`}
                              className="w-full h-full object-contain"
                              onError={() => handleImageError(index, cert.image)}
                              onLoad={() => handleImageLoad(index)}
                              style={{ display: imageLoaded[index] ? 'block' : 'none' }}
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-bold text-camply-dark text-sm lg:text-base leading-tight">
                          {cert.title}
                        </h4>
                        <p className="text-xs lg:text-sm text-camply-dark/70 leading-relaxed">
                          {cert.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
