const initialState = {
    projects: [],
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_PROJECTS':
            return {
                ...state,
                projects: action.payload,
            };
    }
    throw Error('Unknown action: ' + action.type);
}

export { initialState, reducer };
