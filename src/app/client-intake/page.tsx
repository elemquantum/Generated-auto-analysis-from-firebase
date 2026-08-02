
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateClientIntakeReport, GenerateClientIntakeReportOutput } from '@/ai/flows/generate-client-intake-report';
import { Loader2, Wand2, HelpCircle, CheckSquare, Layers, Clock, Mic, MicOff, Copy, FileDown, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { TtsButton } from '@/components/tts-button';

const formSchema = z.object({
  clientRequest: z.string().min(20, {
    message: 'Моля, въведете по-подробно описание (поне 20 символа).',
  }),
});

// A global variable to hold the recognition instance.
let recognition: SpeechRecognition | null = null;

export default function ClientIntakePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<GenerateClientIntakeReportOutput | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientRequest: '',
    },
  });

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Браузърът не се поддържа',
        description: 'Вашият браузър не поддържа функцията за гласово въвеждане.',
      });
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'bg-BG';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      const currentText = form.getValues('clientRequest');
      form.setValue('clientRequest', currentText + finalTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
       toast({
        variant: 'destructive',
        title: 'Грешка при разпознаване',
        description: `Възникна грешка: ${event.error}`,
      });
      setIsRecording(false);
    };

    recognition.onend = () => {
        if (isRecording) {
            setIsRecording(false);
        }
    };
    
    return () => {
        if (recognition) {
            recognition.stop();
        }
    };
  }, [form, toast, isRecording]);


  const toggleRecording = () => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
        try {
            recognition.start();
            setIsRecording(true);
        } catch (e) {
            console.error("Failed to start speech recognition:", e);
            if (e instanceof Error && e.name === 'InvalidStateError') {
                 toast({
                  variant: 'destructive',
                  title: 'Грешка при стартиране на записа',
                  description: 'Разпознаването на говор вече е активно.',
                });
            }
        }
    }
  };

  const resetFlow = () => {
    setReport(null);
    form.reset();
  }
  
  const handleCopy = (textToCopy: string, title: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: 'Копирано!',
      description: `${title} беше копирано в клипборда.`,
    });
  };

  const generateReportHtml = (reportData: GenerateClientIntakeReportOutput): string => {
    const listToHtml = (items: string[]) => `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;

    return `
      <!DOCTYPE html>
      <html lang="bg">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Доклад за първа среща</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 20px auto; padding: 20px; }
              h1, h2, h3 { color: #1a1a1a; }
              h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
              .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              ul { padding-left: 20px; }
              li { margin-bottom: 8px; }
              .client-request { background-color: #f9f9f9; border-left: 4px solid #ccc; padding: 15px; font-style: italic; }
          </style>
      </head>
      <body>
          <h1>Доклад за първа среща</h1>
          <div class="card">
              <h3>Клиентска заявка</h3>
              <p class="client-request">${form.getValues('clientRequest')}</p>
          </div>
          <div class="card">
              <h2>Обобщение на заявката</h2>
              <p>${reportData.summary}</p>
          </div>
          <div class="card">
              <h2>Уточняващи въпроси към клиента</h2>
              ${listToHtml(reportData.clarifyingQuestions)}
          </div>
          <div class="card">
              <h2>Възможен обхват</h2>
              ${listToHtml(reportData.potentialScope)}
          </div>
          <div class="card">
              <h2>Препоръчителни технологии</h2>
              ${listToHtml(reportData.suggestedStack)}
          </div>
          <div class="card">
              <h2>Ориентировъчна времева рамка</h2>
              <p><strong>${reportData.highLevelTimeline}</strong></p>
          </div>
      </body>
      </html>
    `;
  };

  const handleDownloadReport = () => {
    if (!report) return;
    const htmlContent = generateReportHtml(report);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'client-intake-report.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: 'Докладът е изтеглен!',
    });
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setReport(null);
    try {
      const result = await generateClientIntakeReport({
        clientRequest: values.clientRequest,
      });
      setReport(result);
      toast({
        title: 'Докладът е генериран!',
        description: 'Прегледайте резултатите по-долу.',
      });
    } catch (error) {
      console.error('Failed to generate client intake report:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Възникна грешка при създаването на доклада. Моля, опитайте отново.';
      let toastTitle = 'Грешка при генериране';
      let toastDescription = 'Възникна грешка при създаването на доклада. Моля, опитайте отново.';

      if (typeof errorMessage === 'string' && (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota'))) {
          toastTitle = 'Квотата е надвишена';
          toastDescription = 'Надвишили сте безплатната си дневна квота за заявки. Моля, опитайте отново по-късно или проверете своя план.';
      }
      
      toast({
        variant: 'destructive',
        title: toastTitle,
        description: toastDescription,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-primary" />
              Помощник за първа среща
            </CardTitle>
            <CardDescription>
              Въведете или продиктувайте първоначалната заявка от клиента, за да генерира AI обобщение, въпроси и препоръки.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="clientRequest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Клиентска заявка</FormLabel>
                      <FormControl>
                        <div className="relative">
                           <Textarea
                            placeholder="Например: 'Искам да създам онлайн магазин за ръчно изработени бижута...' или използвайте микрофона, за да диктувате."
                            className="min-h-[150px] pr-12"
                            {...field}
                          />
                          <Button 
                            type="button" 
                            variant="ghost"
                            size="icon" 
                            onClick={toggleRecording}
                            className={cn("absolute top-3 right-3 text-muted-foreground hover:text-primary z-10")}
                            aria-label={isRecording ? 'Спиране на записа' : 'Стартиране на запис'}
                          >
                            {isRecording ? (
                                <>
                                    <Mic className="w-5 h-5 text-destructive animate-pulse" />
                                </>
                            ): <MicOff className="w-5 h-5" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading || !form.formState.isValid} size="lg" className="w-full md:w-auto">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Анализиране...
                    </>
                  ) : (
                    'Генерирай доклад'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {isLoading && (
            <div className="text-center p-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="mt-4 text-muted-foreground">AI асистентът подготвя вашия доклад...</p>
            </div>
        )}

        {report && (
          <div className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Генериран доклад</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleDownloadReport}><FileDown className="w-4 h-4 mr-2"/> Изтегли</Button>
                    <Button variant="outline" onClick={resetFlow}><RefreshCw className="w-4 h-4 mr-2"/> Нов доклад</Button>
                </div>
            </div>
            <Separator />
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-xl"><Wand2 className="w-5 h-5 text-primary"/>Обобщение на заявката</CardTitle>
                    <div className="flex items-center gap-1">
                        <TtsButton textToSpeak={report.summary} />
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(report.summary, 'Обобщение')}><Copy className="w-4 h-4"/></Button>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground bg-muted p-4 rounded-md">{report.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-xl"><HelpCircle className="w-5 h-5 text-primary"/>Уточняващи въпроси</CardTitle>
                     <div className="flex items-center gap-1">
                        <TtsButton textToSpeak={report.clarifyingQuestions.join('\n')} />
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(report.clarifyingQuestions.join('\n'), 'Уточняващи въпроси')}><Copy className="w-4 h-4"/></Button>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground bg-muted p-4 rounded-md">
                  {report.clarifyingQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2 text-xl"><CheckSquare className="w-5 h-5 text-primary"/>Възможен обхват</CardTitle>
                            <div className="flex items-center gap-1">
                                <TtsButton textToSpeak={report.potentialScope.join('\n')} />
                                <Button variant="ghost" size="icon" onClick={() => handleCopy(report.potentialScope.join('\n'), 'Възможен обхват')}><Copy className="w-4 h-4"/></Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground bg-muted p-4 rounded-md">
                        {report.potentialScope.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2 text-xl"><Layers className="w-5 h-5 text-primary"/>Препоръки за технологии</CardTitle>
                            <div className="flex items-center gap-1">
                                <TtsButton textToSpeak={report.suggestedStack.join('\n')} />
                                <Button variant="ghost" size="icon" onClick={() => handleCopy(report.suggestedStack.join('\n'), 'Препоръки за технологии')}><Copy className="w-4 h-4"/></Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground bg-muted p-4 rounded-md">
                        {report.suggestedStack.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2 text-xl"><Clock className="w-5 h-5 text-primary"/>Ориентировъчна времева рамка</CardTitle>
                         <div className="flex items-center gap-1">
                            <TtsButton textToSpeak={report.highLevelTimeline} />
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(report.highLevelTimeline, 'Времева рамка')}><Copy className="w-4 h-4"/></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground font-semibold text-lg bg-muted p-4 rounded-md">{report.highLevelTimeline}</p>
                </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
