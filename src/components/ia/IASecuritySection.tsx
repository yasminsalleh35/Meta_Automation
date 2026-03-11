import React from 'react';
import { Shield, Check, Lock, Eye, FileCheck } from 'lucide-react';

export const IASecuritySection: React.FC = () => {
  const guarantees = [
    {
      icon: Lock,
      text: 'Segurança no acesso à sua conta',
    },
    {
      icon: FileCheck,
      text: 'Respeito às políticas e boas práticas',
    },
    {
      icon: Check,
      text: 'Compatibilidade total com as regras de anúncio',
    },
    {
      icon: Eye,
      text: 'Transparência no uso dos seus dados',
    },
  ];

  return (
    <section className="bg-camply-light py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-camply-dark mb-4">
              Segurança e integração oficial com a Meta
            </h2>
          </div>
          
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Shield icon */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-camply-blue/10 flex items-center justify-center">
                  <Shield className="w-12 h-12 text-camply-blue" />
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-camply-green/10 text-camply-green rounded-full px-4 py-2 text-sm font-medium mb-6">
                  <Check className="w-4 h-4" />
                  API Oficial da Meta
                </div>
                
                <p className="text-camply-dark/80 text-base sm:text-lg mb-6">
                  A Camply se conecta ao Meta Ads (Facebook e Instagram) usando a <strong>API oficial da plataforma</strong>.
                </p>
                
                <p className="text-camply-dark/70 text-base mb-6">
                  Isso garante:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {guarantees.map((guarantee, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-camply-green/10 flex items-center justify-center flex-shrink-0">
                        <guarantee.icon className="w-4 h-4 text-camply-green" />
                      </div>
                      <span className="text-camply-dark text-sm">{guarantee.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
              <p className="text-camply-dark/70 text-sm sm:text-base">
                Você autoriza o acesso, mantém o <strong>controle total da sua conta</strong>, e a IA apenas opera a parte técnica para você.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
