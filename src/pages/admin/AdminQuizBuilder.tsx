import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Plus, Settings } from 'lucide-react';
import { useQuizBuilder } from '@/hooks/useQuizBuilder';
import { QuizStepEditor } from '@/components/quiz/QuizStepEditor';
import { QuizStepsList } from '@/components/quiz/QuizStepsList';
import { QuizStepPreview } from '@/components/quiz/QuizStepPreview';
import { QuizStep } from '@/types/quiz';

const AdminQuizBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { quiz, steps, isLoading, saveQuiz, saveStep, deleteStep, isSaving } = useQuizBuilder(id);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  
  // Thank You Config
  const [thankYouTitle, setThankYouTitle] = useState('');
  const [thankYouSubtitle, setThankYouSubtitle] = useState('');
  const [showScore, setShowScore] = useState(true);
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

  // Step Editor State
  const [isStepEditorOpen, setIsStepEditorOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<QuizStep | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  React.useEffect(() => {
    if (quiz) {
      setName(quiz.name);
      setSlug(quiz.slug);
      setDescription(quiz.description || '');
      
      const tyConfig = quiz.thank_you_config || {};
      setThankYouTitle(tyConfig.title || '');
      setThankYouSubtitle(tyConfig.subtitle || '');
      setShowScore(tyConfig.showScore !== false);
      setCtaText(tyConfig.ctaText || '');
      setCtaUrl(tyConfig.ctaUrl || '');
    }
  }, [quiz]);

  const handleSlugGeneration = () => {
    const generatedSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
  };

  const handleSaveQuiz = () => {
    const quizData = {
      name,
      slug,
      description,
      thank_you_config: {
        title: thankYouTitle,
        subtitle: thankYouSubtitle,
        showScore,
        ctaText,
        ctaUrl,
      },
    };

    saveQuiz(quizData);
  };

  const handleNewStep = () => {
    setEditingStep(null);
    setIsStepEditorOpen(true);
  };

  const handleEditStep = (step: QuizStep) => {
    setEditingStep(step);
    setIsStepEditorOpen(true);
  };

  const handleSaveStep = (stepData: Partial<QuizStep>) => {
    saveStep(stepData);
  };

  const selectedStep = steps?.find(s => s.id === selectedStepId) || null;

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/admin/quizzes')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEditing ? 'Editar Quiz' : 'Novo Quiz'}
            </h1>
            <p className="text-muted-foreground">
              Configure o quiz e adicione os steps
            </p>
          </div>
        </div>

        <Button onClick={handleSaveQuiz} disabled={!name || !slug || isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Quiz'}
        </Button>
      </div>

      {/* Main Layout: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Quiz Settings + Steps List */}
        <div className="space-y-6">
          <Card className="p-6">
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="thankyou">Tela Final</TabsTrigger>
              </TabsList>

              {/* Tab: Quiz Info */}
              <TabsContent value="info" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Nome do Quiz*</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Diagnóstico de Marketing Digital"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug (URL)*</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="diagnostico-marketing"
                    />
                    <Button
                      variant="outline"
                      onClick={handleSlugGeneration}
                      disabled={!name}
                    >
                      Gerar
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    URL: {window.location.origin}/quizz/{slug || 'seu-slug'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva brevemente o objetivo deste quiz..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Tab: Thank You Screen */}
              <TabsContent value="thankyou" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="ty-title">Título da Tela Final</Label>
                  <Input
                    id="ty-title"
                    value={thankYouTitle}
                    onChange={(e) => setThankYouTitle(e.target.value)}
                    placeholder="Obrigado por responder!"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="ty-subtitle">Subtítulo</Label>
                  <Textarea
                    id="ty-subtitle"
                    value={thankYouSubtitle}
                    onChange={(e) => setThankYouSubtitle(e.target.value)}
                    placeholder="Suas respostas foram enviadas..."
                    className="mt-2"
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Exibir Score</Label>
                    <p className="text-xs text-muted-foreground">
                      Mostrar pontuação na tela final
                    </p>
                  </div>
                  <Switch checked={showScore} onCheckedChange={setShowScore} />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="cta-text">Texto do CTA</Label>
                  <Input
                    id="cta-text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Falar com especialista"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="cta-url">URL do CTA</Label>
                  <Input
                    id="cta-url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://wa.me/..."
                    className="mt-2"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Steps Section */}
          {isEditing && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Steps do Quiz
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {steps?.length || 0} steps configurados
                  </p>
                </div>
                <Button onClick={handleNewStep}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Step
                </Button>
              </div>

              <QuizStepsList
                steps={steps || []}
                selectedStepId={selectedStepId}
                onSelectStep={setSelectedStepId}
                onEditStep={handleEditStep}
                onDeleteStep={deleteStep}
              />
            </Card>
          )}
        </div>

        {/* Right Column: Preview */}
        {isEditing && (
          <div className="space-y-6">
            <QuizStepPreview step={selectedStep} />
          </div>
        )}
      </div>

      {/* Step Editor Sheet */}
      <QuizStepEditor
        open={isStepEditorOpen}
        onOpenChange={setIsStepEditorOpen}
        step={editingStep}
        orderIndex={steps?.length || 0}
        onSave={handleSaveStep}
      />
    </div>
  );
};

export default AdminQuizBuilder;
