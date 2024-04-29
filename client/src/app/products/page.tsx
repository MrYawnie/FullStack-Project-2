"use client"
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Product, columns } from './columns'; // Make sure this is the correct path
import { ProductCard } from './product-card';
import { DataTable } from './data-table';

import { Input } from "@/components/ui/input";
import MultiRangeSlider from "@/components/multiRangeSlider/MultiRangeSlider";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import NavBar from '@/components/navbar';
import { SkeletonCard } from '@/components/skeletonCard';
import { Button } from '@/components/ui/button';


async function getData(searchTerm: string): Promise<{ data: Product[]; filterMaxPrice: number }> {
  const response = await axios.get(`https://api.janiandsten.com/api/v1/price-check/products?q=${searchTerm}`);
  const data = response.data;
  const filterMaxPrice = data.reduce((max: number, product: Product) => Math.max(max, product.price), 0);
  return { data, filterMaxPrice };
}

export default function ProductPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2600);
  const [filterMaxPrice, setFilterMaxPrice] = useState(2119);
  const [data, setData] = useState<Product[]>([]);
  const [filteredData, setFilteredData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data: fetchedData, filterMaxPrice: fetchedMaxPrice } = await getData(searchTerm); // Fetch data and maxPrice
      setData(fetchedData);
      setFilterMaxPrice(fetchedMaxPrice); // Update maxPrice
      setMaxPrice(fetchedMaxPrice); // Update maxPrice
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // This function updates the local filter term and filters the displayed data
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFilterTerm = event.target.value;
    setFilterTerm(newFilterTerm);
  };

  const handlePriceChange = (min: number, max: number) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  /* useEffect(() => {
    handleSearch();
  }, [searchTerm]); */

  useEffect(() => {
    const filtered = data.filter(item =>
      item.name.toLowerCase().includes(filterTerm.toLowerCase()) &&
      item.price >= minPrice &&
      item.price <= maxPrice
    );
    setFilteredData(filtered);
  }, [data, filterTerm, minPrice, maxPrice]);

  return (
    <div className="container mx-auto py-10">
      <NavBar />
      <div className="flex mb-3">
        <Input type="text" placeholder="Fetch products from DB (empty = fetch all)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <Button className='ms-2 rounded-md' onClick={handleSearch}>Search</Button>
      </div>
      <Tabs defaultValue='card'>
        <TabsList className='grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3'>
          <Input className='flex justify-center md:justify-start max-w-[300px] m-auto sm:m-0' type="text" placeholder="Filter products by name" value={filterTerm} onChange={handleFilterChange} />
          <MultiRangeSlider
            min={0}
            max={filterMaxPrice}
            onChange={({ min, max }: { min: number; max: number }) => handlePriceChange(min, max)}
          />
          <div className="flex justify-center sm:justify-end">
            <TabsTrigger value='card'>Card View</TabsTrigger>
            <TabsTrigger value='table'>Table View</TabsTrigger>
          </div>
        </TabsList>
        <TabsContent value='card'>
          {loading ? (
            <SkeletonCard />
        ) : (
            <ProductCard data={filteredData} />
          )}
        </TabsContent>
        <TabsContent value='table'>
          <DataTable columns={columns} data={filteredData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}