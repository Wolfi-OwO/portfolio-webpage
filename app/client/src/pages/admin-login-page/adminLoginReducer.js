const initialState = {
    username: '',
    password: '',
    showPassword: false,
    error: '',
    submitting: false,
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_USERNAME':
            return {
                ...state,
                username: action.payload,
            };
        case 'SET_PASSWORD':
            return {
                ...state,
                password: action.payload,
            };
        case 'TOGGLE_PASSWORD_VISIBILITY':
            return {
                ...state,
                showPassword: !state.showPassword,
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
            };
    }
    throw Error('Unknown action: ' + action.type);
}

export { initialState, reducer };
