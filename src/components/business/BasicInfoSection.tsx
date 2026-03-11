
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Controller, UseFormReturn } from 'react-hook-form';
import { Briefcase } from 'lucide-react';
import { SectorData } from '@/types/sectors';

interface BasicInfoSectionProps {
  form: UseFormReturn<any>;
  sectorData: SectorData;
  specialization?: string;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  form,
  sectorData,
  specialization = ''
}) => {
  const categoryValue = form.watch('category');
  const selectedCategory = sectorData.categories.find((cat) => cat.id === categoryValue);
  const availableSpecializations = selectedCategory?.specializations || [];

  const handleSpecializationChange = (value: string) => {
    // Store specialization in localStorage since it's not part of businessData
    localStorage.setItem('selected_specialization', value);
    // Trigger a custom event to notify parent component
    window.dispatchEvent(new CustomEvent('specializationChanged', { detail: value }));
  };

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <Briefcase className="w-6 h-6 mr-3 text-indigo-600" />
          Informações Básicas
        </CardTitle>
        <CardDescription className="text-lg">
          Dados fundamentais sobre seu negócio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium">Nome da Empresa</Label>
            <Controller
              name="name"
              control={form.control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="name"
                  placeholder="Digite o nome da sua empresa"
                  className="h-12 border-0 shadow-md focus:shadow-lg transition-shadow"
                />
              )}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category" className="text-base font-medium">Categoria do Negócio</Label>
            <Controller
              name="category"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-12 border-0 shadow-md focus:shadow-lg transition-shadow">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectorData.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Specialization field - only shows when a category is selected */}
        {categoryValue && availableSpecializations.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="specialization" className="text-base font-medium">Especialização</Label>
            <Select value={specialization} onValueChange={handleSpecializationChange}>
              <SelectTrigger className="h-12 border-0 shadow-md focus:shadow-lg transition-shadow">
                <SelectValue placeholder="Selecione a especialização" />
              </SelectTrigger>
              <SelectContent>
                {availableSpecializations.map((spec) => (
                  <SelectItem key={spec.id} value={spec.id}>
                    {spec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-medium">Descrição do Negócio</Label>
          <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
              <Textarea
                {...field}
                id="description"
                placeholder="Descreva seu negócio, produtos ou serviços..."
                className="min-h-24 border-0 shadow-md focus:shadow-lg transition-shadow resize-none"
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mainProduct" className="text-base font-medium">Produto/Serviço Principal</Label>
          <Controller
            name="mainProduct"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                id="mainProduct"
                placeholder="Ex: Consultoria empresarial, Produtos de beleza..."
                className="h-12 border-0 shadow-md focus:shadow-lg transition-shadow"
              />
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicInfoSection;
