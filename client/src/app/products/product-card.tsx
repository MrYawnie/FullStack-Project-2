"use client"
import * as React from "react"
import Image from "next/image"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

// Assuming you have a more defined type for your product data
interface Product {
    _id: string;
    id: string;
    store: string;
    name: string;
    price: number;
    specialPrice: number;
    historicalLow: number;
    imageUrl: string;
    url: string;
    updated: string;
    datetime: string;
    historicalLowDate: string;
}

// Updated props type for better type checking
export function ProductCard({ data }: { data: Product[] }) {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.map((item) => {
                    const date = new Date(item.updated ? item.updated : item.datetime).toLocaleDateString('fi-FI', { timeZone: 'Europe/Helsinki' });
                    const historicalLowDate = new Date(item.historicalLowDate).toLocaleDateString('fi-FI', { timeZone: 'Europe/Helsinki' });
                    const storeLogos: { [key: string]: string } = {
                        lastentarvike: '/lastentarvike.svg',
                        crocoliini: '/crocoliini.jpg',
                        lastenturva: '/lastenturva.png',
                    }
                    const logo = storeLogos[item.store];
                    const priceToUse = item.specialPrice ? item.specialPrice : item.price;

                    return (
                        <Card key={item._id}>
                            <CardHeader>
                                <CardTitle><a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a></CardTitle>
                                <CardDescription>{item.id}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <img src={item.imageUrl} alt={item.name} />
                                <p>Current price: {priceToUse} € <span className="text-xs">({date})</span></p>
                                {item.historicalLow && <p>Historical low: {item.historicalLow} € <span className="text-xs">({historicalLowDate})</span></p>}
                            </CardContent>
                            <CardFooter>
                                <Image className="" src={logo} alt={item.store + " logo"} width={160} height={37} />
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </>
    );
}