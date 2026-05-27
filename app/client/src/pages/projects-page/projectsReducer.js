const DEFAULT_TECH_COLOR =
    'bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-300';

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
    form: emptyForm,
    submitting: false,
    error: '',
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_PROJECTS':
            return {
                ...state,
                projects: action.payload,
            };
        case 'SET_TECHNOLOGIES':
            return {
                ...state,
                technologies: action.payload,
            };
        case 'ADD_PROJECT':
            return {
                ...state,
                projects: [action.payload, ...state.projects],
            };
        case 'ADD_TECHNOLOGY':
            return {
                ...state,
                technologies: [...state.technologies, action.payload],
            };
        case 'OPEN_FORM':
            return {
                ...state,
                formOpen: true,
                error: '',
            };
        case 'CLOSE_FORM':
            return {
                ...state,
                formOpen: false,
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
            return {
                ...state,
                submitting: true,
                error: '',
            };
        case 'SUBMIT_ERROR':
            return {
                ...state,
                submitting: false,
                error: action.payload,
            };
        case 'SUBMIT_SUCCESS':
            return {
                ...state,
                submitting: false,
                error: '',
                formOpen: false,
                form: emptyForm,
            };
    }
    throw Error('Unknown action: ' + action.type);
}

const TECH_COLOR_PRESETS = [
    { label: 'Slate', value: 'bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-300' },
    { label: 'Sky', value: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300' },
    { label: 'Emerald', value: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' },
    { label: 'Indigo', value: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' },
    { label: 'Amber', value: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
    { label: 'Rose', value: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300' },
    { label: 'Cyan', value: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300' },
    { label: 'Green', value: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' },
];

export { initialState, reducer, TECH_COLOR_PRESETS, DEFAULT_TECH_COLOR };
