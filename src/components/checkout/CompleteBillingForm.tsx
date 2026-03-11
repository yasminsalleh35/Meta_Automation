import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import InputMask from 'react-input-mask';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { User, MapPin, Phone, CreditCard, Loader2 } from 'lucide-react';

// Validação de CPF
const validateCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit === parseInt(cleanCPF.charAt(10));
};

const billingSchema = z.object({
  cpf: z.string()
    .min(1, 'CPF é obrigatório')
    .refine(validateCPF, 'CPF inválido'),
  phone: z.string()
    .min(1, 'Telefone é obrigatório')
    .min(14, 'Telefone deve ter pelo menos 10 dígitos'),
  cep: z.string()
    .min(1, 'CEP é obrigatório')
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  street: z.string().min(1, 'Endereço é obrigatório'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório').max(2, 'Use a sigla do estado'),
});

export type BillingFormData = z.infer<typeof billingSchema>;

interface CompleteBillingFormProps {
  onSubmit: (data: BillingFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<BillingFormData>;
}

export const CompleteBillingForm: React.FC<CompleteBillingFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData = {}
}) => {
  const { toast } = useToast();
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  const form = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      cpf: '',
      phone: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      ...initialData
    }
  });

  const fetchAddressByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    setIsLoadingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast({
          title: 'CEP não encontrado',
          description: 'Verifique o CEP informado',
          variant: 'destructive'
        });
        return;
      }

      // Preenche automaticamente os campos de endereço
      form.setValue('street', data.logradouro || '');
      form.setValue('neighborhood', data.bairro || '');
      form.setValue('city', data.localidade || '');
      form.setValue('state', data.uf || '');
      
      // Foca no campo número
      setTimeout(() => {
        const numberInput = document.querySelector('input[name="number"]') as HTMLInputElement;
        numberInput?.focus();
      }, 100);

    } catch (error) {
      toast({
        title: 'Erro ao buscar CEP',
        description: 'Tente novamente em alguns instantes',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingCEP(false);
    }
  };

  const handleCEPChange = (value: string) => {
    form.setValue('cep', value);
    const cleanCEP = value.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      fetchAddressByCEP(cleanCEP);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Dados para Faturamento
        </CardTitle>
        <CardDescription>
          Informações necessárias para processar seu pagamento com segurança
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* CPF */}
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    CPF
                  </FormLabel>
                  <FormControl>
                    <InputMask
                      mask="999.999.999-99"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {(inputProps: any) => (
                        <Input 
                          {...inputProps}
                          placeholder="000.000.000-00"
                          className="font-mono"
                        />
                      )}
                    </InputMask>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Telefone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </FormLabel>
                  <FormControl>
                    <InputMask
                      mask="(99) 99999-9999"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {(inputProps: any) => (
                        <Input 
                          {...inputProps}
                          placeholder="(11) 99999-9999"
                          className="font-mono"
                        />
                      )}
                    </InputMask>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CEP */}
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    CEP
                    {isLoadingCEP && <Loader2 className="h-3 w-3 animate-spin" />}
                  </FormLabel>
                  <FormControl>
                    <InputMask
                      mask="99999-999"
                      value={field.value}
                      onChange={(e) => handleCEPChange(e.target.value)}
                      disabled={isLoadingCEP}
                    >
                      {(inputProps: any) => (
                        <Input 
                          {...inputProps}
                          placeholder="00000-000"
                          className="font-mono"
                        />
                      )}
                    </InputMask>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Endereço e Número */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Rua, Avenida, etc."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="123"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Complemento */}
            <FormField
              control={form.control}
              name="complement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      placeholder="Apt, Bloco, etc."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bairro e Cidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="Centro, Jardins, etc."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="São Paulo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Estado */}
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      placeholder="SP"
                      maxLength={2}
                      className="uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validando dados...
                </div>
              ) : (
                'Continuar para Pagamento'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};