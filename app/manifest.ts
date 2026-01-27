import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Tounge Compiler',
        short_name: 'Tounge',
        description: 'A premium, lightweight code editor and compiler engine.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#3b82f6',
        icons: [
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
            {
                src: '/icon-small.png',
                sizes: '32x32',
                type: 'image/png',
            },
        ],
    }
}
