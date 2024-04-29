import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Product, columns } from './columns';
import { DataTable } from './data-table';

async function getData(): Promise<Product[]> {
    // Fetch data from your API here.
    const response = await axios.get('https://api.janiandsten.com/api/v1/price-check/products?q=');
    const data = response.data;
    return data;
  }
   
  export default async function ProductPage() {
    const data = await getData()
   
    return (
      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={data} />
      </div>
    )
  }