import mongoose, { Schema, models } from 'mongoose';

export interface ISnippet {
    _id?: string;
    title: string;
    description?: string;
    language: string;
    code: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

const SnippetSchema = new Schema<ISnippet>(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [100, 'Title cannot be more than 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot be more than 500 characters'],
        },
        language: {
            type: String,
            required: [true, 'Language is required'],
            trim: true,
        },
        code: {
            type: String,
            required: [true, 'Code is required'],
        },
        tags: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Create indexes for better query performance
SnippetSchema.index(
    { title: 'text', description: 'text', tags: 'text' },
    { default_language: 'none', language_override: 'none' }
);
SnippetSchema.index({ language: 1 });
SnippetSchema.index({ createdAt: -1 });

const Snippet = models.Snippet || mongoose.model<ISnippet>('Snippet', SnippetSchema);

export default Snippet;
