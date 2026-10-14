export interface User {
    id: number;
    username: string;
    doctor_id?: number | null;
    profile_id?: number | null;
    role?: string;
    name?: string;
    email?: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
    message?: string;
}
