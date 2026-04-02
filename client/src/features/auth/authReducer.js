export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

export const initialState = {
    user: null,
    token: localStorage.getItem(TOKEN_KEY),
    loading: true,
    error: null
};

export function authReducer(state, action) {
    switch (action.type) {
        case 'AUTH_INIT':
            return { 
                ...state, 
                user: action.payload.user, 
                token: action.payload.token, 
                loading: false 
            };
        case 'LOGIN_SUCCESS':
            return { 
                ...state, 
                user: action.payload.user, 
                token: action.payload.token, 
                error: null 
            };
        case 'AUTH_ERROR':
            return { 
                ...state, 
                user: null, 
                token: null, 
                error: action.payload 
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null
            };
        case 'LOGOUT':
            return { 
                ...initialState, 
                token: null, 
                loading: false 
            };
        case 'FINISH_LOADING':
            return { 
                ...state, 
                loading: false 
            };
        default:
            return state;
    }
}
