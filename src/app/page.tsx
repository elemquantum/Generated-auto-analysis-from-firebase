
'use client';

import { useMemo, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInventoryStore, InventoryItem, PricePoints } from '@/lib/inventory-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TtsButton } from '@/components/tts-button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Box, Users, BookOpen, Copy, Folder, Share2, FileDown, Trash2, Lightbulb, ClipboardList, Clock, Zap, Target, BarChart as BarChartIcon, Search, UploadCloud } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import Image from 'next/image';


import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { generateInventoryReport } from '@/ai/flows/generate-inventory-report';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ProductCarousel } from '@/components/product-carousel';
import { analyzeProductComprehensive } from '@/ai/flows/analyze-product-comprehensive';

function AnalysisUploader() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const { addItem } = useInventoryStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFlow = () => {
      setIsProcessing(false);
      setError(null);
      setIsDone(false);
      setPreviewImage(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
  }
  
  const readFileAsDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file as Data URL.'));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const processUploadedFile = async (fileDataUri: string) => {
    setIsProcessing(true);
    setError(null);
    setIsDone(false);
    setPreviewImage(fileDataUri);

    try {
        const comprehensiveResult = await analyzeProductComprehensive({ photoDataUri: fileDataUri });

        if (!comprehensiveResult || comprehensiveResult.products.length === 0) {
            throw new Error("Не успяхме да идентифицираме продукти в изображението.");
        }

        const inventoryItems: InventoryItem[] = comprehensiveResult.products.map(productAnalysis => {
            const { identification, conditionAssessment, marketAnalysis, salesStrategy } = productAnalysis;
            const productName = `${identification.brand || ''} ${identification.model || ''}`.trim() || 'Неидентифициран продукт';
            
            return {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                productName: productName,
                productType: identification.type,
                category: identification.category || "Без категория",
                condition: conditionAssessment.condition,
                conditionJustification: conditionAssessment.justification,
                marketAnalysis: marketAnalysis,
                salesStrategy: salesStrategy,
                createdAt: Date.now(),
                originalImageDataUri: fileDataUri,
                presentationImages: [],
            };
        });
        
        inventoryItems.forEach(item => addItem(item));
        
        setIsDone(true);
        toast({
            title: `Успешно анализирани ${inventoryItems.length} продукта!`,
            description: "Резултатите са добавени в инвентара.",
        });
        
        setTimeout(() => {
          router.push(`/?id=${inventoryItems[0].id}`);
          resetFlow();
        }, 1000);

    } catch (e: any) {
        console.error('Process upload file error:', e);
        let errorMessage = e.message || "Възникна неочаквана грешка при анализа.";
        let toastTitle = "Анализът е спрян";

        if (typeof errorMessage === 'string' && (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota'))) {
            toastTitle = 'Квотата е надвишена';
            errorMessage = 'Надвишили сте безплатната си дневна квота за заявки. Моля, опитайте отново по-късно или проверете своя план.';
        } else if (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('not found')) {
          toastTitle = 'Моделът не е намерен';
          errorMessage = 'Изглежда, че конфигурираният AI модел не е наличен. Моля, проверете конфигурацията.';
        }
        
        setError(errorMessage);
        toast({ variant: "destructive", title: toastTitle, description: errorMessage });
    } finally {
        setIsProcessing(false);
    }
  };

   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetFlow();
    
    try {
      const fileDataUri = await readFileAsDataUri(file);
      await processUploadedFile(fileDataUri);
    } catch (e: any) {
      const errorMessage = e.message || "Файлът не може да бъде анализиран.";
      console.error(errorMessage, e);
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Грешка при обработка на файла",
        description: errorMessage,
      });
    }
  };

  return (
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">🤖 Стартирайте AI анализ</CardTitle>
            <CardDescription>
              Анализирайте един или няколко продукта от една снимка.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 flex flex-col items-center justify-center transition-colors min-h-[250px] relative cursor-pointer"
               onClick={() => !isProcessing && fileInputRef.current?.click()}
            >
              {!previewImage && (
                <div className="text-center w-full h-full flex flex-col justify-center items-center">
                  <UploadCloud className="w-12 h-12 text-muted-foreground mb-4 mx-auto" />
                  <p className="font-semibold text-foreground">Започнете анализ</p>
                  <p className="text-sm text-muted-foreground mb-4">Плъзнете файл тук или кликнете, за да изберете</p>
                  <Button variant="secondary" size="sm">Качете файл</Button>
                </div>
              )}
              {previewImage && (
                 <Image
                    src={previewImage}
                    alt="Preview"
                    width={400}
                    height={400}
                    className="max-h-[250px] w-auto rounded-md object-contain"
                />
              )}
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
              disabled={isProcessing}
            />
             {isProcessing && (
               <div className="text-center space-y-4 pt-4 flex items-center justify-center gap-2">
                   <Loader2 className="h-5 w-5 animate-spin text-primary" />
                   <p className="text-primary font-semibold">AI анализира, моля изчакайте...</p>
               </div>
            )}
             {error && (
               <div className="text-center space-y-4 pt-4">
                   <XCircle className="w-12 h-12 text-destructive mx-auto" />
                   <p className="text-destructive font-semibold">{error}</p>
                   <Button onClick={resetFlow}>Опитайте отново</Button>
               </div>
            )}
             {isDone && (
                <div className="text-center space-y-4 pt-4">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="text-foreground font-semibold">Анализът е завършен!</p>
                    <p className="text-muted-foreground text-sm">Резултатите се зареждат...</p>
               </div>
            )}
          </CardContent>
          { (isProcessing || isDone || error) && 
            <CardFooter className="justify-center">
                <Button variant="outline" onClick={resetFlow}>Стартирай нов анализ</Button>
            </CardFooter>
          }
        </Card>
  );
}


function InventoryPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { items, getItem, clearInventory, updateItem, removeItem, _hasHydrated } = useInventoryStore();
    const { toast } = useToast();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
   
    const displayedItem = useMemo(() => {
        const id = searchParams.get('id');
        if (id) {
            return getItem(id);
        }
        return null;
    }, [searchParams, getItem]);

    const groupedItems = useMemo(() => {
        const filteredItems = items.filter(item => 
            item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.productType && item.productType.toLowerCase().includes(searchTerm.toLowerCase())) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const groups: { [key: string]: InventoryItem[] } = {};
        const sortedItems = [...filteredItems].sort((a,b) => b.createdAt - a.createdAt);
        sortedItems.forEach(item => {
            const category = item.category || 'Без категория';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
        });
        return groups;
    }, [items, searchTerm]);

    
    const selectedItemId = searchParams.get('id');

    const getCurrencySymbol = (currencyCode?: string) => {
        if (!currencyCode) return "лв.";
        const upperCaseCode = currencyCode.toUpperCase();
        if (upperCaseCode === "BGN") return "лв.";
        if (upperCaseCode === "EUR") return "€";
        if (upperCaseCode === "USD") return "$";
        return currencyCode;
    };

    const translateCondition = (condition?: string): string => {
        if (!condition) return "";
        switch (condition) {
          case "new": return "Нов";
          case "used": return "Използван";
          case "for repair": return "За ремонт";
          case "for parts": return "За части";
          case "scrap": return "Скрап";
          default: return condition;
        }
    };
    
    const handleCopy = (text: string, subject: string) => {
        navigator.clipboard.writeText(text);
        toast({
          title: "Копирано!",
          description: `${subject} беше копиран в клипборда.`,
        });
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        toast({
          title: "Линкът е копиран!",
          description: "Забележка: Този линк ще работи само на вашето устройство.",
        });
    };

    const handleDownloadReport = async () => {
        if (items.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Няма продукти',
                description: 'Няма продукти в инвентара за генериране на отчет.',
            });
            return;
        }

        setIsGeneratingReport(true);
        try {
            const productsForReport = items.map(item => ({
                productName: item.productName,
                productType: item.productType,
                category: item.category,
                condition: translateCondition(item.condition),
                price: item.marketAnalysis?.usedPrice?.realisticOptimal ?? 0,
                currency: item.marketAnalysis?.currency ?? 'BGN',
                salesDescription: item.salesStrategy?.marketingPlan?.salesDescription ?? '',
            }));

            const result = await generateInventoryReport({ products: productsForReport });
            
            const blob = new Blob([result.htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'inventory-report.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast({
                title: 'Отчетът е генериран!',
                description: 'Файлът беше изтеглен успешно.',
            });

        } catch (error) {
            console.error('Failed to generate inventory report:', error);
            const errorMessage = error instanceof Error ? error.message : 'Не успяхме да създадем отчет. Моля, опитайте отново.';
            let toastTitle = 'Грешка при генериране на отчет';
            let toastDescription = 'Не успяхме да създадем отчет. Моля, опитайте отново.';
    
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
            setIsGeneratingReport(false);
        }
    };
    
    const handleClearInventory = () => {
        clearInventory();
        toast({
            title: 'Инвентарът е изчистен!',
            description: 'Всички продукти бяха премахнати.',
        });
        router.push('/');
    };

    const handleDeleteItem = (item: InventoryItem) => {
        removeItem(item.id);
        toast({
            title: 'Продуктът е изтрит!',
            description: `${item.productName} беше премахнат от инвентара.`,
        });
        router.push('/');
    };

    // Hydration guard: show a loading skeleton while IndexedDB data is being loaded
    // to prevent the flash of empty content that makes users think data was lost.
    if (!_hasHydrated) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-muted-foreground">Зареждане на инвентара...</p>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <div className="max-w-2xl mx-auto w-full">
                  <AnalysisUploader />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid lg:grid-cols-12 gap-8">
                <aside className="lg:col-span-4 xl:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Продуктов инвентар</CardTitle>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Търсене по име..."
                                    className="w-full pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[calc(100vh-28rem)]">
                                <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedItems)}>
                                    {Object.entries(groupedItems).length > 0 ? Object.entries(groupedItems).map(([category, products]) => (
                                        <AccordionItem value={category} key={category} className="border-b-0">
                                            <AccordionTrigger className="px-6">
                                                <div className="flex items-center gap-2">
                                                    <Folder className="w-5 h-5 text-primary" />
                                                    <span>{category} ({products.length})</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="flex flex-col gap-1 pl-6 pr-4">
                                                    {products.map(item => (
                                                        <Button
                                                            key={item.id}
                                                            variant={selectedItemId === item.id ? "secondary" : "ghost"}
                                                            className="w-full justify-start h-auto px-2 py-2"
                                                            onClick={() => router.push(`/?id=${item.id}`)}
                                                        >
                                                            <div className="flex items-center gap-3 w-full">
                                                                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-secondary rounded-md overflow-hidden">
                                                                    {item.originalImageDataUri ? <img src={item.originalImageDataUri} alt={item.productName} className="w-full h-full object-cover" /> : <Box className="w-6 h-6 text-muted-foreground" />}
                                                                </div>
                                                                <div className="flex flex-col overflow-hidden text-left">
                                                                    <span className="font-medium truncate text-sm">{item.productName}</span>
                                                                    <span className="text-xs text-muted-foreground truncate">{item.productType}</span>
                                                                    <span className="text-xs font-semibold text-primary">
                                                                        {getCurrencySymbol(item.marketAnalysis?.currency)}
                                                                        {item.marketAnalysis?.usedPrice?.realisticOptimal ?? 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </Button>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )) : (
                                      <p className="p-6 text-sm text-muted-foreground">Няма намерени продукти.</p>
                                    )}
                                </Accordion>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className='flex-col items-start p-4 gap-2'>
                            <Separator className="mb-2"/>
                            
                            <Button variant="outline" className="w-full" onClick={handleDownloadReport} disabled={isGeneratingReport}>
                                {isGeneratingReport ? <Loader2 className="animate-spin" /> : <FileDown />}
                                {isGeneratingReport ? 'Генериране...' : 'Изтегли отчет (HTML)'}
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full">
                                        <Trash2 />
                                        Изчисти инвентара
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Сигурни ли сте?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Това действие ще изтрие за постоянно всички продукти от инвентара. Тази операция не може да бъде отменена.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Отказ</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearInventory}>Изчисти</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                </aside>

                <main className="lg:col-span-8 xl:col-span-9">
                    {!displayedItem ? (
                        <div className="max-w-2xl mx-auto">
                          <AnalysisUploader />
                        </div>
                    ) : (() => {
                        const item = displayedItem;
                        const priceData = [
                            { name: "Нов", ...item.marketAnalysis?.newPrice },
                            { name: "Използван", ...item.marketAnalysis?.usedPrice },
                            { name: "За ремонт", ...item.marketAnalysis?.forRepairPrice },
                            { name: "За части", ...item.marketAnalysis?.forPartsPrice },
                            { name: "Скрап", ...item.marketAnalysis?.forScrapPrice },
                        ].map(p => ({
                            name: p.name,
                            min: p.min ?? 0,
                            max: p.max ?? 0,
                            realisticFast: p.realisticFast ?? 0,
                            realisticOptimal: p.realisticOptimal ?? 0,
                            realisticSlow: p.realisticSlow ?? 0,
                        }));
                        
                        const chartConfig = {
                            realisticFast: { label: "Бърза", color: "hsl(var(--chart-2))" },
                            realisticOptimal: { label: "Оптимална", color: "hsl(var(--chart-1))" },
                            realisticSlow: { label: "Сигурна", color: "hsl(var(--chart-5))" },
                        } satisfies ChartConfig;

                        const currencySymbol = getCurrencySymbol(item.marketAnalysis?.currency);
                        
                        const getPricePointsForCondition = (condition: string): PricePoints | undefined => {
                            if (!item.marketAnalysis) return undefined;
                            const c = condition.toLowerCase();
                            if (c.includes('нов')) return item.marketAnalysis.newPrice;
                            if (c.includes('използван')) return item.marketAnalysis.usedPrice;
                            if (c.includes('ремонт')) return item.marketAnalysis.forRepairPrice;
                            if (c.includes('части')) return item.marketAnalysis.forPartsPrice;
                            if (c.includes('скрап')) return item.marketAnalysis.forScrapPrice;
                            return item.marketAnalysis.usedPrice;
                        }
                        
                        const currentConditionPrices = getPricePointsForCondition(translateCondition(item.condition));

                        return (
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-3xl font-headline">{item.productName}</CardTitle>
                                            <CardDescription>{item.productType}</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Споделяне на продукт">
                                                <Share2 className="w-5 h-5" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Изтриване на продукт">
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Изтриване на продукт?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Сигурни ли сте, че искате да изтриете &quot;{item.productName}&quot;? Тази операция не може да бъде отменена.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Отказ</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteItem(item)}>Изтрий</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="multiple" defaultValue={['overview', 'marketing', 'pricing']} className="w-full space-y-4">
                                        
                                        <AccordionItem value="overview" className="border-none">
                                            <AccordionTrigger className="text-xl font-semibold p-4 bg-muted/50 rounded-lg hover:no-underline">
                                                <div className="flex items-center gap-2"><Box className="w-6 h-6 text-primary" />Преглед</div>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 pt-4">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                     <ProductCarousel images={
                                                        [item.originalImageDataUri, ...(item.presentationImages || [])].filter((url): url is string => !!url)
                                                     } />
                                                     <div className="space-y-6">
                                                        <Card>
                                                            <CardHeader><h3 className="font-semibold text-lg">Детайли за продукта</h3></CardHeader>
                                                            <CardContent className="space-y-4">
                                                                <div className='flex items-center gap-2 flex-wrap'>
                                                                    <Badge variant="outline">{item.category}</Badge>
                                                                    <Badge variant="default">{translateCondition(item.condition)}</Badge>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground italic">{item.conditionJustification}</p>
                                                            </CardContent>
                                                        </Card>
                                                        <Card>
                                                            <CardHeader><h3 className="font-semibold text-lg">Реалистична оценка ({translateCondition(item.condition)})</h3></CardHeader>
                                                            <CardContent className="space-y-4">
                                                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                                    <div className="flex items-center gap-2">
                                                                        <Zap className="w-4 h-4 text-green-500" />
                                                                        <span>Бърза продажба (1м.)</span>
                                                                    </div>
                                                                    <span className="font-semibold">{currencySymbol}{currentConditionPrices?.realisticFast ?? 'N/A'}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between p-3 rounded-md bg-primary/10 border border-primary/50">
                                                                    <div className="flex items-center gap-2 text-primary">
                                                                        <Target className="w-5 h-5" />
                                                                        <span className="font-semibold text-base">Оптимална продажба (3м.)</span>
                                                                    </div>
                                                                    <span className="font-bold text-xl text-primary">{currencySymbol}{currentConditionPrices?.realisticOptimal ?? 'N/A'}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock className="w-4 h-4 text-blue-500" />
                                                                        <span>Сигурна продажба (6м.)</span>
                                                                    </div>
                                                                    <span className="font-semibold">{currencySymbol}{currentConditionPrices?.realisticSlow ?? 'N/A'}</span>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <AccordionItem value="marketing" className="border-none">
                                            <AccordionTrigger className="text-xl font-semibold p-4 bg-muted/50 rounded-lg hover:no-underline">
                                                <div className="flex items-center gap-2"><ClipboardList className="w-6 h-6 text-primary" />Маркетинг</div>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 pt-4 space-y-6">
                                                {item.salesStrategy?.executiveSummary && (
                                                    <Card>
                                                        <CardHeader>
                                                            <div className="flex justify-between items-center">
                                                                <CardTitle className="flex items-center"><ClipboardList className="w-6 h-6 mr-2 text-primary" />Обобщен Анализ</CardTitle>
                                                                <div className="flex items-center gap-1">
                                                                    <TtsButton textToSpeak={item.salesStrategy.executiveSummary} />
                                                                    <Button variant="ghost" size="sm" onClick={() => handleCopy(item.salesStrategy!.executiveSummary, 'Обобщен Анализ')}><Copy className="w-4 h-4" /></Button>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted p-4 rounded-md">
                                                            {item.salesStrategy.executiveSummary}
                                                        </CardContent>
                                                    </Card>
                                                )}
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    {item.salesStrategy?.marketingPlan?.targetAudience && (
                                                        <Card>
                                                            <CardHeader>
                                                                <div className="flex justify-between items-center">
                                                                    <CardTitle className="flex items-center"><Users className="w-6 h-6 mr-2 text-primary" />Целева аудитория</CardTitle>
                                                                    <div className="flex items-center gap-1">
                                                                        <TtsButton textToSpeak={item.salesStrategy.marketingPlan.targetAudience} />
                                                                        <Button variant="ghost" size="sm" onClick={() => handleCopy(item.salesStrategy!.marketingPlan!.targetAudience, 'Целева аудитория')}><Copy className="w-4 h-4" /></Button>
                                                                    </div>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="text-sm text-muted-foreground bg-muted p-4 rounded-md h-full">
                                                                {item.salesStrategy.marketingPlan.targetAudience}
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                    {item.salesStrategy?.marketingPlan?.salesDescription && (
                                                        <Card>
                                                            <CardHeader>
                                                                <div className="flex justify-between items-center">
                                                                    <CardTitle className="flex items-center"><BookOpen className="w-6 h-6 mr-2 text-primary" />Описание за продажба</CardTitle>
                                                                    <div className="flex items-center gap-1">
                                                                        <TtsButton textToSpeak={item.salesStrategy.marketingPlan.salesDescription} />
                                                                        <Button variant="ghost" size="sm" onClick={() => handleCopy(item.salesStrategy!.marketingPlan!.salesDescription, 'Описание за продажба')}><Copy className="w-4 h-4" /></Button>
                                                                    </div>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="whitespace-pre-wrap text-sm border p-4 rounded-md h-full">
                                                                {item.salesStrategy.marketingPlan.salesDescription}
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <AccordionItem value="pricing" className="border-none">
                                            <AccordionTrigger className="text-xl font-semibold p-4 bg-muted/50 rounded-lg hover:no-underline">
                                                <div className="flex items-center gap-2"><BarChartIcon className="w-6 h-6 text-primary" />Ценови анализ</div>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 pt-4 space-y-6">
                                                {item.marketAnalysis?.analysisJustification && (
                                                     <Card>
                                                        <CardHeader>
                                                            <div className="flex justify-between items-center">
                                                                <CardTitle className="flex items-center"><Lightbulb className="w-6 h-6 mr-2 text-primary" />Обосновка на пазарния анализ</CardTitle>
                                                                <div className="flex items-center gap-1">
                                                                    <TtsButton textToSpeak={item.marketAnalysis.analysisJustification} />
                                                                    <Button variant="ghost" size="sm" onClick={() => handleCopy(item.marketAnalysis!.analysisJustification, 'Обосновка на пазарния анализ')}><Copy className="w-4 h-4" /></Button>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted p-4 rounded-md">
                                                            {item.marketAnalysis.analysisJustification}
                                                        </CardContent>
                                                    </Card>
                                                )}
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center"><BarChartIcon className="w-6 h-6 mr-2 text-primary" />Сравнение на реалистични цени</CardTitle>
                                                        <CardDescription>Сравнение на реалистичните цени за различните състояния.</CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                                                            <BarChart data={priceData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                                                                <CartesianGrid vertical={false} />
                                                                <XAxis
                                                                    dataKey="name"
                                                                    tickLine={false}
                                                                    tickMargin={10}
                                                                    axisLine={false}
                                                                />
                                                                <YAxis 
                                                                    tickFormatter={(value) => `${currencySymbol}${value}`}
                                                                />
                                                                <ChartTooltip
                                                                    cursor={false}
                                                                    content={<ChartTooltipContent />}
                                                                />
                                                                <Legend />
                                                                <Bar dataKey="realisticFast" fill="var(--color-realisticFast)" radius={4} name="Бърза" />
                                                                <Bar dataKey="realisticOptimal" fill="var(--color-realisticOptimal)" radius={4} name="Оптимална" />
                                                                <Bar dataKey="realisticSlow" fill="var(--color-realisticSlow)" radius={4} name="Сигурна" />
                                                            </BarChart>
                                                        </ChartContainer>
                                                    </CardContent>
                                                </Card>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </CardContent>
                            </Card>
                        );
                    })()}
                </main>
            </div>
        </div>
    );
}

export default function InventoryPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-muted-foreground">Зареждане на страницата...</p>
                </div>
            </div>
        }>
            <InventoryPageContent />
        </Suspense>
    );
}
