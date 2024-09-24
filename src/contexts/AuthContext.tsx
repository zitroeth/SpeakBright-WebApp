import { createContext, useEffect } from 'react';
import { useState, ReactNode } from 'react';
import { auth } from '../config/firebase';
import { User } from 'firebase/auth';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
            setLoading(false);
        })
        return unsubscribe;
    }, [])

    const value = {
        currentUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

const AuthContext = createContext<{
    // Type
    currentUser: User | null
}>({
    // Initial Value
    currentUser: null
});
export default AuthContext;