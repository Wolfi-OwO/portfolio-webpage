const TECH_COLOR_PRESETS = [
    { label: 'Slate',   value: 'bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-300' },
    { label: 'Sky',     value: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300' },
    { label: 'Blue',    value: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' },
    { label: 'Indigo',  value: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' },
    { label: 'Purple',  value: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300' },
    { label: 'Pink',    value: 'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-300' },
    { label: 'Red',     value: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' },
    { label: 'Orange',  value: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300' },
    { label: 'Yellow',  value: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' },
    { label: 'Green',   value: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' },
    { label: 'Emerald', value: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' },
    { label: 'Cyan',    value: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300' },
    { label: 'Neutral', value: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700/30 dark:text-neutral-200' },
];

const DEFAULT_TECH_COLOR = TECH_COLOR_PRESETS[0].value;

const emptyForm = {
    title: '',
    description: '',
    repositoryUrl: '',
    livedemo: '',
    selectedTechnologies: [],
    techQuery: '',
    newTechColor: DEFAULT_TECH_COLOR,
};

const initialState = {
    projects: [],
    technologies: [],
    formOpen: false,
    formMode: 'create',
    editingProjectId: null,
    form: emptyForm,
    submitting: false,
    error: '',
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_PROJECTS':
            return { ...state, projects: action.payload };
        case 'SET_TECHNOLOGIES':
            return { ...state, technologies: action.payload };
        case 'ADD_PROJECT':
            return { ...state, projects: [action.payload, ...state.projects] };
        case 'UPDATE_PROJECT':
            return {
                ...state,
                projects: state.projects.map(p =>
                    p._id === action.payload._id ? action.payload : p,
                ),
            };
        case 'REMOVE_PROJECT':
            return {
                ...state,
                projects: state.projects.filter(p => p._id !== action.payload),
            };
        case 'ADD_TECHNOLOGY':
            return { ...state, technologies: [...state.technologies, action.payload] };
        case 'OPEN_FORM_NEW':
            return {
                ...state,
                formOpen: true,
                formMode: 'create',
                editingProjectId: null,
                form: emptyForm,
                error: '',
            };
        case 'OPEN_FORM_EDIT': {
            const p = action.payload;
            return {
                ...state,
                formOpen: true,
                formMode: 'edit',
                editingProjectId: p._id,
                form: {
                    title: p.title || '',
                    description: p.description || '',
                    repositoryUrl: p.repositoryUrl || '',
                    livedemo: p.livedemo || '',
                    selectedTechnologies: (p.technologies || []).map(t => ({
                        _id: t._id,
                        tech: t.tech,
                        color: t.color,
                    })),
                    techQuery: '',
                    newTechColor: DEFAULT_TECH_COLOR,
                },
                error: '',
            };
        }
        case 'CLOSE_FORM':
            return {
                ...state,
                formOpen: false,
                formMode: 'create',
                editingProjectId: null,
                form: emptyForm,
                error: '',
                submitting: false,
            };
        case 'SET_FORM_FIELD':
            return {
                ...state,
                form: {
                    ...state.form,
                    [action.payload.field]: action.payload.value,
                },
            };
        case 'ADD_SELECTED_TECH':
            if (
                state.form.selectedTechnologies.some(
                    t => t.tech.toLowerCase() === action.payload.tech.toLowerCase(),
                )
            ) {
                return state;
            }
            return {
                ...state,
                form: {
                    ...state.form,
                    selectedTechnologies: [
                        ...state.form.selectedTechnologies,
                        action.payload,
                    ],
                    techQuery: '',
                },
            };
        case 'REMOVE_SELECTED_TECH':
            return {
                ...state,
                form: {
                    ...state.form,
                    selectedTechnologies: state.form.selectedTechnologies.filter(
                        (_t, index) => index !== action.payload,
                    ),
                },
            };
        case 'SUBMIT_START':
            return { ...state, submitting: true, error: '' };
        case 'SUBMIT_ERROR':
            return { ...state, submitting: false, error: action.payload };
        case 'SUBMIT_SUCCESS':
            return {
                ...state,
                submitting: false,
                error: '',
                formOpen: false,
                formMode: 'create',
                editingProjectId: null,
                form: emptyForm,
            };
    }
    throw Error('Unknown action: ' + action.type);
}

export { initialState, reducer, TECH_COLOR_PRESETS, DEFAULT_TECH_COLOR };
