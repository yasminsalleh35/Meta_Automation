
// Base de dados das principais cidades por estado
export const citiesByState: { [key: string]: string[] } = {
  'AC': [
    'Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó',
    'Brasiléia', 'Plácido de Castro', 'Xapuri', 'Epitaciolândia', 'Acrelândia'
  ],
  'AL': [
    'Maceió', 'Arapiraca', 'Palmeira dos Índios', 'Rio Largo', 'Penedo',
    'União dos Palmares', 'São Miguel dos Campos', 'Coruripe', 'Delmiro Gouveia',
    'Santana do Ipanema', 'Marechal Deodoro', 'Campo Alegre', 'Pilar'
  ],
  'AP': [
    'Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Mazagão',
    'Porto Grande', 'Tartarugalzinho', 'Vitória do Jari', 'Ferreira Gomes'
  ],
  'AM': [
    'Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari', 'Tefé',
    'Tabatinga', 'Maués', 'São Gabriel da Cachoeira', 'Humaitá', 'Lábrea',
    'Barcelos', 'Eirunepé', 'Fonte Boa', 'Iranduba', 'Presidente Figueiredo'
  ],
  'BA': [
    'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro',
    'Ilhéus', 'Itabuna', 'Lauro de Freitas', 'Jequié', 'Teixeira de Freitas',
    'Alagoinhas', 'Barreiras', 'Simões Filho', 'Paulo Afonso', 'Eunápolis',
    'Santo Antônio de Jesus', 'Valença', 'Candeias', 'Guanambi', 'Jacobina',
    'Serrinha', 'Senhor do Bonfim', 'Dias d\'Ávila', 'Luís Eduardo Magalhães',
    'Itapetinga', 'Irecê', 'Campo Formoso', 'Casa Nova', 'Bom Jesus da Lapa'
  ],
  'CE': [
    'Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral',
    'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá', 'Canindé',
    'Aquiraz', 'Pacatuba', 'Crateús', 'Russas', 'Aracati', 'Cascavel',
    'Pacajus', 'Icó', 'Horizonte', 'Camocim', 'Morada Nova', 'Acaraú'
  ],
  'DF': [
    'Brasília', 'Gama', 'Taguatinga', 'Ceilândia', 'Sobradinho', 'Planaltina',
    'Águas Claras', 'Guará', 'Santa Maria', 'São Sebastião', 'Recanto das Emas',
    'Samambaia', 'Riacho Fundo', 'Núcleo Bandeirante', 'Brazlândia'
  ],
  'ES': [
    'Vila Velha', 'Serra', 'Cariacica', 'Vitória', 'Cachoeiro de Itapemirim',
    'Linhares', 'São Mateus', 'Colatina', 'Guarapari', 'Aracruz',
    'Viana', 'Nova Venécia', 'Barra de São Francisco', 'Santa Teresa',
    'Castelo', 'Marataízes', 'Itapemirim', 'Alegre', 'Baixo Guandu'
  ],
  'GO': [
    'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia',
    'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa',
    'Novo Gama', 'Itumbiara', 'Senador Canedo', 'Catalão', 'Jataí',
    'Planaltina', 'Caldas Novas', 'Santo Antônio do Descoberto', 'Goianésia',
    'Cidade Ocidental', 'Mineiros', 'Cristalina', 'Inhumas'
  ],
  'MA': [
    'São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias',
    'Codó', 'Paço do Lumiar', 'Açailândia', 'Bacabal', 'Balsas',
    'Barra do Corda', 'Santa Inês', 'Pinheiro', 'Pedreiras', 'Zé Doca',
    'Chapadinha', 'Presidente Dutra', 'Viana', 'Grajaú', 'Itapecuru Mirim'
  ],
  'MT': [
    'Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra',
    'Cáceres', 'Sorriso', 'Lucas do Rio Verde', 'Barra do Garças',
    'Primavera do Leste', 'Alta Floresta', 'Pontes e Lacerda', 'Juína',
    'Diamantino', 'Nova Mutum', 'Mirassol d\'Oeste', 'Guarantã do Norte'
  ],
  'MS': [
    'Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã',
    'Naviraí', 'Nova Andradina', 'Sidrolândia', 'Maracaju', 'São Gabriel do Oeste',
    'Coxim', 'Aquidauana', 'Paranaíba', 'Amambai', 'Chapadão do Sul',
    'Anastácio', 'Bonito', 'Jardim', 'Ivinhema', 'Cassilândia'
  ],
  'MG': [
    'Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim',
    'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares',
    'Ipatinga', 'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Ibirité',
    'Poços de Caldas', 'Patos de Minas', 'Pouso Alegre', 'Teófilo Otoni',
    'Barbacena', 'Sabará', 'Vespasiano', 'Araguari', 'Passos', 'Ubá',
    'Coronel Fabriciano', 'Muriaé', 'Ituiutaba', 'Lavras', 'Itabira',
    'Varginha', 'Conselheiro Lafaiete', 'São João del Rei', 'Leopoldina',
    'Cataguases', 'Formiga', 'Esmeraldas', 'Viçosa', 'Novo Lima', 'Paracatu'
  ],
  'PA': [
    'Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas', 'Castanhal',
    'Abaetetuba', 'Cametá', 'Marituba', 'Altamira', 'Tucuruí', 'Bragança',
    'Paragominas', 'Redenção', 'Itaituba', 'Oriximiná', 'Capanema',
    'Tailândia', 'Xinguara', 'Goianésia do Pará', 'Tomé-Açu', 'Barcarena'
  ],
  'PB': [
    'João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux',
    'Sousa', 'Cajazeiras', 'Cabedelo', 'Guarabira', 'Mamanguape',
    'Sapé', 'Itabaiana', 'Monteiro', 'Picuí', 'Princesa Isabel',
    'Esperança', 'São Bento', 'Pombal', 'Conde', 'Areia'
  ],
  'PR': [
    'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel',
    'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava',
    'Paranaguá', 'Araucária', 'Toledo', 'Apucarana', 'Pinhais',
    'Campo Largo', 'Arapongas', 'Almirante Tamandaré', 'Umuarama',
    'Piraquara', 'Cambé', 'Campo Mourão', 'Fazenda Rio Grande',
    'Sarandi', 'Cianorte', 'Irati', 'União da Vitória', 'Paranavaí',
    'Francisco Beltrão', 'Pato Branco', 'Cornélio Procópio'
  ],
  'PE': [
    'Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina',
    'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns',
    'Vitória de Santo Antão', 'São Lourenço da Mata', 'Gravataí',
    'Igarassu', 'Abreu e Lima', 'Ipojuca', 'Serra Talhada', 'Araripina',
    'Goiana', 'Belo Jardim', 'Arcoverde', 'Ouricuri', 'Escada'
  ],
  'PI': [
    'Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano', 'Campo Maior',
    'Barras', 'União', 'Altos', 'Pedro II', 'Valença do Piauí',
    'José de Freitas', 'Oeiras', 'Esperantina', 'São Raimundo Nonato',
    'Corrente', 'Livramento do Brumado', 'Simplício Mendes'
  ],
  'RJ': [
    'Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói',
    'Belford Roxo', 'São João de Meriti', 'Campos dos Goytacazes', 'Petrópolis',
    'Volta Redonda', 'Magé', 'Itaboraí', 'Mesquita', 'Nova Friburgo',
    'Barra Mansa', 'Angra dos Reis', 'Teresópolis', 'Nilópolis', 'Queimados',
    'Resende', 'Cabo Frio', 'Macaé', 'Japeri', 'Seropédica', 'Rio das Ostras',
    'Araruama', 'Três Rios', 'Valença', 'Rio Bonito', 'Cachoeiras de Macacu'
  ],
  'RN': [
    'Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba',
    'Ceará-Mirim', 'Caicó', 'Assu', 'Currais Novos', 'João Câmara',
    'Nova Cruz', 'Touros', 'Santa Cruz', 'Pau dos Ferros', 'São José de Mipibu',
    'Apodi', 'Extremoz', 'Nísia Floresta', 'Goianinha', 'Canguaretama'
  ],
  'RS': [
    'Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria',
    'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande',
    'Alvorada', 'Passo Fundo', 'Sapucaia do Sul', 'Uruguaiana',
    'Santa Cruz do Sul', 'Cachoeirinha', 'Bagé', 'Bento Gonçalves',
    'Erechim', 'Guaíba', 'Cachoeira do Sul', 'Santana do Livramento',
    'Ijuí', 'Sapiranga', 'Santo Ângelo', 'Alegrete', 'Lajeado',
    'Venâncio Aires', 'Cruz Alta', 'Camaquã', 'Farroupilha'
  ],
  'RO': [
    'Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal',
    'Rolim de Moura', 'Jaru', 'Guajará-Mirim', 'Espigão d\'Oeste',
    'Pimenta Bueno', 'Ouro Preto do Oeste', 'Costa Marques', 'Cerejeiras'
  ],
  'RR': [
    'Boa Vista', 'Rorainópolis', 'Caracaraí', 'Alto Alegre', 'Mucajaí',
    'Cantá', 'Bonfim', 'Normandia', 'São João da Baliza', 'São Luiz'
  ],
  'SC': [
    'Joinville', 'Florianópolis', 'Blumenau', 'São José', 'Criciúma',
    'Chapecó', 'Itajaí', 'Lages', 'Palhoça', 'Balneário Camboriú',
    'Brusque', 'Tubarão', 'São Bento do Sul', 'Caçador', 'Camboriú',
    'Navegantes', 'Concórdia', 'Rio do Sul', 'Araranguá', 'Gaspar',
    'Biguaçu', 'Indaial', 'Itapema', 'Mafra', 'Canoinhas', 'Videira',
    'Xanxerê', 'Içara', 'Imbituba', 'Jaraguá do Sul'
  ],
  'SP': [
    'São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André',
    'Osasco', 'Ribeirão Preto', 'Sorocaba', 'Santos', 'Mauá', 'São José dos Campos',
    'Mogi das Cruzes', 'Diadema', 'Jundiaí', 'Carapicuíba', 'Piracicaba',
    'Bauru', 'São Vicente', 'Itaquaquecetuba', 'Franca', 'Guarujá', 'Taubaté',
    'Praia Grande', 'Limeira', 'Suzano', 'Taboão da Serra', 'Sumaré',
    'Presidente Prudente', 'Americana', 'Araraquara', 'Santa Bárbara d\'Oeste',
    'Jacareí', 'Hortolândia', 'Marília', 'São Carlos', 'Indaiatuba',
    'Cotia', 'São José do Rio Preto', 'Araçatuba', 'Cubatão', 'Atibaia'
  ],
  'SE': [
    'Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão',
    'Estância', 'Tobias Barreto', 'Simão Dias', 'Propriá', 'Barra dos Coqueiros',
    'Laranjeiras', 'Canindé de São Francisco', 'Ribeirópolis', 'Neópolis'
  ],
  'TO': [
    'Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins',
    'Colinas do Tocantins', 'Guaraí', 'Tocantinópolis', 'Araguatins',
    'Dianópolis', 'Miracema do Tocantins', 'Taguatinga', 'Pedro Afonso'
  ]
};

export const getStateFullName = (stateCode: string): string => {
  const stateNames: { [key: string]: string } = {
    'AC': 'Acre',
    'AL': 'Alagoas',
    'AP': 'Amapá',
    'AM': 'Amazonas',
    'BA': 'Bahia',
    'CE': 'Ceará',
    'DF': 'Distrito Federal',
    'ES': 'Espírito Santo',
    'GO': 'Goiás',
    'MA': 'Maranhão',
    'MT': 'Mato Grosso',
    'MS': 'Mato Grosso do Sul',
    'MG': 'Minas Gerais',
    'PA': 'Pará',
    'PB': 'Paraíba',
    'PR': 'Paraná',
    'PE': 'Pernambuco',
    'PI': 'Piauí',
    'RJ': 'Rio de Janeiro',
    'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul',
    'RO': 'Rondônia',
    'RR': 'Roraima',
    'SC': 'Santa Catarina',
    'SP': 'São Paulo',
    'SE': 'Sergipe',
    'TO': 'Tocantins'
  };
  return stateNames[stateCode] || stateCode;
};
