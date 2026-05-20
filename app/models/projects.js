import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
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
    },
    {
        optimisticConcurrency: true,
    },
);

const ProjectModel = mongoose.model('Project', projectSchema);

export { ProjectModel };
