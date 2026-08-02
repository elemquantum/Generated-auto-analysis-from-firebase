'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCarouselProps {
  images: string[];
}

export function ProductCarousel({ images }: ProductCarouselProps) {
    const isLoading = !images || images.length === 0;
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);

    React.useEffect(() => {
        if (!api) {
            return;
        }

        setCurrent(api.selectedScrollSnap());
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    const handleDownload = () => {
        if (images && images[current]) {
            const link = document.createElement('a');
            link.href = images[current];
            link.download = `product-image-${current + 1}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

  return (
    <div className="relative">
        <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
            {isLoading ? (
                Array.from({ length: 1 }).map((_, index) => (
                    <CarouselItem key={index}>
                        <Card>
                        <CardContent className="flex aspect-square items-center justify-center p-0 bg-muted">
                           <Skeleton className="w-full h-full" />
                        </CardContent>
                        </Card>
                    </CarouselItem>
                ))
            ) : (
                images.map((src, index) => (
                <CarouselItem key={index}>
                    <Card>
                    <CardContent className="flex aspect-square items-center justify-center p-0">
                        <Image
                        src={src}
                        alt={`Product image ${index + 1}`}
                        width={800}
                        height={800}
                        className="rounded-lg object-contain w-full h-full"
                        />
                    </CardContent>
                    </Card>
                </CarouselItem>
                ))
            )}
        </CarouselContent>
        <CarouselPrevious className={cn("hidden sm:flex", images.length <= 1 && "hidden")} />
        <CarouselNext className={cn("hidden sm:flex", images.length <= 1 && "hidden")} />
        </Carousel>
        {!isLoading && (
             <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-4 right-4 z-10 rounded-full"
                onClick={handleDownload}
                aria-label="Изтегляне на изображението"
            >
                <Download className="h-5 w-5" />
            </Button>
        )}
    </div>
  );
}
