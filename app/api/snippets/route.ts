import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Snippet from '@/models/Snippet';

// GET all snippets
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const language = searchParams.get('language');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');

        let query: any = {};

        if (language) {
            query.language = language;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const snippets = await Snippet.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await Snippet.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: snippets,
            pagination: {
                total,
                limit,
                skip,
                hasMore: skip + snippets.length < total,
            },
        });
    } catch (error: any) {
        console.error('Error fetching snippets:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST create new snippet
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { title, description, language, code, tags } = body;

        if (!title || !language || !code) {
            return NextResponse.json(
                { success: false, error: 'Title, language, and code are required' },
                { status: 400 }
            );
        }

        const snippet = await Snippet.create({
            title,
            description,
            language,
            code,
            tags: tags || [],
        });

        return NextResponse.json(
            {
                success: true,
                data: snippet,
                message: 'Snippet created successfully',
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating snippet:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
