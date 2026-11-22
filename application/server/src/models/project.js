import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            index: true,
        },
        description: {
            type: String,
            required: true,
        },
        repositoryUrl: {
            type: String,
            required: true,
        },
        livedemo: {
            type: String,
        },
        technologies: [
            {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'Technology',
            },
        ],
        // The same record in the other language, keyed by locale: { de: { description } }.
        // The fields above hold the language the record was written in.
        translations: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    {
        optimisticConcurrency: true,
        timestamps: true,
    },
);

const ProjectModel = mongoose.model('Project', projectSchema);

export { ProjectModel };
