"use client"

import { usePathname } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { use } from "react"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Product = {
    _id: string,
    store: string,
    id: string,
    name: string,
    price: number,
    specialPrice: number,
    historicalLow: number,
    url: string,
    imageUrl: string,
    datetime: string,
    updated: string,
    historicalLowDate: string,
    priceHistory: [{
        price: number,
        date: string,
    }],
}

export const columns: ColumnDef<Product>[] = [
    /* {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
    }, */
    {
        accessorKey: "store",
        header: ({ column }) => {
            return (
                <Button className='rounded-md'
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Store
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button className='rounded-md'
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return (
                <Button className='rounded-md' variant="ghost">
                    <a href={row.original.url} target="_blank" rel="noreferrer">{row.getValue("name")}</a>
                </Button>
            )
        },
    },
    {
        accessorKey: "price",
        header: ({ column }) => {
            return (
                <Button className='rounded-md'
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const amount = row.original.specialPrice ? parseFloat(row.original.specialPrice.toString()) : parseFloat(row.getValue("price"))
            const formatted = new Intl.NumberFormat("fi-FI", {
                style: "currency",
                currency: "EUR",
            }).format(amount)

            if (!row.original.priceHistory) {
                return <span>{formatted}</span>;
            }

            return (
                <Drawer>
                    <DrawerTrigger>
                        <Button className='rounded-md' variant="ghost">{formatted}</Button>
                    </DrawerTrigger>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>Price history for {row.getValue("name")}</DrawerTitle>
                            <DrawerClose />
                        </DrawerHeader>
                        <DrawerDescription>
                            <Table>
                                <TableCaption>Price history</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {row.original.priceHistory.slice().reverse().map((price) => (
                                        <TableRow key={price.date}>
                                            <TableCell>
                                                {new Intl.DateTimeFormat('fi-FI').format(new Date(price.date))}
                                            </TableCell>
                                            <TableCell>
                                                {new Intl.NumberFormat('fi-FI', {
                                                    style: 'currency',
                                                    currency: 'EUR'
                                                }).format(price.price)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </DrawerDescription>
                        <DrawerFooter>
                            <Button className='rounded-md' variant="ghost">Close</Button>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            )
        },
    },
    {
        accessorKey: "datetime",
        header: ({ column }) => {
            return (
                <Button className='rounded-md'
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Updated
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const product = row.original;
            const date = new Date(product.updated ? product.updated : product.datetime);
            return <div>{date.toLocaleDateString('fi-FI')}</div>
        },
    },
    {
        accessorKey: "imageUrl",
        header: "Image",
        cell: ({ row }) => {
            const url = row.getValue("imageUrl") as string;
            return <HoverCard>
                <HoverCardTrigger><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-image" viewBox="0 0 16 16">
                    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
                    <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z" />
                </svg></HoverCardTrigger>
                <HoverCardContent>
                    <img src={url} alt="Product image" />
                </HoverCardContent>
            </HoverCard>
        },
    },
    /* {
        accessorKey: "url",
        header: "Link",
        cell: ({ row }) => {
            const url = row.getValue("url") as string;
            return <a href={url} target="_blank" rel="noopener noreferrer">Product Site</a>
        },
    }, */

    {
        id: "actions",
        cell: ({ row }) => {
            const product = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-md">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(product.id.toString())}
                        >
                            Copy product ID
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(product.name.toString())}
                        >
                            Copy product name
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(product.url.toString())}
                        >
                            Copy website link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => {
                                // Here you can add your logic to remove the product from the database
                                console.log("Removing product with ID", product.id)
                                fetch(`https://fullstack-project-2.onrender.com/api/v1/price-check/delete/${product._id}`, {
                                    method: 'DELETE',
                                }).then(response => {
                                    if (!response.ok) {
                                        throw new Error('Network response was not ok');
                                    }
                                    // Here you can add your logic to update the UI after the product is removed
                                    console.log('Product removed from database');
                                    window.location.reload();
                                }).catch(error => {
                                    console.error('There has been a problem with your fetch operation:', error);
                                });
                            }}
                        >Remove from database</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    },
]