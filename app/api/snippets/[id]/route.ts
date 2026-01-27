import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Snippet from '@/models/Snippet';

// GET single snippet
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        const snippet = await Snippet.findById(id);

        if (!snippet) {
            return NextResponse.json(
                { success: false, error: 'Snippet not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: snippet,
        });
    } catch (error: unknown) {
        console.error('Error fetching snippet:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

// PUT update snippet
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        const snippet = await Snippet.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!snippet) {
            return NextResponse.json(
                { success: false, error: 'Snippet not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: snippet,
            message: 'Snippet updated successfully',
        });
    } catch (error: unknown) {
        console.error('Error updating snippet:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

// DELETE snippet
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        const snippet = await Snippet.findByIdAndDelete(id);

        if (!snippet) {
            return NextResponse.json(
                { success: false, error: 'Snippet not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Snippet deleted successfully',
        });
    } catch (error: unknown) {
        console.error('Error deleting snippet:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
