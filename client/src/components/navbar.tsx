import React, { use } from 'react';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';

const NavBar: React.FC = () => {
    const currentPath = usePathname();

    // Function to determine if a link should have the outline variant
    const isOutlineVariant = (path: string) => {
        return currentPath !== path;
    };

    return (
        <nav>
            <ul className='flex flex-row justify-center mb-4'>
                <li className=''>
                    <a href="/">
                        <Button className='rounded-l-lg min-w-[200px]' variant={isOutlineVariant('/') ? "outline" : undefined}>
                            Scrape from Webstores
                        </Button>
                    </a>
                </li>
                <li className=''>
                    <a href="/products">
                        <Button className='rounded-r-lg w-[200px]' variant={isOutlineVariant('/products') ? "outline" : undefined}>
                            Fetch from DB
                        </Button>
                    </a>
                </li>
            </ul>
        </nav>
    );
}

export default NavBar;