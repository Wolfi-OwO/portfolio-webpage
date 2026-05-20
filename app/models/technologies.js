import mongoose from 'mongoose';

const technologySchema = new mongoose.Schema({
    tech: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
});

const TechnologyModel = mongoose.model('Technology', technologySchema);

export { TechnologyModel };
